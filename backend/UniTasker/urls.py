from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from usuarios.views import UsuarioViewSet
from planner.views import ActividadViewSet, TareaViewSet, RegistroAvanceViewSet
from rest_framework_simplejwt.views import TokenRefreshView
from usuarios.auth import SafeTokenObtainPairView
from rest_framework_simplejwt.views import TokenRefreshView
from drf_yasg.views import get_schema_view
from drf_yasg import openapi
from rest_framework import permissions

router = DefaultRouter()
router.register(r"usuarios", UsuarioViewSet)
router.register(r"actividades", ActividadViewSet, basename="actividad")
router.register(r"tareas", TareaViewSet, basename="tarea")
router.register(r"registros", RegistroAvanceViewSet, basename="registro")

schema_view = get_schema_view(
    openapi.Info(
        title="UniTasker API",
        default_version="v1",
        description="Documentación interactiva de la API UniTasker",
    ),
    public=True,
    permission_classes=(permissions.AllowAny,),
)

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include(router.urls)),
    path("api/token/", SafeTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("swagger/", schema_view.with_ui("swagger", cache_timeout=0), name="schema-swagger-ui"),
    path("redoc/", schema_view.with_ui("redoc", cache_timeout=0), name="schema-redoc"),
]
