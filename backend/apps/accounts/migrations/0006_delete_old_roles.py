# Generated migration for cleaning up old BUYER/SELLER roles

from django.db import migrations


def delete_old_roles(apps, schema_editor):
    """
    Delete BUYER and SELLER roles and their inactive UserRole relationships.
    Safe to run because migration 0005 already deactivated these roles.
    """
    Role = apps.get_model('accounts', 'Role')
    UserRole = apps.get_model('accounts', 'UserRole')
    
    # Delete all UserRole records for BUYER/SELLER (active and inactive)
    buyer_seller_roles = Role.objects.filter(code__in=['BUYER', 'SELLER'])
    deleted_user_roles = UserRole.objects.filter(role__in=buyer_seller_roles).delete()
    print(f"Deleted {deleted_user_roles[0]} UserRole records")
    
    # Delete BUYER and SELLER roles
    deleted_roles = buyer_seller_roles.delete()
    print(f"Deleted {deleted_roles[0]} Role records")
    
    # Verify only USER and BUTCHER remain
    remaining_roles = Role.objects.all()
    print(f"Remaining roles: {[r.code for r in remaining_roles]}")


def reverse_delete_old_roles(apps, schema_editor):
    """
    Reverse migration - recreate BUYER and SELLER roles.
    Note: UserRole relationships won't be restored.
    """
    Role = apps.get_model('accounts', 'Role')
    
    Role.objects.get_or_create(code='BUYER', defaults={'name': 'Alıcı1'})
    Role.objects.get_or_create(code='SELLER', defaults={'name': 'Satıcı1'})
    print("Recreated BUYER and SELLER roles")


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0005_convert_roles_to_user_butcher'),
    ]

    operations = [
        migrations.RunPython(delete_old_roles, reverse_delete_old_roles),
    ]
