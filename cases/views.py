from rest_framework import viewsets, permissions, status
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.response import Response
from django.contrib.auth import update_session_auth_hash
from .models import Case, Party, Session, Todo, Appointment
from .serializers import CaseSerializer, PartySerializer, SessionSerializer, TodoSerializer, AppointmentSerializer

class CaseViewSet(viewsets.ModelViewSet):
    queryset = Case.objects.all().order_by("-created_at")
    serializer_class = CaseSerializer
    permission_classes = [permissions.IsAuthenticated]

class PartyViewSet(viewsets.ModelViewSet):
    queryset = Party.objects.all().order_by("-created_at")
    serializer_class = PartySerializer
    permission_classes = [permissions.IsAuthenticated]

class SessionViewSet(viewsets.ModelViewSet):
    queryset = Session.objects.all().order_by("-created_at")
    serializer_class = SessionSerializer
    permission_classes = [permissions.IsAuthenticated]

class TodoViewSet(viewsets.ModelViewSet):
    queryset = Todo.objects.all()
    serializer_class = TodoSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        queryset = Todo.objects.all()
        case_id = self.request.query_params.get('case', None)
        if case_id is not None:
            queryset = queryset.filter(case_id=case_id)
        return queryset
    
    @action(detail=True, methods=['post'])
    def toggle_complete(self, request, pk=None):
        todo = self.get_object()
        todo.is_completed = not todo.is_completed
        if todo.is_completed:
            from django.utils import timezone
            todo.completed_at = timezone.now()
        else:
            todo.completed_at = None
        todo.save()
        serializer = self.get_serializer(todo)
        return Response(serializer.data)

class AppointmentViewSet(viewsets.ModelViewSet):
    queryset = Appointment.objects.all()
    serializer_class = AppointmentSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        queryset = Appointment.objects.all()
        case_id = self.request.query_params.get('case', None)
        if case_id is not None:
            queryset = queryset.filter(case_id=case_id)
        return queryset

@api_view(["GET"])
def login_view(request):
    """Dummy login - returns a hardcoded user"""
    from rest_framework_simplejwt.tokens import RefreshToken
    from django.contrib.auth import get_user_model
    User = get_user_model()
    try:
        user = User.objects.get(username="admin")
    except User.DoesNotExist:
        return Response({"error": "Admin user not found"}, status=status.HTTP_404_NOT_FOUND)
    
    refresh = RefreshToken.for_user(user)
    return Response({
        "access": str(refresh.access_token),
        "refresh": str(refresh),
        "user": {"username": user.username}
    })

@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def change_password(request):
    """Change password for the current user"""
    user = request.user
    old_password = request.data.get("old_password")
    new_password = request.data.get("new_password")
    
    if not user.check_password(old_password):
        return Response({"error": "Old password is incorrect"}, status=status.HTTP_400_BAD_REQUEST)
    
    user.set_password(new_password)
    user.save()
    update_session_auth_hash(request, user)
    
    return Response({"message": "Password changed successfully"})