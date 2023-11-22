from django.db import models
from django.contrib.postgres import fields

# Create your models here.
class Store(models.Model):
    store_hash = models.CharField(max_length=16, unique= True)
    access_token = models.CharField(max_length=128, unique = True)
    scope = models.TextField()

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