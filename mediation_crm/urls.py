from django.contrib import admin
from django.urls import path, include
from rest_framework import routers
from cases.views import CaseViewSet, PartyViewSet, SessionViewSet, TodoViewSet, AppointmentViewSet, login_view, change_password
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

router = routers.DefaultRouter()
router.register(r'cases', CaseViewSet, basename='case')
router.register(r'parties', PartyViewSet, basename='party')
router.register(r'sessions', SessionViewSet, basename='session')
router.register(r'todos', TodoViewSet, basename='todo')
router.register(r'appointments', AppointmentViewSet, basename='appointment')

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include(router.urls)),
    path('api/auth/jwt/create/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/auth/jwt/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/auth/login/', login_view),
    path('api/auth/change-password/', change_password),
]