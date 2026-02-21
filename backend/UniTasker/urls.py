from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from usuarios.views import UsuarioViewSet
from planner.views import ActividadViewSet, TareaViewSet, RegistroAvanceViewSet

router = DefaultRouter()
router.register(r"usuarios", UsuarioViewSet)
router.register(r"actividades", ActividadViewSet, basename="actividad")
router.register(r"tareas", TareaViewSet, basename="tarea")
router.register(r"registros", RegistroAvanceViewSet, basename="registro")

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include(router.urls)),
]
