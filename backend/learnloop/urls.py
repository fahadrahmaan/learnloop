from django.urls import path
from . import views

urlpatterns = [
    path('api/register/', views.register_view, name='register'),
    path('api/login/', views.login_view, name='login'),
    path('api/logout/', views.logout_view, name='logout'),
    path('api/me/', views.me_view, name='me'),
    
    path('api/habits/', views.habits_list_create_view, name='habits-list-create'),
    path('api/habits/<int:habit_id>/', views.habit_detail_view, name='habit-detail'),
    
    path('api/study-sessions/', views.study_sessions_list_create_view, name='study-sessions-list-create'),
    path('api/study-sessions/<int:session_id>/', views.study_session_detail_view, name='study-session-detail'),
]
