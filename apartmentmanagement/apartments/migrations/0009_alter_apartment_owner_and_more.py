# Generated by Django 5.2.2 on 2025-06-09 01:31

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('apartments', '0008_alter_apartment_floor'),
    ]

    operations = [
        migrations.AlterField(
            model_name='apartment',
            name='owner',
            field=models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='owned_apartments', to='apartments.resident'),
        ),
        migrations.AlterField(
            model_name='apartmenttransferhistory',
            name='new_owner',
            field=models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='new_apartment_owners', to='apartments.resident'),
        ),
        migrations.AlterField(
            model_name='apartmenttransferhistory',
            name='previous_owner',
            field=models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='previous_apartment_owners', to='apartments.resident'),
        ),
        migrations.DeleteModel(
            name='FirebaseToken',
        ),
    ]
