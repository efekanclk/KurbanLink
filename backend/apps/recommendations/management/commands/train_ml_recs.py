from django.core.management.base import BaseCommand
from apps.recommendations.ml_services import ml_model

class Command(BaseCommand):
    help = 'Trains the Machine Learning Collaborative Filtering model for recommendations'

    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE('Starting ML model training...'))
        
        success = ml_model.train_model()
        
        if success:
            self.stdout.write(self.style.SUCCESS(f'Successfully trained ML model. Matrix shape: {ml_model.item_similarity_df.shape}'))
        else:
            self.stdout.write(self.style.WARNING('ML model training completed, but no data was processed or an error occurred.'))
