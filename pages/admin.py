from django.contrib import admin
from .models import Category, Product, Banner, Material, Color, Brand, Size, ProductType, ProductImage, Order, OrderItem

class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 1

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('name', 'price', 'category', 'is_active', 'is_featured', 'is_campaign')
    list_filter = ('is_active', 'is_featured', 'is_campaign', 'category')
    search_fields = ('name', 'description')
    inlines = [ProductImageInline]

admin.site.register(Category)
admin.site.register(Banner)
admin.site.register(Material)
admin.site.register(Color)
admin.site.register(Brand)
admin.site.register(Size)
admin.site.register(ProductType)
admin.site.register(Order)
admin.site.register(OrderItem)
