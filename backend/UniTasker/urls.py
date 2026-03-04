from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from usuarios.views import UsuarioViewSet
from planner.views import ActividadViewSet, TareaViewSet, RegistroAvanceViewSet
from rest_framework_simplejwt.views import TokenRefreshView
from usuarios.auth import SafeTokenObtainPairView
from rest_framework_simplejwt.views import TokenRefreshView

router = DefaultRouter()
router.register(r"usuarios", UsuarioViewSet)
router.register(r"actividades", ActividadViewSet, basename="actividad")
router.register(r"tareas", TareaViewSet, basename="tarea")
router.register(r"registros", RegistroAvanceViewSet, basename="registro")

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include(router.urls)),
    path("api/token/", SafeTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
]
