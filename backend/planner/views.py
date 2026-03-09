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
            return Tarea.objects.none()

        actividad_id = self.request.query_params.get("actividad")

        # Usamos select_related para que la carga del objeto al responder sea instantánea
        queryset = Tarea.objects.select_related('actividad').filter(
            actividad__usuario=self.request.user
        )

        if actividad_id:
            get_object_or_404(Actividad, id=actividad_id, usuario=self.request.user)
            queryset = queryset.filter(actividad_id=actividad_id)

        return queryset.order_by("fecha_objetivo")

    def perform_update(self, serializer):
        # Al actualizar una tarea (check/uncheck), el objeto se guarda
        serializer.save()

    def update(self, request, *args, **kwargs):
        # Si es un PATCH y solo viene el campo 'estado', usamos el serializador ligero
        if request.method == 'PATCH' and set(request.data.keys()) <= {'estado'}:
            instance = self.get_object()
            serializer = TareaUpdateStatusSerializer(instance, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            self.perform_update(serializer)
            response = Response(serializer.data)
        else:
            # Para actualizaciones completas, usamos el comportamiento estándar
            response = super().update(request, *args, **kwargs)
        
        # Como acaba de marcar una tarea, probablemente necesite refrescar la lista de 'hoy'
        # o sus analíticas. Le decimos al navegador que las vaya buscando.
        response['Link'] = '</api/tareas/hoy/>; rel=prefetch'
        return response  

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

        Query params opcionales: (US-05)
            - curso: filtra por nombre del curso (case-insensitive, coincidencia parcial)
            - estado: filtra por estado de la tarea (pendiente, hecha, pospuesta)

        Retorna:
          {
            "vencidas": [...],
            "para_hoy": [...],
            "proximas": [...]
          }

        Regla(susceptible a cambio): próximas = próximas 7 días (no trae tareas superiores a 7 días)
        Los filtros se aplican ANTES de agrupar, manteniendo el orden definido.
        """
        user = request.user
        today = date.today()
        window_end = today + timedelta(days=7)

        # Query params
        curso_filter = request.query_params.get("curso", "").strip()
        estado_filter = request.query_params.get("estado", "").strip().lower()

        base_qs = Tarea.objects.filter(actividad__usuario=user)

        # Aplicar filtro por curso (case-insensitive, coincidencia parcial)
        if curso_filter:
            base_qs = base_qs.filter(actividad__curso__icontains=curso_filter)

        # Aplicar filtro por estado (coincidencia exacta)
        if estado_filter:
            valid_estados = ["pendiente", "hecha", "pospuesta"]
            if estado_filter in valid_estados:
                base_qs = base_qs.filter(estado=estado_filter)

        # Construir querysets por grupo con orden y desempate
        vencidas_qs = base_qs.filter(fecha_objetivo__lt=today).order_by("fecha_objetivo", "horas_estimadas")
        para_hoy_qs = base_qs.filter(fecha_objetivo=today).order_by("horas_estimadas")
        proximas_qs = base_qs.filter(fecha_objetivo__gt=today, fecha_objetivo__lte=window_end).order_by("fecha_objetivo", "horas_estimadas")

        # Serializar (usamos HoyTareaSerializer para incluir flags)
        vencidas = HoyTareaSerializer(vencidas_qs, many=True, context={"request": request}).data
        para_hoy = HoyTareaSerializer(para_hoy_qs, many=True, context={"request": request}).data
        proximas = HoyTareaSerializer(proximas_qs, many=True, context={"request": request}).data

        total = len(vencidas) + len(para_hoy) + len(proximas)

        # Mensaje
        mensaje = None
        if total == 0:
            if curso_filter or estado_filter:
                mensaje = "No se encontraron tareas con los filtros aplicados"
            else:
                mensaje = "No tienes tareas programadas"

        return Response({
            "vencidas": vencidas,
            "para_hoy": para_hoy,
            "proximas": proximas,
            "total": total,
            "mensaje": mensaje,
        })

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
