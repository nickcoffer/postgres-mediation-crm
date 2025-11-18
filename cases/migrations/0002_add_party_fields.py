# Generated migration for adding party fields to Case model

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('cases', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='case',
            name='party1_name',
            field=models.CharField(blank=True, max_length=200),
        ),
        migrations.AddField(
            model_name='case',
            name='party1_email',
            field=models.EmailField(blank=True, max_length=254),
        ),
        migrations.AddField(
            model_name='case',
            name='party1_phone',
            field=models.CharField(blank=True, max_length=50),
        ),
        migrations.AddField(
            model_name='case',
            name='party2_name',
            field=models.CharField(blank=True, max_length=200),
        ),
        migrations.AddField(
            model_name='case',
            name='party2_email',
            field=models.EmailField(blank=True, max_length=254),
        ),
        migrations.AddField(
            model_name='case',
            name='party2_phone',
            field=models.CharField(blank=True, max_length=50),
        ),
        migrations.AddField(
            model_name='case',
            name='enquiry_date',
            field=models.DateField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='case',
            name='voucher_used',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='case',
            name='internal_notes',
            field=models.TextField(blank=True),
        ),
    ]
