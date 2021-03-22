from django.contrib import admin
from .models import *
# Register your models here.




class UserAdmin(admin.ModelAdmin):
    list_display =  [ 'id','first_name','last_name','username']
    fieldsets = (
        ('Required Information', {
            'fields': ('username','email','password')
        }),
        ('Personal Information  (Optional)', {
            'fields':  (('first_name', 'last_name'),)
        }),
    )
    ordering = ['id']


admin.site.register(Email)
admin.site.register(User,UserAdmin)