from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from .models import Actividad, Tarea, RegistroAvance
from django.shortcuts import get_object_or_404
from .serializers import ActividadSerializer, TareaSerializer, RegistroAvanceSerializer, HoyTareaSerializer
from datetime import date, timedelta

# ------------------------------------------------------------------------------------
class ActividadViewSet(viewsets.ModelViewSet):
    serializer_class = ActividadSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):

        if getattr(self, 'swagger_fake_view', False):
            print(f"[Swagger] {self.__class__.__name__}: Generación del esquema, queryset vacío.")
            return Actividad.objects.none()

        return Actividad.objects.filter(usuario=self.request.user)

    def perform_create(self, serializer):
        serializer.save(usuario=self.request.user)


# ------------------------------------------------------------------------------------


class TareaViewSet(viewsets.ModelViewSet):
    serializer_class = TareaSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):

        if getattr(self, 'swagger_fake_view', False):
            print(f"[Swagger] {self.__class__.__name__}: Generación del esquema, queryset vacío.")
            return Tarea.objects.none()

        actividad_id = self.request.query_params.get("actividad")

        queryset = Tarea.objects.filter(actividad__usuario=self.request.user)

        if actividad_id:
            # Validamos que la actividad exista y sea del usuario
            get_object_or_404(Actividad, id=actividad_id, usuario=self.request.user)

            queryset = queryset.filter(actividad_id=actividad_id)

        return queryset.order_by("fecha_objetivo")  

    def create(self, request, *args, **kwargs):
        actividad_id = request.data.get("actividad")

        # Si no mandan actividad
        if not actividad_id:
            return Response(
                {"actividad": ["Este campo es obligatorio."]},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Si actividad no existe → 404
        actividad = get_object_or_404(
            Actividad, id=actividad_id, usuario=request.user  
        )

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(actividad=actividad)

        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=["get"], url_path="hoy")
    def hoy(self, request):
        """
        GET /api/tareas/hoy/
        Retorna:
          {
            "vencidas": [...],
            "para_hoy": [...],
            "proximas": [...]
          }
        Regla(susceptible a cambio): próximas = próximas 7 días (no trae tareas superiores a 7 días)
        """
        user = request.user
        today = date.today()
        window_end = today + timedelta(days=7)

        base_qs = Tarea.objects.filter(actividad__usuario=user)

        # Pre-fetch registros para evitar múltiples consultas: build map tarea_id -> latest_reg_id
        regs_qs = RegistroAvance.objects.filter(tarea__in=base_qs).order_by("tarea", "-id")
        regs_map = {}
        for r in regs_qs:
            if r.tarea_id not in regs_map:
                regs_map[r.tarea_id] = r.id

        # Construir querysets por grupo con orden y desempate
        vencidas_qs = base_qs.filter(fecha_objetivo__lt=today).order_by("fecha_objetivo", "horas_estimadas")
        para_hoy_qs = base_qs.filter(fecha_objetivo=today).order_by("horas_estimadas")
        proximas_qs = base_qs.filter(fecha_objetivo__gt=today, fecha_objetivo__lte=window_end).order_by("fecha_objetivo", "horas_estimadas")

        # Serializar (usamos HoyTareaSerializer para incluir flags)
        vencidas = HoyTareaSerializer(vencidas_qs, many=True, context={"request": request}).data
        para_hoy = HoyTareaSerializer(para_hoy_qs, many=True, context={"request": request}).data
        proximas = HoyTareaSerializer(proximas_qs, many=True, context={"request": request}).data

        return Response({"vencidas": vencidas, "para_hoy": para_hoy, "proximas": proximas}) 

# ------------------------------------------------------------------------------------


class RegistroAvanceViewSet(viewsets.ModelViewSet):
    serializer_class = RegistroAvanceSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):

        if getattr(self, 'swagger_fake_view', False):
            print(f"[Swagger] {self.__class__.__name__}: Generación del esquema, queryset vacío.")
            return RegistroAvance.objects.none()

        return RegistroAvance.objects.filter(
            tarea__actividad__usuario=self.request.user
        )


# ------------------------------------------------------------------------------------
