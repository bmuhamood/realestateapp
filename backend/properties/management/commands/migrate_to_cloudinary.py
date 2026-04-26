# properties/management/commands/migrate_to_cloudinary.py
import os
from django.core.management.base import BaseCommand
from django.conf import settings
from properties.models import PropertyImage, Property, PropertyVideo
import cloudinary.uploader
from cloudinary.utils import cloudinary_url

class Command(BaseCommand):
    help = 'Migrate existing local images to Cloudinary'

    def add_arguments(self, parser):
        parser.add_argument(
            '--delete-local',
            action='store_true',
            help='Delete local files after successful upload',
        )

    def handle(self, *args, **options):
        delete_local = options['delete_local']
        
        self.stdout.write('🔄 Starting migration to Cloudinary...')
        
        # Migrate property images
        images = PropertyImage.objects.all()
        total_images = images.count()
        success_images = 0
        
        self.stdout.write(f'\n📸 Found {total_images} property images to migrate')
        
        for img in images:
            try:
                # Check if already a Cloudinary URL
                if img.image and hasattr(img.image, 'url') and 'cloudinary' in img.image.url:
                    self.stdout.write(f'⏭ Skipping already migrated image {img.id}')
                    success_images += 1
                    continue
                
                if img.image and hasattr(img.image, 'path') and img.image.path:
                    if os.path.exists(img.image.path):
                        self.stdout.write(f'📤 Uploading image {img.id}...')
                        
                        # Upload to Cloudinary
                        result = cloudinary.uploader.upload(
                            img.image.path,
                            folder=f'properties/{img.property.id}',
                            public_id=f'image_{img.id}',
                            overwrite=True
                        )
                        
                        # Update the image field
                        img.image = result['secure_url']
                        img.save()
                        
                        # Delete local file if requested
                        if delete_local and os.path.exists(img.image.path):
                            os.remove(img.image.path)
                            self.stdout.write(f'🗑 Deleted local file for image {img.id}')
                        
                        success_images += 1
                        self.stdout.write(self.style.SUCCESS(f'✓ Migrated image {img.id}'))
                    else:
                        self.stdout.write(self.style.WARNING(f'⚠ File not found for image {img.id}: {img.image.path}'))
                else:
                    self.stdout.write(self.style.WARNING(f'⚠ No file for image {img.id}'))
                    
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'✗ Error migrating image {img.id}: {str(e)}'))
        
        # Migrate video thumbnails
        videos = PropertyVideo.objects.exclude(thumbnail__isnull=True)
        total_videos = videos.count()
        success_videos = 0
        
        self.stdout.write(f'\n🎬 Found {total_videos} video thumbnails to migrate')
        
        for video in videos:
            try:
                if video.thumbnail and hasattr(video.thumbnail, 'path') and video.thumbnail.path:
                    if os.path.exists(video.thumbnail.path):
                        self.stdout.write(f'📤 Uploading video thumbnail for video {video.id}...')
                        
                        result = cloudinary.uploader.upload(
                            video.thumbnail.path,
                            folder=f'properties/{video.property.id}/thumbnails',
                            public_id=f'video_{video.id}_thumb',
                            overwrite=True
                        )
                        
                        video.thumbnail = result['secure_url']
                        video.save()
                        
                        if delete_local and os.path.exists(video.thumbnail.path):
                            os.remove(video.thumbnail.path)
                        
                        success_videos += 1
                        self.stdout.write(self.style.SUCCESS(f'✓ Migrated video thumbnail {video.id}'))
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'✗ Error migrating video thumbnail {video.id}: {str(e)}'))
        
        # Summary
        self.stdout.write(self.style.SUCCESS(f'\n✅ Migration completed!'))
        self.stdout.write(f'Images: {success_images}/{total_images} migrated')
        self.stdout.write(f'Video Thumbnails: {success_videos}/{total_videos} migrated')
        
        if delete_local:
            self.stdout.write(self.style.WARNING('\n⚠ Local files have been deleted. Make sure all images are working!'))