# Data migration: Convert age (years) to age_months

from django.db import migrations


def migrate_age_to_months(apps, schema_editor):
    """
    Convert old age field (years) to new age_months field.
    age_months = age * 12
    """
    AnimalListing = apps.get_model('animals', 'AnimalListing')
    
    for listing in AnimalListing.objects.all():
        if listing.age is not None and listing.age_months is None:
            listing.age_months = listing.age * 12
            listing.save()
            print(f"Listing {listing.id}: age {listing.age} years → {listing.age_months} months")


def reverse_migrate(apps, schema_editor):
    """Reverse: convert age_months back to age (years)"""
    AnimalListing = apps.get_model('animals', 'AnimalListing')
    
    for listing in AnimalListing.objects.all():
        if listing.age_months is not None:
            listing.age = listing.age_months // 12
            listing.save()


class Migration(migrations.Migration):

    dependencies = [
        ('animals', '0005_add_listing_classification_fields'),
    ]

    operations = [
        migrations.RunPython(migrate_age_to_months, reverse_migrate),
    ]
