# properties/management/commands/migrate_images_to_cloudinary.py
import os
from django.core.management.base import BaseCommand
from django.conf import settings
from properties.models import PropertyImage
import cloudinary.uploader
from tqdm import tqdm  # Optional: pip install tqdm

class Command(BaseCommand):
    help = 'Migrate existing local property images to Cloudinary'

    def handle(self, *args, **options):
        self.stdout.write('🔄 Starting migration of property images to Cloudinary...')
        
        images = PropertyImage.objects.all()
        total = images.count()
        
        if total == 0:
            self.stdout.write(self.style.WARNING('⚠ No images found to migrate.'))
            return
        
        self.stdout.write(f'📸 Found {total} images to migrate')
        
        success_count = 0
        error_count = 0
        
        for img in tqdm(images, desc="Uploading images"):
            try:
                # Check if already a Cloudinary URL
                if img.image and hasattr(img.image, 'url') and img.image.url and 'cloudinary' in img.image.url:
                    self.stdout.write(f'⏭ Skipping already migrated image {img.id}')
                    success_count += 1
                    continue
                
                # Get the local file path
                if hasattr(img.image, 'path') and img.image.path and os.path.exists(img.image.path):
                    file_path = img.image.path
                    
                    # Upload to Cloudinary
                    result = cloudinary.uploader.upload(
                        file_path,
                        folder=f'properties/{img.property.id}',
                        public_id=f'image_{img.id}',
                        overwrite=True
                    )
                    
                    # Update the image field with Cloudinary URL
                    # The CloudinaryField will handle this automatically
                    img.image = result['secure_url']
                    img.save()
                    
                    success_count += 1
                    self.stdout.write(self.style.SUCCESS(f'✓ Migrated image {img.id}'))
                    
                    # Optional: Delete local file after successful upload
                    # os.remove(file_path)
                    
                else:
                    self.stdout.write(self.style.WARNING(f'⚠ File not found for image {img.id}'))
                    error_count += 1
                    
            except Exception as e:
                error_count += 1
                self.stdout.write(self.style.ERROR(f'✗ Error migrating image {img.id}: {str(e)}'))
        
        self.stdout.write(self.style.SUCCESS(f'\n✅ Migration completed!'))
        self.stdout.write(f'Success: {success_count}/{total}')
        if error_count > 0:
            self.stdout.write(self.style.WARNING(f'Errors: {error_count}'))