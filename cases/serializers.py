from rest_framework import serializers
from .models import Case, Party, Session, Todo, Appointment

class PartySerializer(serializers.ModelSerializer):
    class Meta:
        model = Party
        fields = '__all__'

class SessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Session
        fields = '__all__'

class TodoSerializer(serializers.ModelSerializer):
    case_reference = serializers.CharField(source='case.reference', read_only=True)
    case_title = serializers.CharField(source='case.title', read_only=True)
    
    class Meta:
        model = Todo
        fields = '__all__'

class AppointmentSerializer(serializers.ModelSerializer):
    case_reference = serializers.CharField(source='case.reference', read_only=True, allow_null=True)
    case_title = serializers.CharField(source='case.title', read_only=True, allow_null=True)
    
    class Meta:
        model = Appointment
        fields = '__all__'

class CaseSerializer(serializers.ModelSerializer):
    parties = PartySerializer(many=True, read_only=True)
    sessions = SessionSerializer(many=True, read_only=True)
    todos = TodoSerializer(many=True, read_only=True)
    appointments = AppointmentSerializer(many=True, read_only=True)
    amount_outstanding = serializers.DecimalField(
        max_digits=10, decimal_places=2, read_only=True
    )

    class Meta:
        model = Case
        fields = '__all__'