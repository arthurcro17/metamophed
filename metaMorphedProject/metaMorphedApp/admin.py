from django.contrib import admin

# Register your models here.
from .models import *

@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    pass

@admin.register(Store)
class StoreAdmin(admin.ModelAdmin):
    pass

@admin.register(StoreUser)
class StoreUserAdmin(admin.ModelAdmin):
    pass

@admin.register(ProductTemplate)
class ProductTemplateAdmin(admin.ModelAdmin):
    pass