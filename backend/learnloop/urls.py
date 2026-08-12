from django.urls import path
from . import views

urlpatterns = [
    path('api/register/', views.register_view, name='register'),
    path('api/login/', views.login_view, name='login'),
    path('api/logout/', views.logout_view, name='logout'),
    path('api/me/', views.me_view, name='me'),
]
