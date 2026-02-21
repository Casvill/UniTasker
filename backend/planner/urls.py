from rest_framework.routers import DefaultRouter
from .views import ActividadViewSet, TareaViewSet, RegistroAvanceViewSet

router = DefaultRouter()
router.register(r"actividades", ActividadViewSet, basename="actividad")
router.register(r"tareas", TareaViewSet, basename="tarea")
router.register(r"registros", RegistroAvanceViewSet, basename="registro")

urlpatterns = router.urls
