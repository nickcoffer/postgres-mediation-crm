from django.contrib import admin
from .models import Case, Party, Session

@admin.register(Case)
class CaseAdmin(admin.ModelAdmin):
    list_display = ("reference", "title", "status", "created_at")
    search_fields = ("reference","title")
    list_filter = ("status",)

@admin.register(Party)
class PartyAdmin(admin.ModelAdmin):
    list_display = ("first_name","last_name","email","phone","case")

@admin.register(Session)
class SessionAdmin(admin.ModelAdmin):
    list_display = ("case","session_type","start","end")
