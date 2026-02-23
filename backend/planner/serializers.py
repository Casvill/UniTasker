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
        read_only_fields = ["creada_en"]


class RegistroAvanceSerializer(serializers.ModelSerializer):

    class Meta:
        model = RegistroAvance
        fields = "__all__"
        read_only_fields = ["creada_en"]
