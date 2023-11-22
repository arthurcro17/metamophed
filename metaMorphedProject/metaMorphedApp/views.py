from django.shortcuts import render, get_object_or_404
from bigcommerce.api import BigcommerceApi
from django.conf import settings
from .models import Store, ProductTemplate
from django.http import HttpResponse, HttpResponseRedirect, JsonResponse
import requests
import os
import openai
import json
from django.db import IntegrityError
from django.core import serializers
import logging

logger = logging.getLogger(__name__)



def big_commerce_url(store_hash, url_ending):
    return f"https://api.bigcommerce.com/stores/{store_hash}/v3/catalog/{url_ending}"

def big_commerce_headers(access_token):
    return {
        "accept": "application/json",
        "Content-Type": "application/json",
        "X-Auth-Token": f"{access_token}",
        "Access-Control-Allow-Origin": "http://localhost:3003",
        "Access-Control-Allow-Credentials": 'true',
        }

# Function called when app is downloaded on BigCommerce. 
# Requests an access_token from bigCommerce, creates an
# instance of store, and then redirects to the main page
def auth_callback(request):
    try: 
        # Checks to make sure auth_callback call contains required information

        code = request.GET.get('code', '')
        context = request.GET.get('context', '')
        scope = request.GET.get('scope', '')
        if not code or not context or not scope:
            return HttpResponse("Missing required parameters", status=400)
        
        # Using given information, requests an access token from BigCommerce

        token_data = {
            "client_id": settings.BIGCOMMERCE_CLIENT_ID,
            "client_secret": settings.BIGCOMMERCE_CLIENT_SECRET,
            "code": code,
            "context": context,
            "scope": scope,
            "grant_type": "authorization_code",
            "redirect_uri": settings.APP_URL + 'bigcommerce/callback/'
            }
        response = requests.post(
            "https://login.bigcommerce.com/oauth2/token",
            json=token_data,
            headers={
                "Accept": "application/json", 
                "Content-Type": "application/json"}
        )
        if response.status_code != 200:
            logger.error(f"OAuth2 token exchange failed with status {response.status_code}. Response: {response.text}")
            return HttpResponse("Error in OAth2 token exchange", status=400)
        data = response.json()
        access_token = data.get("access_token", "")

        if access_token:
            
            # Creates or updates store once we have a token

            store_hash = context.split('/')[1]
            store, created = Store.objects.update_or_create(
                store_hash=store_hash, 
                defaults = {
                    'access_token': access_token, 
                    'scope': scope})
            if not created:
                store.save()

            # Stores token in session

            request.session["access_token"] = access_token
            return HttpResponseRedirect(settings.FRONT_END_URL)
        else:
            return HttpResponse("No access token provided", status=400)
    except Exception as e:
        logger.exception(f"An errpr occured in auth_callback: {e}")
        return HttpResponse("An internal error occurred", status=500)


# Function called when app is loaded from bigCommerce store,
# verify's user using jwt, and then redirects to the main page
def load(request):
    try: 
        # Checks to make sure bigCommerce payload was received correctly
        payload = request.GET['signed_payload_jwt']
        try:
            user_data = BigcommerceApi.oauth_verify_payload_jwt(payload, settings.BIGCOMMERCE_CLIENT_SECRET, settings.BIGCOMMERCE_CLIENT_ID)
        except Exception as e:
            return jwt_error(e)
        store_hash = user_data['sub'].split('stores/')[1]

        # Checks that store is already created and in database

        store = get_object_or_404(Store, store_hash=store_hash)
        
        # Stores access_token in session

        request.session['access_token'] = store.access_token
        return HttpResponseRedirect(settings.FRONT_END_URL)
    except Exception as e:
        logger.exception(f"An error occured in load: {e}")
        return HttpResponse("An internal error occured", status=500)

# Function called when user uninstalls app from BigCommerce Portal
def uninstall(request):
    try: 
        # Confirms the payload from BigCommerce is valid
        payload = request.GET['signed_payload_jwt']
        try:
            user_data = BigcommerceApi.oauth_verify_payload_jwt(payload, settings.BIGCOMMERCE_CLIENT_SECRET, settings.BIGCOMMERCE_CLIENT_ID)
        except Exception as e:
            return jwt_error(e)
        
        # Deletes the store from the database (bye bye data)

        store_hash = user_data['sub'].split('stores/')[1]
        store = get_object_or_404(Store, store_hash=store_hash)
        store.delete()
        return HttpResponse('Deleted', status=204)
    except Exception as e:
        logger.exception(f"An error occurred in uninstall: {e}")
        return HttpResponse("An Internal error occurred", status=500)


# Function checks session to see if user is logged in
# and then renders the main page,
def landing_page(request):
    access_token = request.session.get("access_token", "")
    if not access_token:
        return HttpResponse("Unauthorized", status=401)
    
    store = get_object_or_404(Store, access_token=access_token)

    client = BigcommerceApi(client_id=settings.BIGCOMMERCE_CLIENT_ID,
                            store_hash=store.store_hash,
                            access_token=store.access_token)
    products = client.Products.iterall()
    context = {
        'products': products,
        'store': store,
        'client_id': settings.BIGCOMMERCE_CLIENT_ID,
        'api_url': client.connection.host
    }
    return render(request, 'index.html', context)


def jwt_error(e):
    print(f"JWT verification failed: {e}")
    return HttpResponse("Payload verification failed!", status=401)


def get_categories(request):
    try: 
        store = get_object_or_404(Store, access_token=request.session.get("access_token", None))
        res = requests.get(
            big_commerce_url(store.store_hash, "trees/categories"), 
            headers = big_commerce_headers(store.access_token)
            )
        categoryList = res.json()['data']
        categories = {}
        for category in categoryList:
            categories[category['category_id']] = category['name']
        return JsonResponse({"categories": categories})
    except Exception as e:
        logger.exception(f"An error occurred in get_categories: {e}")
        return HttpResponse("An internal error occurred", status=500)

def get_products(request):
    store = get_object_or_404(Store, access_token=request.session.get("access_token", None))
    res = requests.get(
        url=big_commerce_url(store.store_hash, "products"), 
        headers =  big_commerce_headers(store.access_token),
        params = {'include': 'images, variants'}
        )
    products = res.json()['data']
    return JsonResponse({'products': products})

def update_products(request):
    store = get_object_or_404(Store, access_token=request.session.get("access_token", None))
    try:
        data = json.loads(request.body.decode('utf-8'))
        products = data.get("products")
        templateID = data.get("templateID")
        brands = data.get("brands")
        categories = data.get("categories")
        template = get_object_or_404(ProductTemplate, pk=templateID)
        meta_fields = template._meta.fields
        fields = [str(field).split('.')[-1] for field in meta_fields if str(field).split('.')[-1] not in ['store', 'template_name', 'id', 'additional_product_info']]
        for full_product in products:
            product = {}
            product['name'] = full_product['name']
            product['type'] = full_product['type']
            product['weight'] = full_product['weight']
            product['price'] = full_product['price']
            data = {}
            data['additional_product_info'] = {field:full_product[field] for field in template.additional_product_info}
            if 'categories' in data['additional_product_info']:
                data['additional_product_info']['categories'] = [categories[str(id)] for id in data['additional_product_info']['categories']]
            if 'brand_id' in data['additional_product_info']:
                data['additional_product_info']['brand_id'] = brands[str(data['additional_product_info']['brand_id'])]
            for field in fields:
                if getattr(template, field):
                    data[field] = {"old":full_product[field], "prompt": getattr(template, field)}

            ai_data_response = get_AI_product_data(request, data=data)
            if ai_data_response.status_code != 200:
                return JsonResponse({'error': 'Failed to updated product with AI'}, status=500)
            ai_data = json.loads(ai_data_response.content.decode('utf-8'))
            attributes = ai_data["new_attributes"]
            for attribute in attributes.keys():
                product[attribute] = attributes[attribute]['new']
            if 'meta_keywords' in product.keys():
                product['meta_keywords'] = product['meta_keywords'].split(', ')
            try:
                res = requests.put(
                    url=big_commerce_url(store.store_hash, f"products/{full_product['id']}"),
                    headers=big_commerce_headers(store.access_token),
                    json=product)
                different_values = {key:[value,res.json()['data'][key]] for [key, value] in product.items() if value != res.json()['data'][key]}
                print('DIFFERENT VALUES', different_values)

            except Exception as e:
                logger.exception(f"An error occurred when trying to update product {product['id']} in update_products: {e}")
                return HttpResponse("An internal error occurred", status=500)

        return JsonResponse({"message": "Products Successfully Updated"})
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)
    

def get_brands(request):
    try:
        store = get_object_or_404(Store, access_token=request.session.get("access_token", None))
        res = requests.get(
            url = big_commerce_url(store.store_hash, "brands"), 
            headers = big_commerce_headers(store.access_token))
        brandList = res.json()['data']
        brands = {}
        for brand in brandList:
            brands[brand['id']] = brand['name']
        return JsonResponse({"brands": brands})
    except Exception as e:
        logger.exception(f"An error occurred in get_brands: {e}")
        return HttpResponse("An internal error occurred.", status=500)

def get_AI_product_data(request, data=None):
    try:
        store = Store.objects.filter(access_token=request.session.get("access_token", None)).first()
        if store is None:
            return JsonResponse({"response": "Not logged in!"})
        
        if not data:
            data = json.loads(request.GET.get("data"))
        model = "gpt-3.5-turbo"
        key=os.environ.get("CHATGPT_API_KEY", "")
        if not key:
            logger.error("OpenAI API key not found in environment.")
            return HttpResponse("Internal Server Error", status=500)
        system_prompt = """
                        You are an experienced E-Commerce copywriter. Your task is to provide improved product attributes using the given data. 
                        You should generate "new" data based on the "old" data, the provided "prompt", and the "additional_product_info". 
                        Your output should be an object with one less key than the input, excluding the "additional_product_info" key. 
                        Additionally, your output should be in proper JSON format.
                
                        
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
        output_dict = json.loads(output_string)
        new_attributes = {}
        for key, value in output_dict.items():
            if "new" in value:
                new_attributes[key] = {"new": value["new"]}
        return JsonResponse({"new_attributes": new_attributes})
    except Exception as e:
        logger.exception(f"An error occurred in get_AI_product_data: {e}")
        return HttpResponse("An internal error occurred.", status=500)

def product_template(request, templateID = None):
    store = Store.objects.filter(access_token=request.session.get("access_token", None)).first()
    if store is None:
        return JsonResponse({"response":"Not logged in!"})

    if request.method == "POST":
        content = json.loads(request.body)
        try:
            content['store'] = store
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