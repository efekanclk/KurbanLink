from django.urls import path
from . import views

urlpatterns = [
    # Dashboard
    path('', views.admin_dashboard, name='admin_dashboard'),

    # Ürün URL'leri
    path('products/', views.product_list_admin, name='product_list_admin'),
    path('products/add/', views.product_create_admin, name='product_create_admin'),
    path('products/<int:product_id>/edit/', views.product_edit_admin, name='product_edit_admin'),
    path('products/<int:product_id>/delete/', views.product_delete_admin, name='product_delete_admin'),

    # Kategori URL'leri
    path('categories/', views.category_list_admin, name='category_list_admin'),
    path('categories/add/', views.category_create_admin, name='category_create_admin'),
    path('categories/<int:category_id>/edit/', views.category_edit_admin, name='category_edit_admin'),
    path('categories/<int:category_id>/delete/', views.category_delete_admin, name='category_delete_admin'),

    # Banner URL'leri
    path('banners/', views.banner_list_admin, name='banner_list_admin'),
    path('banners/add/', views.banner_create_admin, name='banner_create_admin'),
    path('banners/<int:banner_id>/edit/', views.banner_edit_admin, name='banner_edit_admin'),
    path('banners/<int:banner_id>/delete/', views.banner_delete_admin, name='banner_delete_admin'),

    # Sipariş URL'leri
    path('orders/', views.order_list_admin, name='order_list_admin'),
    path('orders/<int:order_id>/', views.order_detail_admin, name='order_detail_admin'),

    # Kullanıcı URL'leri
    path('users/', views.user_list_admin, name='user_list_admin'),

    # Renk URL'leri
    path('colors/', views.color_list_admin, name='color_list_admin'),
    path('colors/add/', views.color_create_admin, name='color_create_admin'),
    path('colors/<int:color_id>/edit/', views.color_edit_admin, name='color_edit_admin'),
    path('colors/<int:color_id>/delete/', views.color_delete_admin, name='color_delete_admin'),

    # Boyut URL'leri
    path('sizes/', views.size_list_admin, name='size_list_admin'),
    path('sizes/add/', views.size_create_admin, name='size_create_admin'),
    path('sizes/<int:size_id>/edit/', views.size_edit_admin, name='size_edit_admin'),
    path('sizes/<int:size_id>/delete/', views.size_delete_admin, name='size_delete_admin'),

    # Malzeme URL'leri
    path('materials/', views.material_list_admin, name='material_list_admin'),
    path('materials/add/', views.material_create_admin, name='material_create_admin'),
    path('materials/<int:material_id>/edit/', views.material_edit_admin, name='material_edit_admin'),
    path('materials/<int:material_id>/delete/', views.material_delete_admin, name='material_delete_admin'),

    # Marka URL'leri
    path('brands/', views.brand_list_admin, name='brand_list_admin'),
    path('brands/add/', views.brand_create_admin, name='brand_create_admin'),
    path('brands/<int:brand_id>/edit/', views.brand_edit_admin, name='brand_edit_admin'),
    path('brands/<int:brand_id>/delete/', views.brand_delete_admin, name='brand_delete_admin'),

    # Raporlar URL'si kaldırıldı
    path('products/image/<int:image_id>/delete/', views.product_image_delete_admin, name='product_image_delete_admin'),

    path('admin/orders/<int:order_id>/update-status/', views.update_order_status_admin, name='update_order_status_admin'),

]
