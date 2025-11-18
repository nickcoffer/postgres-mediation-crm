from django.db import models
from django.contrib.auth import get_user_model
import uuid

User = get_user_model()

class TimeStamped(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    class Meta:
        abstract = True

class Case(TimeStamped):
    STATUS_CHOICES = [
        ("ENQUIRY","Enquiry"),
        ("MIAM","MIAM"),
        ("OPEN","Open"),
        ("PAUSED","Paused"),
        ("CLOSED","Closed"),
    ]
    reference = models.CharField(max_length=50, unique=True)
    title = models.CharField(max_length=255)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="ENQUIRY")
    notes = models.TextField(blank=True)
    
    # Party 1 fields
    party1_name = models.CharField(max_length=200, blank=True)
    party1_email = models.EmailField(blank=True)
    party1_phone = models.CharField(max_length=50, blank=True)
    
    # Party 2 fields
    party2_name = models.CharField(max_length=200, blank=True)
    party2_email = models.EmailField(blank=True)
    party2_phone = models.CharField(max_length=50, blank=True)
    
    # Additional case fields
    enquiry_date = models.DateField(null=True, blank=True)
    voucher_used = models.BooleanField(default=False)
    internal_notes = models.TextField(blank=True)
    
    # Payment tracking
    amount_owed = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    amount_paid = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    payment_notes = models.TextField(blank=True)

    def __str__(self):
        return f"{self.reference} — {self.title}"
    
    @property
    def amount_outstanding(self):
        return self.amount_owed - self.amount_paid

class Party(TimeStamped):
    case = models.ForeignKey(Case, related_name="parties", on_delete=models.CASCADE)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=50, blank=True)
    is_applicant = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.first_name} {self.last_name}"

class Session(TimeStamped):
    case = models.ForeignKey(Case, related_name="sessions", on_delete=models.CASCADE)
    session_type = models.CharField(max_length=50, default="joint")
    start = models.DateTimeField()
    end = models.DateTimeField()
    notes = models.TextField(blank=True)
    is_completed = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.case.reference} — {self.session_type}"

class Todo(TimeStamped):
    case = models.ForeignKey(Case, related_name="todos", on_delete=models.CASCADE)
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    due_date = models.DateField(null=True, blank=True)
    is_completed = models.BooleanField(default=False)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['due_date', 'created_at']

    def __str__(self):
        return f"{self.case.reference} — {self.title}"

class Appointment(TimeStamped):
    # Optional link to a case
    case = models.ForeignKey(Case, related_name="appointments", on_delete=models.CASCADE, null=True, blank=True)
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    start = models.DateTimeField()
    end = models.DateTimeField()
    location = models.CharField(max_length=255, blank=True)

    class Meta:
        ordering = ['start']

    def __str__(self):
        if self.case:
            return f"{self.case.reference} — {self.title}"
        return self.title