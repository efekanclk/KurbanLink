from django.shortcuts import render
from django.contrib.auth.decorators import login_required, user_passes_test
from pages.models import Product, Category, Banner, Color, Size, Material, Brand, Order, ProductImage
from django.shortcuts import get_object_or_404, redirect
from django.contrib import messages
from .forms import ProductForm, CategoryForm, BannerForm, ColorForm, SizeForm, MaterialForm, BrandForm
from django.contrib.auth.models import User
from django.db.models import Count

# Admin kontrolü
def is_admin(user):
    return user.is_authenticated and (user.is_superuser or user.is_staff)

# Admin dashboard
@login_required
@user_passes_test(is_admin)
def admin_dashboard(request):
    from django.utils import timezone
    from datetime import timedelta
    # Temel istatistikler
    total_users = User.objects.count()
    total_products = Product.objects.count()
    total_categories = Category.objects.count()
    total_orders = Order.objects.count()
    total_materials = Material.objects.count()
    total_colors = Color.objects.count()
    total_sizes = Size.objects.count()
    total_brands = Brand.objects.count()

    # Son 30 gün sipariş sayısı
    thirty_days_ago = timezone.now() - timedelta(days=30)
    recent_orders = Order.objects.filter(created_at__gte=thirty_days_ago).count()

    # Kategori dağılımı
    category_stats = Category.objects.annotate(product_count=Count('product')).values('name', 'product_count').order_by('-product_count')

    # En çok ziyaret edilen ürünler
    most_visited_products = Product.objects.order_by('-visit_count')[:20]

    # Sipariş durum dağılımı
    order_status_stats = Order.objects.values('status').annotate(count=Count('id')).order_by('status')

    context = {
        'total_users': total_users,
        'total_products': total_products,
        'total_categories': total_categories,
        'total_orders': total_orders,
        'total_materials': total_materials,
        'total_colors': total_colors,
        'total_sizes': total_sizes,
        'total_brands': total_brands,
        'recent_orders': recent_orders,
        'category_stats': category_stats,
        'most_visited_products': most_visited_products,
        'order_status_stats': order_status_stats,
    }
    return render(request, 'adminpanel/dashboard.html', context)

# Ürün listeleme
@login_required
@user_passes_test(is_admin)
def product_list_admin(request):
    products = Product.objects.all().order_by('-created_at')
    return render(request, 'adminpanel/product_list.html', {'products': products})

@login_required
@user_passes_test(is_admin)
def product_delete_admin(request, product_id):
    product = get_object_or_404(Product, id=product_id)
    product.delete()
    messages.success(request, f"'{product.name}' ürünü başarıyla silindi.")
    return redirect('product_list_admin')

@login_required
@user_passes_test(is_admin)
def product_edit_admin(request, product_id):
    product = get_object_or_404(Product, id=product_id)

    if request.method == 'POST':
        form = ProductForm(request.POST, request.FILES, instance=product)
        if form.is_valid():
            form.save()
            # Çoklu resim yükleme
            images = request.FILES.getlist('images')
            for img in images:
                ProductImage.objects.create(product=product, image=img)
            messages.success(request, 'Ürün başarıyla güncellendi.')
            return redirect('product_list_admin')
        else:
            # Form hatalarını göster
            for field, errors in form.errors.items():
                for error in errors:
                    messages.error(request, f'{field}: {error}')
    else:
        form = ProductForm(instance=product)

    # Ürüne ait mevcut resimler
    product_images = product.images.all()
    return render(request, 'adminpanel/product_edit.html', {
        'form': form,
        'product': product,
        'product_images': product_images,
    })

@login_required
@user_passes_test(is_admin)
def product_create_admin(request):
    if request.method == 'POST':
        form = ProductForm(request.POST, request.FILES)
        if form.is_valid():
            product = form.save()
            # Çoklu resim yükleme
            images = request.FILES.getlist('images')
            for img in images:
                ProductImage.objects.create(product=product, image=img)
            messages.success(request, 'Ürün başarıyla eklendi.')
            return redirect('product_list_admin')
        else:
            # Form hatalarını göster
            for field, errors in form.errors.items():
                for error in errors:
                    messages.error(request, f'{field}: {error}')
    else:
        form = ProductForm()
    return render(request, 'adminpanel/product_form.html', {'form': form})

@user_passes_test(is_admin)
def user_list_admin(request):
    users = User.objects.all().order_by('-date_joined')
    return render(request, 'adminpanel/user_list.html', {'users': users})

@user_passes_test(lambda u: u.is_staff)
def product_statistics_admin(request):
    return render(request, 'adminpanel/statistics.html')

@login_required
@user_passes_test(is_admin)
def category_list_admin(request):
    categories = Category.objects.all().order_by('name')
    return render(request, 'adminpanel/category_list.html', {'categories': categories})

@login_required
@user_passes_test(is_admin)
def category_create_admin(request):
    if request.method == 'POST':
        form = CategoryForm(request.POST, request.FILES)
        if form.is_valid():
            form.save()
            messages.success(request, 'Kategori başarıyla eklendi.')
            return redirect('category_list_admin')
    else:
        form = CategoryForm()
    return render(request, 'adminpanel/category_form.html', {'form': form, 'title': 'Yeni Kategori'})

@login_required
@user_passes_test(is_admin)
def category_edit_admin(request, category_id):
    category = get_object_or_404(Category, id=category_id)
    if request.method == 'POST':
        form = CategoryForm(request.POST, request.FILES, instance=category)
        if form.is_valid():
            form.save()
            messages.success(request, 'Kategori güncellendi.')
            return redirect('category_list_admin')
    else:
        form = CategoryForm(instance=category)
    return render(request, 'adminpanel/category_form.html', {'form': form, 'title': 'Kategori Düzenle'})

@login_required
@user_passes_test(is_admin)
def category_delete_admin(request, category_id):
    category = get_object_or_404(Category, id=category_id)
    if request.method == 'POST':
        category.delete()
        messages.success(request, 'Kategori silindi.')
        return redirect('category_list_admin')
    return render(request, 'adminpanel/category_confirm_delete.html', {'category': category})

@login_required
@user_passes_test(is_admin)
def banner_list_admin(request):
    banners = Banner.objects.all().order_by('-created_at')
    return render(request, 'adminpanel/banner_list.html', {'banners': banners})

@login_required
@user_passes_test(is_admin)
def banner_create_admin(request):
    if request.method == 'POST':
        form = BannerForm(request.POST, request.FILES)
        if form.is_valid():
            form.save()
            messages.success(request, 'Banner başarıyla eklendi.')
            return redirect('banner_list_admin')
    else:
        form = BannerForm()
    return render(request, 'adminpanel/banner_form.html', {'form': form, 'title': 'Yeni Banner'})

@login_required
@user_passes_test(is_admin)
def banner_edit_admin(request, banner_id):
    banner = get_object_or_404(Banner, id=banner_id)
    if request.method == 'POST':
        form = BannerForm(request.POST, request.FILES, instance=banner)
        if form.is_valid():
            form.save()
            messages.success(request, 'Banner güncellendi.')
            return redirect('banner_list_admin')
    else:
        form = BannerForm(instance=banner)
    return render(request, 'adminpanel/banner_form.html', {'form': form, 'title': 'Banner Düzenle'})

@login_required
@user_passes_test(is_admin)
def banner_delete_admin(request, banner_id):
    banner = get_object_or_404(Banner, id=banner_id)
    if request.method == 'POST':
        banner.delete()
        messages.success(request, 'Banner silindi.')
        return redirect('banner_list_admin')
    return render(request, 'adminpanel/banner_confirm_delete.html', {'banner': banner})

@login_required
@user_passes_test(is_admin)
def color_list_admin(request):
    colors = Color.objects.all().order_by('name')
    return render(request, 'adminpanel/color_list.html', {'colors': colors})

@login_required
@user_passes_test(is_admin)
def color_create_admin(request):
    if request.method == 'POST':
        form = ColorForm(request.POST)
        if form.is_valid():
            form.save()
            messages.success(request, 'Renk başarıyla eklendi.')
            return redirect('color_list_admin')
    else:
        form = ColorForm()
    return render(request, 'adminpanel/color_form.html', {'form': form, 'title': 'Yeni Renk'})

@login_required
@user_passes_test(is_admin)
def color_edit_admin(request, color_id):
    color = get_object_or_404(Color, id=color_id)
    if request.method == 'POST':
        form = ColorForm(request.POST, instance=color)
        if form.is_valid():
            form.save()
            messages.success(request, 'Renk güncellendi.')
            return redirect('color_list_admin')
    else:
        form = ColorForm(instance=color)
    return render(request, 'adminpanel/color_form.html', {'form': form, 'title': 'Renk Düzenle'})

@login_required
@user_passes_test(is_admin)
def color_delete_admin(request, color_id):
    color = get_object_or_404(Color, id=color_id)
    if request.method == 'POST':
        color.delete()
        messages.success(request, 'Renk silindi.')
        return redirect('color_list_admin')
    return render(request, 'adminpanel/color_confirm_delete.html', {'color': color})

@login_required
@user_passes_test(is_admin)
def size_list_admin(request):
    sizes = Size.objects.all().order_by('name')
    return render(request, 'adminpanel/size_list.html', {'sizes': sizes})

@login_required
@user_passes_test(is_admin)
def size_create_admin(request):
    if request.method == 'POST':
        form = SizeForm(request.POST)
        if form.is_valid():
            form.save()
            messages.success(request, 'Boyut başarıyla eklendi.')
            return redirect('size_list_admin')
    else:
        form = SizeForm()
    return render(request, 'adminpanel/size_form.html', {'form': form, 'title': 'Yeni Boyut'})

@login_required
@user_passes_test(is_admin)
def size_edit_admin(request, size_id):
    size = get_object_or_404(Size, id=size_id)
    if request.method == 'POST':
        form = SizeForm(request.POST, instance=size)
        if form.is_valid():
            form.save()
            messages.success(request, 'Boyut güncellendi.')
            return redirect('size_list_admin')
    else:
        form = SizeForm(instance=size)
    return render(request, 'adminpanel/size_form.html', {'form': form, 'title': 'Boyut Düzenle'})

@login_required
@user_passes_test(is_admin)
def size_delete_admin(request, size_id):
    size = get_object_or_404(Size, id=size_id)
    if request.method == 'POST':
        size.delete()
        messages.success(request, 'Boyut silindi.')
        return redirect('size_list_admin')
    return render(request, 'adminpanel/size_confirm_delete.html', {'size': size})

@login_required
@user_passes_test(is_admin)
def material_list_admin(request):
    materials = Material.objects.all().order_by('name')
    return render(request, 'adminpanel/material_list.html', {'materials': materials})

@login_required
@user_passes_test(is_admin)
def material_create_admin(request):
    if request.method == 'POST':
        form = MaterialForm(request.POST)
        if form.is_valid():
            form.save()
            messages.success(request, 'Malzeme başarıyla eklendi.')
            return redirect('material_list_admin')
    else:
        form = MaterialForm()
    return render(request, 'adminpanel/material_form.html', {'form': form, 'title': 'Yeni Malzeme'})

@login_required
@user_passes_test(is_admin)
def material_edit_admin(request, material_id):
    material = get_object_or_404(Material, id=material_id)
    if request.method == 'POST':
        form = MaterialForm(request.POST, instance=material)
        if form.is_valid():
            form.save()
            messages.success(request, 'Malzeme güncellendi.')
            return redirect('material_list_admin')
    else:
        form = MaterialForm(instance=material)
    return render(request, 'adminpanel/material_form.html', {'form': form, 'title': 'Malzeme Düzenle'})

@login_required
@user_passes_test(is_admin)
def material_delete_admin(request, material_id):
    material = get_object_or_404(Material, id=material_id)
    if request.method == 'POST':
        material.delete()
        messages.success(request, 'Malzeme silindi.')
        return redirect('material_list_admin')
    return render(request, 'adminpanel/material_confirm_delete.html', {'material': material})

@login_required
@user_passes_test(is_admin)
def brand_list_admin(request):
    brands = Brand.objects.all().order_by('name')
    return render(request, 'adminpanel/brand_list.html', {'brands': brands})

@login_required
@user_passes_test(is_admin)
def brand_create_admin(request):
    if request.method == 'POST':
        form = BrandForm(request.POST)
        if form.is_valid():
            form.save()
            messages.success(request, 'Marka başarıyla eklendi.')
            return redirect('brand_list_admin')
    else:
        form = BrandForm()
    return render(request, 'adminpanel/brand_form.html', {'form': form, 'title': 'Yeni Marka'})

@login_required
@user_passes_test(is_admin)
def brand_edit_admin(request, brand_id):
    brand = get_object_or_404(Brand, id=brand_id)
    if request.method == 'POST':
        form = BrandForm(request.POST, instance=brand)
        if form.is_valid():
            form.save()
            messages.success(request, 'Marka güncellendi.')
            return redirect('brand_list_admin')
    else:
        form = BrandForm(instance=brand)
    return render(request, 'adminpanel/brand_form.html', {'form': form, 'title': 'Marka Düzenle'})

@login_required
@user_passes_test(is_admin)
def brand_delete_admin(request, brand_id):
    brand = get_object_or_404(Brand, id=brand_id)
    if request.method == 'POST':
        brand.delete()
        messages.success(request, 'Marka silindi.')
        return redirect('brand_list_admin')
    return render(request, 'adminpanel/brand_confirm_delete.html', {'brand': brand})

@login_required
@user_passes_test(is_admin)
def order_list_admin(request):
    orders = Order.objects.all().order_by('-created_at')
    status_display_map = {k: v for k, v in Order.STATUS_CHOICES}
    # Siparişlerde geçen status kodlarını çek
    order_statuses = orders.values_list('status', flat=True)
    # Sadece display isimlerini ve tekrarsız olacak şekilde set ile topla
    unique_statuses = []
    seen = set()
    for status in order_statuses:
        display = status_display_map.get(status)
        if display and display not in seen:
            unique_statuses.append(display)
            seen.add(display)
    return render(request, 'adminpanel/order_list.html', {
        'orders': orders,
        'order_statuses': unique_statuses,
    })

@login_required
@user_passes_test(is_admin)
def order_detail_admin(request, order_id):
    order = get_object_or_404(Order, id=order_id)
    user = order.user

    # Kullanıcı bilgilerini alıyoruz
    user_email = user.email
    user_fullname = user.get_full_name()
    user_phone = user.userprofile.phone if hasattr(user, 'userprofile') else ''

    return render(request, 'adminpanel/order_detail.html', {
        'order': order,
        'user_email': user_email,
        'user_fullname': user_fullname,
        'user_phone': user_phone,
        'status_choices': Order.STATUS_CHOICES,
    })

# reports_admin fonksiyonu kaldırıldı, dashboard raporları gösteriyor.

@login_required
@user_passes_test(is_admin)
def product_image_delete_admin(request, image_id):
    image = get_object_or_404(ProductImage, id=image_id)
    product_id = image.product.id
    image.delete()
    messages.success(request, "Resim silindi.")
    return redirect('product_edit_admin', product_id=product_id)

from django.core.mail import send_mail

@login_required
@user_passes_test(is_admin)
def update_order_status_admin(request, order_id):
    order = get_object_or_404(Order, id=order_id)

    if request.method == 'POST':
        new_status = request.POST.get('status')
        if new_status and new_status != order.status:
            order.status = new_status
            order.save()

            # Mail gönderimi
            send_mail(
                subject='Sipariş Durumunuz Güncellendi',
                message=f"Merhaba {order.user.first_name},\nSiparişinizin yeni durumu: {order.get_status_display()}",
                from_email='info@seninsiten.com',
                recipient_list=[order.user.email],
                fail_silently=False,
            )

            messages.success(request, 'Sipariş durumu güncellendi ve kullanıcıya e-posta gönderildi.')

    return redirect('order_detail_admin', order_id=order.id)


