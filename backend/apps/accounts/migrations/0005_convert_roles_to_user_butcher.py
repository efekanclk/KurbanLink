# Generated migration for Phase 10 - Role Simplification

from django.db import migrations


def convert_roles_to_user_butcher(apps, schema_editor):
    """
    Convert BUYER/SELLER roles to USER role.
    Ensure BUTCHER users also have USER role.
    """
    Role = apps.get_model('accounts', 'Role')
    UserRole = apps.get_model('accounts', 'UserRole')
    User = apps.get_model('accounts', 'User')
    
    # 1. Create USER role if not exists
    user_role, created = Role.objects.get_or_create(
        code='USER',
        defaults={'name': 'Kullanıcı'}
    )
    if created:
        print(f"✅ Created USER role")
    
    # 2. Get BUYER, SELLER, BUTCHER roles
    try:
        buyer_role = Role.objects.get(code='BUYER')
    except Role.DoesNotExist:
        buyer_role = None
    
    try:
        seller_role = Role.objects.get(code='SELLER')
    except Role.DoesNotExist:
        seller_role = None
    
    try:
        butcher_role = Role.objects.get(code='BUTCHER')
    except Role.DoesNotExist:
        butcher_role = None
    
    # 3. Convert all users
    converted_count = 0
    for user in User.objects.all():
        needs_user_role = False
        
        # Check if user has BUYER or SELLER role
        if buyer_role:
            buyer_ur = UserRole.objects.filter(user=user, role=buyer_role, is_active=True).first()
            if buyer_ur:
                needs_user_role = True
                buyer_ur.is_active = False
                buyer_ur.save()
                print(f"  Deactivated BUYER role for {user.email}")
        
        if seller_role:
            seller_ur = UserRole.objects.filter(user=user, role=seller_role, is_active=True).first()
            if seller_ur:
                needs_user_role = True
                seller_ur.is_active = False
                seller_ur.save()
                print(f"  Deactivated SELLER role for {user.email}")
        
        # Check if user has BUTCHER role
        if butcher_role:
            butcher_ur = UserRole.objects.filter(user=user, role=butcher_role, is_active=True).first()
            if butcher_ur:
                needs_user_role = True
        
        # Check if user already has no active roles (ensure they get USER)
        active_roles_count = UserRole.objects.filter(user=user, is_active=True).count()
        if active_roles_count == 0:
            needs_user_role = True
        
        # Assign USER role if needed
        if needs_user_role:
            UserRole.objects.get_or_create(
                user=user,
                role=user_role,
                defaults={'is_active': True}
            )
            converted_count += 1
            print(f"✅ Assigned USER role to {user.email}")
    
    print(f"\n✅ Migration complete: {converted_count} users converted to USER role")


def reverse_migration(apps, schema_editor):
    """
    Reverse is not fully supported (data loss may occur).
    Warn if attempting to reverse.
    """
    print("⚠️  Reversing this migration may result in data loss. Roles cannot be accurately restored.")


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0004_populate_usernames'),
    ]

    operations = [
        migrations.RunPython(convert_roles_to_user_butcher, reverse_migration),
    ]
