from rest_framework.routers import DefaultRouter
from django.urls import path, 
from .views import UsuarioViewSet

router = DefaultRouter()
router.register(r"usuarios", UsuarioViewSet)

urlpatterns = router.urls
