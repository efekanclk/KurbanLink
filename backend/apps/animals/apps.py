from django.apps import AppConfig


class AnimalsConfig(AppConfig):
    name = 'apps.animals'
    
    def ready(self):
        import apps.animals.signals
