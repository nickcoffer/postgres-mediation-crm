# Generated migration for adding is_completed field to Session model

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('cases', '0002_add_party_fields'),
    ]

    operations = [
        migrations.AddField(
            model_name='session',
            name='is_completed',
            field=models.BooleanField(default=False),
        ),
    ]
