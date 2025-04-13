# Generated by Django 5.1.6 on 2025-04-13 17:03

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('apartments', '0002_alter_paymenttransaction_payment_proof_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='paymentcategory',
            name='category_type',
            field=models.CharField(choices=[('MAINTENANCE', 'Bảo trì'), ('UTILITY', 'Tiện ích'), ('SERVICE', 'Dịch vụ')], default='MAINTENANCE', max_length=50),
        ),
        migrations.AddField(
            model_name='paymentcategory',
            name='frequency',
            field=models.CharField(choices=[('ONE_TIME', 'Một lần'), ('MONTHLY', 'Hàng tháng'), ('QUARTERLY', 'Hàng quý'), ('YEARLY', 'Hàng năm')], default='MONTHLY', max_length=20),
        ),
        migrations.AddField(
            model_name='paymentcategory',
            name='grace_period',
            field=models.IntegerField(default=0),
        ),
        migrations.AddField(
            model_name='paymentcategory',
            name='tax_percentage',
            field=models.DecimalField(decimal_places=2, default=0, max_digits=5),
        ),
        migrations.AddField(
            model_name='paymenttransaction',
            name='transaction_fee',
            field=models.DecimalField(decimal_places=2, default=0, max_digits=10),
        ),
        migrations.AlterField(
            model_name='paymenttransaction',
            name='method',
            field=models.CharField(choices=[('MOMO', 'MoMo'), ('VNPAY', 'VNPay'), ('BANK', 'Bank Transfer'), ('CASH', 'Cash Payment')], max_length=20),
        ),
        migrations.AlterField(
            model_name='paymenttransaction',
            name='status',
            field=models.CharField(choices=[('PENDING', 'Chờ xử lý'), ('COMPLETED', 'Hoàn tất'), ('FAILED', 'Thất bại'), ('REFUNDED', 'Đã hoàn lại')], default='PENDING', max_length=20),
        ),
    ]
