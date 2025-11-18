# Generated migration for payment tracking

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('cases', '0003_add_is_completed'),
    ]

    operations = [
        migrations.AddField(
            model_name='case',
            name='amount_owed',
            field=models.DecimalField(decimal_places=2, default=0.0, max_digits=10),
        ),
        migrations.AddField(
            model_name='case',
            name='amount_paid',
            field=models.DecimalField(decimal_places=2, default=0.0, max_digits=10),
        ),
        migrations.AddField(
            model_name='case',
            name='payment_notes',
            field=models.TextField(blank=True),
        ),
    ]