from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import Actividad, Tarea, RegistroAvance
from .serializers import ActividadSerializer, TareaSerializer, RegistroAvanceSerializer


class ActividadViewSet(viewsets.ModelViewSet):
    serializer_class = ActividadSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Actividad.objects.filter(usuario=self.request.user)

    def perform_create(self, serializer):
        serializer.save(usuario=self.request.user)


class TareaViewSet(viewsets.ModelViewSet):
    serializer_class = TareaSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Tarea.objects.filter(actividad__usuario=self.request.user)


class RegistroAvanceViewSet(viewsets.ModelViewSet):
    serializer_class = RegistroAvanceSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return RegistroAvance.objects.filter(
            tarea__actividad__usuario=self.request.user
        )
