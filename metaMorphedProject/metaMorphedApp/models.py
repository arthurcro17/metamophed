from django.db import models
from django.contrib.postgres import fields

# Create your models here.
class User(models.Model):
    bc_id = models.IntegerField()
    email = models.CharField(max_length=120)
    username = models.CharField(max_length = 30)

    def __repr(self):
        return '<User id= %d bc_id= %d email=%s' % (self.id, self.bc_id, self.email)
    
class StoreUser(models.Model):
    store = models.ForeignKey('Store', on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    admin = models.BooleanField(default=False)

    def __repr__(self):
        return '<StoreUser id:%d email=%s user_id=%d store_id=%d admin=%s>' \
        % (self.id, self.user.email, self.user_id, self.store.store_id, self.admin)

class Store(models.Model):
    store_hash = models.CharField(max_length=16, unique=True)
    access_token = models.CharField(max_length=128)
    scope = models.TextField()
    admin_storeuser_id = models.ForeignKey(StoreUser, on_delete=models.CASCADE, related_name='store_user_admin', null=True)
    storeusers = models.ManyToManyField(StoreUser, related_name='stores')

    def __repr__(self):
        return '<Store id=%d store_hash=%s access_token=%s scope=%s>' \
               % (self.id, self.store_hash, self.access_token, self.scope)

class ProductTemplate(models.Model):
    template_name = models.CharField(max_length=128)
    name = models.TextField()
    description = models.TextField()
    page_title = models.TextField()
    meta_description = models.TextField()
    meta_keywords = models.TextField()
    additional_product_info = fields.ArrayField(models.CharField(max_length=64), default=list)
    store = models.ForeignKey(Store, on_delete=models.CASCADE)

    class Meta:
        unique_together = ('template_name', 'store')
    
    def __repr__(self):
        return 'Name: ' + self.template_name + ' Store: ' + str(self.store.id)
    
    def __str__(self):
        return 'Name: ' + self.template_name + ', Store: ' + str(self.store.id)