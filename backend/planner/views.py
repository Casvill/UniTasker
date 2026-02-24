from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Actividad, Tarea, RegistroAvance
from django.shortcuts import get_object_or_404
from .serializers import ActividadSerializer, TareaSerializer, RegistroAvanceSerializer


# ------------------------------------------------------------------------------------
class ActividadViewSet(viewsets.ModelViewSet):
    serializer_class = ActividadSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Actividad.objects.filter(usuario=self.request.user)

    def perform_create(self, serializer):
        serializer.save(usuario=self.request.user)


# ------------------------------------------------------------------------------------


class TareaViewSet(viewsets.ModelViewSet):
    serializer_class = TareaSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Tarea.objects.filter(actividad__usuario=self.request.user)

    def create(self, request, *args, **kwargs):
        actividad_id = request.data.get("actividad")

        # 🔴 Si no mandan actividad
        if not actividad_id:
            return Response(
                {"actividad": ["Este campo es obligatorio."]},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # 🔴 Si actividad no existe → 404
        actividad = get_object_or_404(
            Actividad, id=actividad_id, usuario=request.user  # seguridad extra 🔥
        )

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(actividad=actividad)

        return Response(serializer.data, status=status.HTTP_201_CREATED)


# ------------------------------------------------------------------------------------


class RegistroAvanceViewSet(viewsets.ModelViewSet):
    serializer_class = RegistroAvanceSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return RegistroAvance.objects.filter(
            tarea__actividad__usuario=self.request.user
        )


# ------------------------------------------------------------------------------------
