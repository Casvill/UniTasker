from rest_framework import serializers
from .models import Actividad, Tarea, RegistroAvance


# ------------------------------------------------------------------------------------
class ActividadSerializer(serializers.ModelSerializer):

    class Meta:
        model = Actividad
        fields = "__all__"
        read_only_fields = ["usuario", "creada_en"]

    # Validar título
    def validate_titulo(self, value):
        if not value.strip():
            raise serializers.ValidationError("El campo título es obligatorio.")
        return value

    # Validar curso
    def validate_curso(self, value):
        if not value.strip():
            raise serializers.ValidationError("El campu curso es obligatorio.")
        return value

    # Validar tipo
    def validate_tipo(self, value):
        tipos_validos = [choice[0] for choice in Actividad.TIPOS]
        if value not in tipos_validos:
            raise serializers.ValidationError("Tipo de actividad no válido.")
        return value


# ------------------------------------------------------------------------------------


class TareaSerializer(serializers.ModelSerializer):

    class Meta:
        model = Tarea
        fields = "__all__"
        read_only_fields = ["creada_en", "actualizada_en"]
        extra_kwargs = {
            "nombre": {
                "error_messages": {
                    "blank": "El nombre es obligatorio.",
                    "required": "El nombre es obligatorio.",
                }
            },
            "fecha_objetivo": {
                "error_messages": {
                    "invalid": "La fecha debe tener formato YYYY-MM-DD.",
                    "required": "La fecha objetivo es obligatoria.",
                }
            },
        }

    # Validar horas_estimadas > 0
    def validate_horas_estimadas(self, value):
        if value <= 0:
            raise serializers.ValidationError(
                "Las horas estimadas deben ser mayores a 0."
            )
        return value

    # Validar fecha válida (DRF ya valida formato automáticamente)
    def validate_fecha_objetivo(self, value):
        if not value:
            raise serializers.ValidationError("La fecha objetivo es obligatoria.")
        return value


# ------------------------------------------------------------------------------------


class RegistroAvanceSerializer(serializers.ModelSerializer):

    class Meta:
        model = RegistroAvance
        fields = "__all__"
        read_only_fields = ["creada_en"]


# ------------------------------------------------------------------------------------

class HoyTareaSerializer(serializers.ModelSerializer):
    """
    Serializer para la respuesta /tareas/hoy/
    """

    actividad = serializers.CharField(source="actividad.titulo", read_only=True)

    class Meta:
        model = Tarea
        fields = ["id", 
                  "nombre", 
                  "fecha_objetivo", 
                  "horas_estimadas", 
                  "actividad", 
                  ]