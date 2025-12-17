from django.shortcuts import render
from django.http import JsonResponse
from django.template.loader import render_to_string
from django.views.decorators.csrf import csrf_exempt
from django.db.models import Q
from .models import Product, Category, Banner, CartItem, ProductType, Material, Size, Color, Brand
import json
from django.contrib.auth.decorators import login_required
from django.shortcuts import redirect
from django.shortcuts import get_object_or_404
from accounts.models import Address
from .models import Order
from django.contrib import messages


def anasayfa(request):

    products = Product.objects.all()
    featured_products = Product.objects.filter(is_featured=True)
    campaign_products = Product.objects.filter(is_campaign=True)
    banners = Banner.objects.filter(is_active=True)

    cart_count = 0
    favorite_product_ids = []

    if request.user.is_authenticated:
        cart_count = CartItem.objects.filter(user=request.user).count()
        favorite_product_ids = list(request.user.favorites.values_list('product_id', flat=True))

    product_types = ProductType.objects.all()
    materials = Material.objects.all()
    sizes = Size.objects.all()
    colors = Color.objects.all()
    brands = Brand.objects.all()
    categories = Category.objects.all()

    # Fiyat aralıklarını oluştur
    price_ranges = [
        {'id': '0-2500', 'label': '0 - 2.500 TL', 'min': 0, 'max': 2500},
        {'id': '2500-5000', 'label': '2.500 TL - 5.000 TL', 'min': 2500, 'max': 5000},
        {'id': '5000-10000', 'label': '5.000 TL - 10.000 TL', 'min': 5000, 'max': 10000},
        {'id': '10000-20000', 'label': '10.000 TL - 20.000 TL', 'min': 10000, 'max': 20000},
        {'id': '20000-30000', 'label': '20.000 TL - 30.000 TL', 'min': 20000, 'max': 30000},
        {'id': '30000-40000', 'label': '30.000 TL - 40.000 TL', 'min': 30000, 'max': 40000},
        {'id': '40000-50000', 'label': '40.000 TL - 50.000 TL', 'min': 40000, 'max': 50000},
        {'id': '50000-60000', 'label': '50.000 TL - 60.000 TL', 'min': 50000, 'max': 60000},
        {'id': '60000-70000', 'label': '60.000 TL - 70.000 TL', 'min': 60000, 'max': 70000},
        {'id': '70000-80000', 'label': '70.000 TL - 80.000 TL', 'min': 70000, 'max': 80000},
        {'id': '80000-90000', 'label': '80.000 TL - 90.000 TL', 'min': 80000, 'max': 90000},
        {'id': '90000-100000', 'label': '90.000 TL - 100.000 TL', 'min': 90000, 'max': 100000},
        {'id': '100000+', 'label': '100.000 TL ve üzeri', 'min': 100000, 'max': None},
    ]

    context = {
        'products': products,
        'featured_products': featured_products,
        'campaign_products': campaign_products,
        'banners': banners,
        'cart_count': cart_count,
        'product_types': product_types,
        'materials': materials,
        'sizes': sizes,
        'colors': colors,
        'brands': brands,
        'categories': categories,
        'favorite_product_ids': favorite_product_ids,
        'price_ranges': price_ranges,
    }
    return render(request, 'pages/anasayfa.html', context)

@csrf_exempt
def ajax_filter_products(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            products = Product.objects.all()
            
            # Ürün türü filtresi
            if data.get('types'):
                products = products.filter(product_type__id__in=data['types'])
            
            # Malzeme filtresi
            if data.get('materials'):
                products = products.filter(material__id__in=data['materials'])
            
            # Boyut filtresi
            if data.get('sizes'):
                products = products.filter(size__id__in=data['sizes'])
            
            # Renk filtresi
            if data.get('colors'):
                products = products.filter(color__id__in=data['colors'])
            
            # Marka filtresi
            if data.get('brands'):
                products = products.filter(brand__id__in=data['brands'])
            
            # Fiyat filtresi
            if data.get('price_range'):
                price_ranges = [
                    {'id': '0-2500', 'min': 0, 'max': 2500},
                    {'id': '2500-5000', 'min': 2500, 'max': 5000},
                    {'id': '5000-10000', 'min': 5000, 'max': 10000},
                    {'id': '10000-20000', 'min': 10000, 'max': 20000},
                    {'id': '20000-30000', 'min': 20000, 'max': 30000},
                    {'id': '30000-40000', 'min': 30000, 'max': 40000},
                    {'id': '40000-50000', 'min': 40000, 'max': 50000},
                    {'id': '50000-60000', 'min': 50000, 'max': 60000},
                    {'id': '60000-70000', 'min': 60000, 'max': 70000},
                    {'id': '70000-80000', 'min': 70000, 'max': 80000},
                    {'id': '80000-90000', 'min': 80000, 'max': 90000},
                    {'id': '90000-100000', 'min': 90000, 'max': 100000},
                    {'id': '100000+', 'min': 100000, 'max': None},
                ]
                price_filter = Q()
                for pr_id in data['price_range']:
                    pr = next((pr for pr in price_ranges if pr['id'] == pr_id), None)
                    if pr:
                        if pr['max'] is None:
                            price_filter |= Q(price__gte=pr['min'])
                        else:
                            price_filter |= Q(price__gte=pr['min'], price__lt=pr['max'])
                if price_filter:
                    products = products.filter(price_filter)
            
            # Kategori filtresi
            if data.get('category'):
                products = products.filter(category_id=data['category'])
            
            # Stok durumu filtresi
            if data.get('stock_status'):
                products = products.filter(stock_status__in=data['stock_status'])
            
            # Setler ve kampanyalar da aynı filtreye uysun
            featured_products = products.filter(is_featured=True)
            campaign_products = products.filter(is_campaign=True)
            
            # Filtrelenmiş ürünleri template'e gönder
            html = render_to_string('pages/products_list_partial.html', {
                'products': products,
                'featured_products': featured_products,
                'campaign_products': campaign_products,
            })
            
            return JsonResponse({'html': html})
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON data'}, status=400)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)
    return JsonResponse({'error': 'Invalid request method'}, status=405)

@csrf_exempt
def ajax_product_details(request, product_id):
    try:
        product = Product.objects.get(id=product_id)
        
        # 🔥 Ziyaret sayısını 1 artır
        product.visit_count = product.visit_count + 1
        product.save(update_fields=['visit_count'])

        # Ürün detaylarını hazırla
        data = {
            'id': product.id,
            'name': product.name,
            'description': product.description,
            'price': str(product.price),
            'discounted_price': str(product.discounted_price) if product.discounted_price else None,
            'discount_percentage': product.discount_percentage if product.discounted_price else None,
            'material': product.material.name if product.material else None,
            'color': product.color.name if product.color else None,
            'size': product.size.name if product.size else None,
            'brand': product.brand.name if product.brand else None,
            'product_type': product.product_type.name if product.product_type else None,
            'stock_quantity': product.stock_quantity,
            'stock_status': product.get_stock_status_display(),
            'main_image': product.get_main_image().url,
            'images': [img.image.url for img in product.get_all_images()]
        }
        
        return JsonResponse(data)
    except Product.DoesNotExist:
        return JsonResponse({'error': 'Ürün bulunamadı'}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

def hakkında(request):
    return render(request, 'pages/hakkında.html')


@login_required
def add_to_cart(request, product_id):
    product = Product.objects.get(id=product_id)
    cart_item, created = CartItem.objects.get_or_create(user=request.user, product=product)
    if not created:
        cart_item.quantity += 1
        cart_item.save()
    return redirect('pages:sepet')


from .models import CartItem

@login_required
def sepet(request):
    cart_items = CartItem.objects.filter(user=request.user)
    total_price = sum(
        (item.product.discounted_price or item.product.price) * item.quantity
        for item in cart_items
    )
    user_profile = request.user.userprofile
    addresses = Address.objects.filter(user_profile=user_profile)

    if request.method == 'POST' and 'create_preorder' in request.POST:
        address_id = request.POST.get('address_id')
        full_name = request.POST.get('full_name')
        note = request.POST.get('note', '')
        address = addresses.filter(id=address_id).first()
        if not address:
            messages.error(request, 'Adres seçmelisiniz.')
        elif not full_name:
            messages.error(request, 'Ad Soyad alanı zorunludur.')
        elif not cart_items:
            messages.error(request, 'Sepetinizde ürün yok.')
        else:
            for item in cart_items:
                Order.objects.create(
                    user=request.user,
                    product=item.product,
                    address_text=address.address,
                    address_title=address.title,
                    full_name=full_name,
                    note=note,
                )
            cart_items.delete()
            messages.success(request, 'Ön siparişiniz başarıyla oluşturuldu! Siparişlerim bölümünden takip edebilirsiniz.')
            return redirect('pages:sepet')

    context = {
        "cart_items": cart_items,
        "total": total_price,
        "addresses": addresses,
    }
    return render(request, "pages/sepet.html", context)


@login_required
def update_cart(request, item_id):
    item = get_object_or_404(CartItem, id=item_id, user=request.user)
    if request.method == "POST":
        quantity = int(request.POST.get("quantity", 1))
        item.quantity = max(1, quantity)
        item.save()
    return redirect("pages:sepet")

@login_required
def remove_from_cart(request, item_id):
    item = get_object_or_404(CartItem, id=item_id, user=request.user)
    if request.method == "POST":
        item.delete()
    return redirect("pages:sepet")

@login_required
def update_quantity(request, item_id):
    cart_item = get_object_or_404(CartItem, id=item_id, user=request.user)
    if request.method == 'POST':
        quantity = int(request.POST.get('quantity', 1))
        if quantity > 0:
            cart_item.quantity = quantity
            cart_item.save()
    return redirect('pages:sepet')

@csrf_exempt
def ajax_update_quantity(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            item_id = data.get('item_id')
            new_quantity = data.get('quantity')
            
            # Sepet item'ını bul ve güncelle
            cart_item = CartItem.objects.get(id=item_id, user=request.user)
            cart_item.quantity = new_quantity
            cart_item.save()
            
            # Yeni toplam fiyatı hesapla
            total_price = cart_item.quantity * cart_item.product.price
            cart_total = sum(item.quantity * item.product.price for item in CartItem.objects.filter(user=request.user))
            
            return JsonResponse({
                'success': True,
                'item_total': total_price,
                'cart_total': cart_total,
                'quantity': new_quantity
            })
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)})
    
    return JsonResponse({'success': False, 'error': 'Invalid request'})

@csrf_exempt
def ajax_search_products(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            query = data.get('query', '').strip()
            products = Product.objects.all()
            if query:
                products = products.filter(
                    Q(name__icontains=query) |
                    Q(category__name__icontains=query)
                )
            featured_products = products.filter(is_featured=True)
            campaign_products = products.filter(is_campaign=True)
            html = render_to_string('pages/products_list_partial.html', {
                'products': products,
                'featured_products': featured_products,
                'campaign_products': campaign_products,
            })
            return JsonResponse({'html': html})
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)
    return JsonResponse({'error': 'Invalid request method'}, status=405)



from django.http import JsonResponse
from .models import Favorite

@csrf_exempt
@login_required
def toggle_favorite(request, product_id):
    if request.method == 'POST':
        product = Product.objects.get(id=product_id)
        favorite, created = Favorite.objects.get_or_create(user=request.user, product=product)
        if not created:
            favorite.delete()
            return JsonResponse({'status': 'removed'})
        return JsonResponse({'status': 'added'})
    return JsonResponse({'status': 'error'}, status=400)
