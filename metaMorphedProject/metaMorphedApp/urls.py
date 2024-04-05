from django.urls import path
from .views import auth_callback, load, uninstall, get_categories, get_products, get_brands, get_AI_product_data, product_template, update_products, check_premium

urlpatterns = [
    path('bigcommerce/callback/', auth_callback, name="auth_callback"),
    path('bigcommerce/load/', load, name="load"),
    path('bigcommerce/uninstall/', uninstall, name="uninstall"),
    path('get_categories/', get_categories, name="get_categories"),
    path('get_products/', get_products, name="get_products"),
    path('get_brands/', get_brands, name="get_brands"),
    path('get_AI_product_data/', get_AI_product_data, name="get_AI_product_data"),
    path('product_template/', product_template, name="product_template"),
    path('update_products/', update_products, name="update_products"),
    path('check_premium/', check_premium, name='check_premium'),
]