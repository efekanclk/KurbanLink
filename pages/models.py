from django.db import models
from django.utils.text import slugify
from django.core.validators import MinValueValidator, FileExtensionValidator
from decimal import Decimal
from accounts.models import Address
import os
from django.core.exceptions import ValidationError

def validate_file_size(value):
    filesize = value.size
    
    if filesize > 5 * 1024 * 1024:  # 5MB limit
        raise ValidationError("Dosya boyutu 5MB'dan büyük olamaz.")

def validate_image_extension(value):
    ext = os.path.splitext(value.name)[1]
    valid_extensions = ['.jpg', '.jpeg', '.png', '.webp']
    if not ext.lower() in valid_extensions:
        raise ValidationError('Sadece jpg, jpeg, png ve webp dosyaları yükleyebilirsiniz.')

class Category(models.Model):
    name = models.CharField(max_length=100, verbose_name="Kategori Adı")
    slug = models.SlugField(unique=True, blank=True)
    image = models.ImageField(
        upload_to='categories/', 
        verbose_name="Kategori Resmi",
        validators=[validate_file_size, validate_image_extension]
    )

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    class Meta:
        verbose_name = "Kategori"
        verbose_name_plural = "Kategoriler"

class Material(models.Model):
    name = models.CharField(max_length=100, verbose_name="Malzeme Adı")

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = "Malzeme"
        verbose_name_plural = "Malzemeler"

class Color(models.Model):
    name = models.CharField(max_length=50, verbose_name="Renk Adı")

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = "Renk"
        verbose_name_plural = "Renkler"

class Brand(models.Model):
    name = models.CharField(max_length=100, verbose_name="Marka Adı")

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = "Marka"
        verbose_name_plural = "Markalar"

class Size(models.Model):
    name = models.CharField(max_length=50, verbose_name="Boyut Adı")

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = "Boyut"
        verbose_name_plural = "Boyutlar"

class ProductType(models.Model):
    name = models.CharField(max_length=100, verbose_name="Ürün Tipi")

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = "Ürün Tipi"
        verbose_name_plural = "Ürün Tipleri"

class Product(models.Model):
    name = models.CharField(max_length=200, verbose_name="Ürün Adı")
    description = models.TextField(verbose_name="Açıklama")
    price = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(Decimal('0.01'))], verbose_name="Fiyat")
    discounted_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, validators=[MinValueValidator(Decimal('0.01'))], verbose_name="İndirimli Fiyat")
    category = models.ForeignKey(Category, on_delete=models.CASCADE, verbose_name="Kategori")
    image = models.ImageField(
        upload_to='products/', 
        verbose_name="Ürün Resmi",
        validators=[validate_file_size, validate_image_extension]
    )
    is_active = models.BooleanField(default=True, verbose_name="Aktif")
    is_featured = models.BooleanField(default=False, verbose_name="Öne Çıkan")
    is_campaign = models.BooleanField(default=False, verbose_name="Kampanyalı")
    material = models.ForeignKey(Material, on_delete=models.SET_NULL, null=True, blank=True, verbose_name="Malzeme")
    color = models.ForeignKey(Color, on_delete=models.SET_NULL, null=True, blank=True, verbose_name="Renk")
    brand = models.ForeignKey(Brand, on_delete=models.SET_NULL, null=True, blank=True, verbose_name="Marka")
    size = models.ForeignKey(Size, on_delete=models.SET_NULL, null=True, blank=True, verbose_name="Boyut")
    product_type = models.ForeignKey(ProductType, on_delete=models.SET_NULL, null=True, blank=True, verbose_name="Ürün Tipi")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    visit_count = models.PositiveIntegerField(default=0)
    stock_quantity = models.PositiveIntegerField(default=0, verbose_name="Stok Miktarı")
    stock_status = models.CharField(
        max_length=20,
        choices=[('available', 'Stokta Var'), ('limited', 'Sınırlı Stok'), ('out', 'Stokta Yok')],
        default='available',
        verbose_name='Stok Durumu'
    )

    def __str__(self):
        return self.name

    @property
    def discount_percentage(self):
        if self.discounted_price and self.price:
            discount = ((self.price - self.discounted_price) / self.price) * 100
            return round(discount)
        return None

    def get_main_image(self):
        """Ana resmi döndürür, yoksa ilk resmi veya varsayılan resmi döndürür"""
        main_image = self.images.filter(is_main=True).first()
        if main_image:
            return main_image.image
        # Ana resim yoksa ilk resmi döndür
        first_image = self.images.first()
        if first_image:
            return first_image.image
        # Hiç resim yoksa mevcut image field'ı döndür
        return self.image

    def get_all_images(self):
        """Tüm resimleri sıralı şekilde döndürür"""
        return self.images.all().order_by('order')

    class Meta:
        verbose_name = "Ürün"
        verbose_name_plural = "Ürünler"
        ordering = ['-created_at']

class ProductImage(models.Model):
    product = models.ForeignKey(Product, related_name='images', on_delete=models.CASCADE, verbose_name="Ürün")
    image = models.ImageField(
        upload_to='products/', 
        verbose_name="Ürün Resmi",
        validators=[validate_file_size, validate_image_extension]
    )
    is_main = models.BooleanField(default=False, verbose_name="Ana Resim")
    order = models.IntegerField(default=0, verbose_name="Sıralama")
    
    class Meta:
        verbose_name = "Ürün Resmi"
        verbose_name_plural = "Ürün Resimleri"
        ordering = ['order']

    def __str__(self):
        return f"{self.product.name} - Resim {self.order}"

    def save(self, *args, **kwargs):
        if self.is_main:
            # Eğer bu resim ana resim olarak işaretlendiyse, diğer resimlerin ana resim işaretini kaldır
            ProductImage.objects.filter(product=self.product).exclude(id=self.id).update(is_main=False)
        super().save(*args, **kwargs)

class Banner(models.Model):
    title = models.CharField(max_length=200, verbose_name="Banner Başlığı")
    description = models.TextField(blank=True, null=True, verbose_name="Açıklama")
    image = models.ImageField(
        upload_to='banners/', 
        verbose_name="Banner Resmi",
        validators=[validate_file_size, validate_image_extension]
    )
    is_active = models.BooleanField(default=True, verbose_name="Aktif")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title

    class Meta:
        verbose_name = "Banner"
        verbose_name_plural = "Bannerlar"
        ordering = ['-created_at']


from django.contrib.auth.models import User

class CartItem(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, verbose_name="Kullanıcı")
    product = models.ForeignKey(Product, on_delete=models.CASCADE, verbose_name="Ürün")
    quantity = models.PositiveIntegerField(default=1, verbose_name="Adet")
    added_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.product.name} ({self.quantity} adet)"

    def total_price(self):
        if self.product.discounted_price:
            return self.quantity * self.product.discounted_price
        return self.quantity * self.product.price

    class Meta:
        verbose_name = "Sepet Ürünü"
        verbose_name_plural = "Sepet Ürünleri"


class Order(models.Model):
    STATUS_CHOICES = [
        ("pending", "Ön Sipariş Alındı"),
        ("contacting", "İletişime Geçilecek"),
        ("approved", "Onaylandı"),
        ("preparing", "Hazırlanıyor"),
        ("shipping", "Yolda"),
        ("delivered", "Teslim Edildi"),
        ("cancelled", "İptal Edildi"),
    ]
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="orders")
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    address_text = models.TextField(verbose_name="Adres")
    address_title = models.CharField(max_length=100, blank=True)
    full_name = models.CharField(max_length=150, verbose_name="Ad Soyad")
    note = models.TextField(blank=True, null=True, verbose_name="Not")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    can_be_cancelled = models.BooleanField(default=True)
    order_number = models.CharField(max_length=20, unique=True, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if not self.order_number:
            import uuid
            self.order_number = str(uuid.uuid4()).split('-')[0].upper()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Sipariş {self.order_number} - {self.product.name}"

class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="items")
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)

    def __str__(self):
        return f"{self.product.name} x{self.quantity}"


class Favorite(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='favorites')
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='favorited_by')
    added_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'product')
        verbose_name = "Favori"
        verbose_name_plural = "Favoriler"

    def __str__(self):
        return f"{self.user.username} - {self.product.name}"