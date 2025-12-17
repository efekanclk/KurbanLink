from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login, logout, update_session_auth_hash
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from django.contrib import messages
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError

from pages.models import CartItem, Order , Favorite # sepetteki ürünleri çekebilmek için
from .models import UserProfile, Address

def register_view(request):
    if request.method == 'POST':
        username = request.POST['username']
        email = request.POST['email']
        password = request.POST['password']
        password_confirm = request.POST.get('password-confirm')
        phone = request.POST.get('phone', '')
        first_name = request.POST.get('first_name', '')
        surname = request.POST.get('surname', '')

        if password != password_confirm:
            messages.error(request, 'Şifreler eşleşmiyor.')
            return render(request, 'accounts/register.html')
        
        if User.objects.filter(username=username).exists():
            messages.error(request, 'Bu kullanıcı adı zaten kullanılıyor.')
            return render(request, 'accounts/register.html')
        
        if User.objects.filter(email=email).exists():
            messages.error(request, 'Bu email adresi zaten kullanılıyor.')
            return render(request, 'accounts/register.html')

        try:
            validate_password(password)
        except ValidationError as e:
            messages.error(request, '\n'.join(e.messages))
            return render(request, 'accounts/register.html')

        try:
            user = User.objects.create_user(username=username, email=email, password=password)
            user.first_name = first_name
            user.last_name = surname
            user.save()

            if phone:
                user.userprofile.phone = phone
                user.userprofile.save()
            
            login(request, user)
            return redirect('pages:anasayfa')
        except Exception as e:
            messages.error(request, 'Kayıt sırasında bir hata oluştu.')
            return render(request, 'accounts/register.html')

    return render(request, 'accounts/register.html')

def login_view(request):
    if request.method == 'POST':
        username = request.POST['username']
        password = request.POST['password']
        user = authenticate(request, username=username, password=password)
        if user:
            login(request, user)
            return redirect('pages:anasayfa')
        else:
            messages.error(request, 'Kullanıcı adı veya şifre hatalı.')
            return render(request, 'accounts/login.html')
    return render(request, 'accounts/login.html')

def logout_view(request):
    logout(request)
    return redirect('pages:anasayfa')

@login_required(login_url='login')
def profile_view(request):
    user_profile = request.user.userprofile
    addresses = Address.objects.filter(user_profile=user_profile)
    orders = Order.objects.filter(user=request.user).order_by('-created_at')
    favorites = Favorite.objects.filter(user=request.user)


    if request.method == 'POST':
        if 'update_profile' in request.POST:
            user = request.user
            user.first_name = request.POST.get('first_name', '')
            user.email = request.POST.get('email', '')
            user.save()

            profile = user.userprofile if hasattr(user, 'userprofile') else None
            if profile:
                profile.phone = request.POST.get('phone', '')
                profile.address = request.POST.get('address', '')
                profile.save()

            messages.success(request, 'Profil bilgileriniz güncellendi.')

        elif 'update_password' in request.POST:
            old_password = request.POST.get('old_password')
            new_password = request.POST.get('new_password')
            confirm_password = request.POST.get('confirm_password')

            if not request.user.check_password(old_password):
                messages.error(request, 'Mevcut şifreniz yanlış.')
            elif new_password != confirm_password:
                messages.error(request, 'Yeni şifreler eşleşmiyor.')
            else:
                try:
                    validate_password(new_password)
                    request.user.set_password(new_password)
                    request.user.save()
                    update_session_auth_hash(request, request.user)
                    messages.success(request, 'Şifreniz başarıyla güncellendi.')
                except ValidationError as e:
                    messages.error(request, '\n'.join(e.messages))

        elif 'add_address' in request.POST:
            title = request.POST.get('address_title', '')
            address = request.POST.get('address_text', '')
            city = request.POST.get('city', '')
            district = request.POST.get('district', '')
            postal_code = request.POST.get('postal_code', '')
            if address:
                Address.objects.create(
                    user_profile=user_profile,
                    title=title,
                    address=address,
                    city=city,
                    district=district,
                    postal_code=postal_code
                )
                messages.success(request, 'Adres eklendi.')
            else:
                messages.error(request, 'Adres alanı boş olamaz.')

        elif 'delete_address' in request.POST:
            address_id = request.POST.get('address_id')
            Address.objects.filter(id=address_id, user_profile=user_profile).delete()
            messages.success(request, 'Adres silindi.')

        elif 'cancel_order' in request.POST:
            order_id = request.POST.get('order_id')
            order = orders.filter(id=order_id).first()

            # İptal edilemeyen durumlar
            non_cancelable_statuses = ['hazirlaniyor', 'yolda', 'teslim_edildi']

            if order:
                if order.status in non_cancelable_statuses:
                    messages.error(request, 'Bu sipariş artık iptal edilemez.')
                else:
                    order.status = 'iptal_edildi'
                    order.can_be_cancelled = False
                    order.save()

                    # 🔔 Admin'e e-posta gönder
                    from django.core.mail import send_mail
                    message = f"""
                        🛑 Kullanıcı bir siparişi iptal etti:

                        👤 Kullanıcı: {request.user.get_full_name()} ({request.user.username})
                        📧 E-posta: {request.user.email}
                        📦 Sipariş No: {order.order_number}
                        🛋️ Ürün: {order.product.name}
                        📍 Adres: {order.address_text}
                        📃 Not: {order.note}
                        📅 Tarih: {order.created_at.strftime('%d.%m.%Y %H:%M')}
                        """
                    send_mail(
                        subject='🚨 Sipariş İptal Edildi',
                        message=message,
                        from_email='info@seninsiten.com',
                        recipient_list=['admin@seninsiten.com'],  # admin mailini buraya yaz
                        fail_silently=False,
                    )

                    messages.success(request, 'Sipariş başarıyla iptal edildi.')
            else:
                messages.error(request, 'Sipariş bulunamadı.')

    # 🔥 Sepet verilerini profile.html'e aktar
    cart_items = CartItem.objects.filter(user=request.user)
    total = sum(item.total_price() for item in cart_items)

    return render(request, 'accounts/profile.html', {
        'user': request.user,
        'cart_items': cart_items,
        'total': total,
        'addresses': addresses,
        'orders': orders,
        'favorites': favorites,
    })
