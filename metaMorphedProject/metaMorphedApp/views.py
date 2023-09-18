from django.shortcuts import render, redirect
from bigcommerce.api import BigcommerceApi
from django.conf import settings
from .models import User, Store, StoreUser, ProductTemplate
from django.http import HttpResponse, HttpResponseRedirect, JsonResponse
from django.urls import reverse
import requests
import os
import openai
import json
from django.db import IntegrityError
from django.core import serializers


# Function called when app is downloaded on BigCommerce. 
# Function requests an access_token from bigCommerce, then creates an instance of store, user, and storeuser.
# Function then redirects to the main page
def auth_callback(request):
    code = request.GET['code']
    context = request.GET['context']
    scope = request.GET['scope']
    store_hash = context.split('/')[1]
    redirect = settings.APP_URL + 'bigcommerce/callback/'
    client = BigcommerceApi(client_id=client_id(), store_hash=store_hash)
    token = client.oauth_fetch_token(client_secret(), code, context, scope, redirect)
    bc_user_id = token['user']['id']
    email = token['user']['email']
    access_token = token['access_token']

    store = Store.objects.filter(store_hash=store_hash).first()
    if store is None:
        store = Store(store_hash=store_hash, access_token=access_token, scope=scope)
        store.save()
    else:
        store.access_token = access_token
        store.scope = scope
        store.save()
        oldadminuser = StoreUser.objects.filter(store_id=store.id, admin=True).first()
        if oldadminuser:
            oldadminuser.admin = False
            oldadminuser.save()

    user = User.objects.filter(bc_id=bc_user_id).first()
    if user is None:
        user = User(bc_id=bc_user_id, email=email)
        user.save()
    elif user.email != email:
        user.email = email
        user.save()

    storeuser = StoreUser.objects.filter(user_id=user.id, store_id=store.id).first()
    if not storeuser:
        storeuser = StoreUser(store=store, user=user, admin=True)
    else:
        storeuser.admin = True
    storeuser.save()

    request.session['storeuserid'] = storeuser.id
    return HttpResponseRedirect(settings.FRONT_END_URL)



# Function called when app is loaded from bigCommerce store
# Function verify's user using jwt
# Function then redirects to the main page
def load(request):
    payload = request.GET['signed_payload_jwt']
    try:
        user_data = BigcommerceApi.oauth_verify_payload_jwt(payload, client_secret(), client_id())
    except Exception as e:
        return jwt_error(e)

    bc_user_id = user_data['user']['id']
    email = user_data['user']['email']
    store_hash = user_data['sub'].split('stores/')[1]

    store = Store.objects.filter(store_hash=store_hash).first()
    if store is None:
        return HttpResponse("Store not found!", status=401)

    user = User.objects.filter(bc_id=bc_user_id).first()
    if user is None:
        user = User(bc_id=bc_user_id, email=email)
        user.save()
    storeuser = StoreUser.objects.filter(user_id=user.id, store_id=store.id).first()
    if storeuser is None:
        storeuser = StoreUser(store=store, user=user)
        storeuser.save()

    request.session['storeuserid'] = storeuser.id
    return HttpResponseRedirect(settings.FRONT_END_URL)


def uninstall(request):
    payload = request.GET['signed_payload_jwt']
    try:
        user_data = BigcommerceApi.oauth_verify_payload_jwt(payload, client_secret(), client_id())
    except Exception as e:
        return jwt_error(e)

    store_hash = user_data['sub'].split('stores/')[1]
    store = Store.objects.filter(store_hash=store_hash).first()
    if store is None:
        return HttpResponse("Store not found!", status=401)

    storeusers = StoreUser.objects.filter(store_id=store.id)
    for storeuser in storeusers:
        storeuser.delete()
    store.delete()

    return HttpResponse('Deleted', status=204)


def remove_user(request):
    payload = request.GET['signed_payload_jwt']
    try:
        user_data = BigcommerceApi.oauth_verify_payload_jwt(payload, client_secret(), client_id())
    except Exception as e:
        return jwt_error(e)

    store_hash = user_data['sub'].split('stores/')[1]
    store = Store.objects.filter(store_hash=store_hash).first()
    if store is None:
        return HttpResponse("Store not found!", status=401)

    bc_user_id = user_data['user']['id']
    user = User.objects.filter(bc_id=bc_user_id).first()
    if user is not None:
        storeuser = StoreUser.objects.filter(user_id=user.id, store_id=store.id).first()
        storeuser.delete()

    return HttpResponse('Deleted', status=204)


# Function checks session to see if user is logged in
# Function then renders the main page, 
def index(request):
    storeuser = StoreUser.objects.filter(id=request.session.get('storeuserid', None)).first()
    if storeuser is None:
        return HttpResponse("Not logged in!", status=401)
    store = storeuser.store
    user = storeuser.user

    client = BigcommerceApi(client_id=client_id(),
                            store_hash=store.store_hash,
                            access_token=store.access_token)

    products = client.Products.iterall()

    context = {
        'products': products,
        'user': user,
        'store': store,
        'client_id': client_id(),
        'api_url': client.connection.host
    }
    return render(request, 'index.html', context)


def jwt_error(e):
    print(f"JWT verification failed: {e}")
    return HttpResponse("Payload verification failed!", status=401)


def client_id():
    return settings.BIGCOMMERCE_CLIENT_ID


def client_secret():
    return settings.BIGCOMMERCE_CLIENT_SECRET


def get_categories(request):
    storeuser = StoreUser.objects.filter(id=request.session.get('storeuserid', None)).first()
    if storeuser is None:
        return JsonResponse({"response": "Not logged in!"})
    store = storeuser.store
    url = f"https://api.bigcommerce.com/stores/{store.store_hash}/v3/catalog/trees/categories"
    headers = {
        "accept": "application/json",
        "Content-type": "application/json",
        "X-Auth-Token": f"{store.access_token}",
        "Access-Control-Allow-Origin": "http://localhost:3003",
        "Access-Control-Allow-Credentials": 'true',
        }
    res = requests.get(url, headers = headers)
    categoryList = res.json()['data']
    categories = {}
    for category in categoryList:
        categories[category['category_id']] = category['name']
    return JsonResponse({"categories": categories})

def get_products(request):
    storeuser = StoreUser.objects.filter(id=request.session.get('storeuserid', None)).first()
    if storeuser is None:
        return HttpResponse("User not logged in!", status=401)
    store = storeuser.store
    url = f"https://api.bigcommerce.com/stores/{store.store_hash}/v3/catalog/products"
    headers = {
        "Accept": "application/json", 
        "Content-Type": "application/json", 
        "X-Auth-Token": f"{store.access_token}",
        "Access-Control-Allow-Origin": "http://localhost:3003",
        "Access-Control-Allow-Credentials": 'true'
        }
    params = {'include': 'images, variants'}
    res = requests.get(url, headers = headers, params = params)
    products = res.json()['data']
    return JsonResponse({'products': products})

def update_products(request):
    storeuser = StoreUser.objects.filter(id=request.session.get('storeuserid', None)).first()
    if storeuser is None:
        return HttpResponse("User not logged in!", status=401)
    store = storeuser.store
    bigCommerceUrl = f"https://api.bigcommerce.com/stores/{store.store_hash}/v3/catalog/products"
    bigCommerceheaders = {
        "Accept": "application/json", 
        "Content-Type": "application/json", 
        "X-Auth-Token": f"{store.access_token}",
        "Access-Control-Allow-Origin": "http://localhost:3003",
        "Access-Control-Allow-Credentials": 'true'
    }
    
    try:
        data = json.loads(request.body.decode('utf-8'))
        products = data.get("products")
        template = data.get("template")
        for product in products:
            # Do something
            print(product)
        return JsonResponse({"message": "Products Successfully Updated"})
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)
    


def get_brands(request):
    storeuser = StoreUser.objects.filter(id=request.session.get('storeuserid', None)).first()
    if storeuser is None:
        return JsonResponse({"response": "Not logged in!"})
    store = storeuser.store
    url = f"https://api.bigcommerce.com/stores/{store.store_hash}/v3/catalog/brands"
    headers = {
        "accept": "application/json",
        "Content-type": "application/json",
        "X-Auth-Token": f"{store.access_token}",
        "Access-Control-Allow-Origin": "http://localhost:3003",
        "Access-Control-Allow-Credentials": 'true',
        }
    res = requests.get(url, headers = headers)
    brandList = res.json()['data']
    brands = {}
    for brand in brandList:
        brands[brand['id']] = brand['name']
    return JsonResponse({"brands": brands})

def get_AI_product_data(request):
    storeuser = StoreUser.objects.filter(id=request.session.get('storeuserid', None)).first()
    if storeuser is None:
        return JsonResponse({"response": "Not logged in!"})
    data = json.loads(request.GET.get("data"))
    print("DATA", data)
    model = "gpt-3.5-turbo"
    key=os.environ["CHATGPT_API_KEY"]
    system_prompt = """
                    You are an experienced E-Commerce copywriter. Your task is to provide improved product attributes using the given data. 
                    You should generate "new" data based on the "old" data, the provided "prompt", and the "additional_product_info". 
                    Your output should be an object with one less key than the input, excluding the "additional_product_info" key. 
            
                       
    Example Input 1: {"name": {"old": old name, "prompt": "create an improved product name"}, 
                    "description": {"old": old description, "prompt": "create an improved description"},
                    "page_title": {"old": old page title, "prompt": "create an improved page title"},
                    "meta_keywords": {"old": old meta keywords, "prompt": "create improved meta keywords"},
                    "meta_description": {"old": old meta description, "prompt": "create an improved meta description"},
                    "additional_product_info": {"brand": "example brand", "categories":["example category 1", "example category 2"]}}
                    
    Example Output 1: {"name": {"new": "new improved product name"},
                    "description": {"new": "new improved product description"},
                    "page_title": {"new": "new improved product page title"},
                    "meta_keywords": {"new": "new improved product meta keywords"},
                    "meta_description": {"new": "new improved product meta description"}}
                    
    Example Input 2:  {"name": {"old": old name, "prompt": "create an improved product name"}, 
                    "additional_product_info": {"brand": "example brand", "categories":["example category 1", "example category 2"], "description": "example description about the product"}}
                    
    Example Output 2: {"name": {"new": "new improved product name"}}"""
                    
    user_prompt = str(data)
    openai.api_key = key
    completion = openai.ChatCompletion.create(
        model=model,
        messages=[
            {"role":"system", "content": system_prompt},
             {"role":"user", "content": user_prompt}
        ],
        temperature=0.0
    )
    output_string = completion["choices"][0].message.content
    print("output string", output_string)                         
    output_dict = json.loads(output_string.replace("'", '"'))
    new_attributes = {}
    for key, value in output_dict.items():
        if "new" in value:
            new_attributes[key] = {"new": value["new"]}
    return JsonResponse({"new_attributes": new_attributes})

def product_template(request, templateID = None):
    storeuser = StoreUser.objects.filter(id=request.session.get('storeuserid', None)).first()
    if storeuser is None:
        return JsonResponse({"response":"Not logged in!"})

    if request.method == "POST":
        content = json.loads(request.body)
        try:
            content['store'] = storeuser.store
            ProductTemplate.objects.create(**content),
            return JsonResponse({"message": "Product Template Created"})
        
        except IntegrityError:
            response = JsonResponse({"message": "Template Name already in use"})
            response.status_code = 403
            return response

        except Exception: 
            response = JsonResponse({"message": "Could not create Product Template"})
            response.status_code = 400
            return response
        
    elif request.method == "GET":
        if templateID:
            template = ProductTemplate.objects.get(id=templateID)
            return JsonResponse({"template": template})
        else:
            templates_queryset = ProductTemplate.objects.all()
            serialized_templates = serializers.serialize("json", templates_queryset)
            templates = {}
            for template in json.loads(serialized_templates):
                templates[template["pk"]] = template["fields"]
            return JsonResponse({"templates": templates})
    
    # elif request.method == "PUT":
    #     content = json.loads(request.body)
    #     ProductTemplate.objects.filter(id=templateID).update(**content)
    #     return JsonResponse({"message": "Template Updated"})
        
    elif request.method == "DELETE":
        ProductTemplate.objects.filter(id=templateID).delete()
        return JsonResponse({"message": "Product Template Deleted"})