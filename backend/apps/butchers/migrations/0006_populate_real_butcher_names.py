# Generated migration to populate real butcher names

from django.db import migrations


def populate_real_names(apps, schema_editor):
    """
    Replace "Bilinmiyor" defaults with meaningful names based on usernames.
    """
    ButcherProfile = apps.get_model('butchers', 'ButcherProfile')
    
    # Manual mapping based on current database state
    name_mapping = {
        'mehmetkasap': ('Mehmet', 'Kasap'),
        'kasapdeneme': ('Kasap', 'Deneme'),
        'alikustar': ('Ali', 'Kuştar'),
        'kasap2': ('Kasap', 'İki'),
    }
    
    for profile in ButcherProfile.objects.all():
        username = profile.user.username
        if username in name_mapping:
            first_name, last_name = name_mapping[username]
            profile.first_name = first_name
            profile.last_name = last_name
            profile.save()
            print(f'Updated {username}: {first_name} {last_name}')
        else:
            # Fallback: capitalize username as first name
            profile.first_name = username.capitalize()
            profile.last_name = ''
            profile.save()
            print(f'Updated {username}: {profile.first_name} (no last name)')


def reverse_populate(apps, schema_editor):
    """
    Reverse: set back to "Bilinmiyor"
    """
    ButcherProfile = apps.get_model('butchers', 'ButcherProfile')
    ButcherProfile.objects.all().update(
        first_name='Bilinmiyor',
        last_name='Bilinmiyor'
    )


class Migration(migrations.Migration):

    dependencies = [
        ('butchers', '0005_populate_butcher_names'),
    ]

    operations = [
        migrations.RunPython(populate_real_names, reverse_populate),
    ]
