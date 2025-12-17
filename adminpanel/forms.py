from django import forms
from pages.models import Product, Category, Banner, Color, Size, Material, Brand

class ProductForm(forms.ModelForm):
    class Meta:
        model = Product
        fields = ['name', 'description', 'price', 'discounted_price', 'category', 'image', 'is_active', 'is_featured', 'is_campaign', 'material', 'color', 'brand', 'size', 'product_type', 'stock_status', 'stock_quantity']

class CategoryForm(forms.ModelForm):
    class Meta:
        model = Category
        fields = '__all__'

class BannerForm(forms.ModelForm):
    class Meta:
        model = Banner
        fields = '__all__'

class ColorForm(forms.ModelForm):
    class Meta:
        model = Color
        fields = '__all__'

class SizeForm(forms.ModelForm):
    class Meta:
        model = Size
        fields = '__all__'

class MaterialForm(forms.ModelForm):
    class Meta:
        model = Material
        fields = '__all__'

class BrandForm(forms.ModelForm):
    class Meta:
        model = Brand
        fields = '__all__'
