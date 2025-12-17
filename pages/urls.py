from django.urls import path
from . import views
app_name = 'pages'

urlpatterns = [
    path('', views.anasayfa, name='anasayfa'),
    path('hakkında/', views.hakkında, name='hakkında'),
    path('ajax/filter-products/', views.ajax_filter_products, name='ajax_filter_products'),
    path('ajax/product-details/<int:product_id>/', views.ajax_product_details, name='ajax_product_details'),
    path('add-to-cart/<int:product_id>/', views.add_to_cart, name='add_to_cart'),
    path('sepet/', views.sepet, name='sepet'),
    path("update-cart/<int:item_id>/", views.update_cart, name="update_cart"),
    path("remove-from-cart/<int:item_id>/", views.remove_from_cart, name="remove_from_cart"),
    path('update-quantity/<int:item_id>/', views.update_quantity, name='update_quantity'),
    path('ajax/update-quantity/', views.ajax_update_quantity, name='ajax_update_quantity'),
    path('ajax/search-products/', views.ajax_search_products, name='ajax_search_products'),
    path('toggle-favorite/<int:product_id>/', views.toggle_favorite, name='toggle_favorite'),
    path('favori-degistir/<int:product_id>/', views.toggle_favorite, name='toggle_favorite'),

    
    
]