from django.urls import include, path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

from . import views

router = DefaultRouter()
router.register(r'services', views.ServiceViewSet, basename='service')
router.register(r'pets', views.PetViewSet, basename='pet')
router.register(r'appointments', views.AppointmentViewSet, basename='appointment')
router.register(r'notifications', views.NotificationViewSet, basename='notification')
router.register(r'inventory', views.InventoryItemViewSet, basename='inventory')
router.register(r'inventory-restock', views.RestockRequestViewSet, basename='restock')
router.register(r'inventory-usage', views.InventoryUsageLogViewSet, basename='inventory-usage')
router.register(r'users', views.UserViewSet, basename='user')

urlpatterns = [
    # Auth
    path('auth/register/', views.RegisterView.as_view(), name='auth-register'),
    path('auth/login/', views.LoginView.as_view(), name='auth-login'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='auth-token-refresh'),
    path('auth/change-password/', views.ChangePasswordView.as_view(), name='auth-change-password'),
    # Router
    path('', include(router.urls)),
]
