# properties/models.py - COMPLETE WITH ALL MODELS
from django.db import models
from django.conf import settings
from django.utils import timezone
from datetime import timedelta
from django.core.validators import MinValueValidator, MaxValueValidator, FileExtensionValidator

class Property(models.Model):
    PROPERTY_TYPES = [
        ('house', 'House'),
        ('apartment', 'Apartment'),
        ('land', 'Land'),
        ('commercial', 'Commercial'),
        ('condo', 'Condo'),
        ('villa', 'Villa'),
        ('townhouse', 'Townhouse'),
        ('duplex', 'Duplex'),
        ('bungalow', 'Bungalow'),
    ]
    
    TRANSACTION_TYPES = [
        ('sale', 'For Sale'),
        ('rent', 'For Rent'),
        ('shortlet', 'Shortlet'),
    ]
    
    FURNISHING_STATUS = [
        ('unfurnished', 'Unfurnished'),
        ('semi_furnished', 'Semi-Furnished'),
        ('fully_furnished', 'Fully Furnished'),
        ('luxury', 'Luxury Furnished'),
    ]
    
    PARKING_TYPES = [
        ('none', 'No Parking'),
        ('street', 'Street Parking'),
        ('open', 'Open Parking'),
        ('covered', 'Covered Parking'),
        ('garage', 'Garage'),
        ('multiple', 'Multiple Garages'),
    ]
    
    # Basic Information
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='properties')
    title = models.CharField(max_length=255)
    description = models.TextField()
    property_type = models.CharField(max_length=20, choices=PROPERTY_TYPES, default='house')
    transaction_type = models.CharField(max_length=20, choices=TRANSACTION_TYPES, default='sale')
    price = models.DecimalField(max_digits=12, decimal_places=2)
    bedrooms = models.IntegerField(default=0)
    bathrooms = models.IntegerField(default=0)
    square_meters = models.IntegerField(null=True, blank=True)
    
    # Location
    latitude = models.FloatField()
    longitude = models.FloatField()
    address = models.CharField(max_length=500)
    city = models.CharField(max_length=100)
    district = models.CharField(max_length=100)
    
    # Status
    is_available = models.BooleanField(default=True)
    is_verified = models.BooleanField(default=False)
    views_count = models.IntegerField(default=0)
    likes_count = models.IntegerField(default=0)
    shares_count = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(default=timezone.now() + timedelta(days=30))
    
    # Boost
    is_boosted = models.BooleanField(default=False)
    boosted_until = models.DateTimeField(null=True, blank=True)
    boost_level = models.CharField(max_length=20, choices=[
        ('standard', 'Standard'),
        ('premium', 'Premium'),
        ('vip', 'VIP'),
    ], default='standard')
    boost_price_paid = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    boost_payment_ref = models.CharField(max_length=255, blank=True)
    
    # Video Features
    video_url = models.URLField(max_length=500, blank=True, null=True, help_text="YouTube or Vimeo URL")
    video_file = models.FileField(
        upload_to='properties/videos/%Y/%m/',
        null=True, 
        blank=True,
        validators=[FileExtensionValidator(allowed_extensions=['mp4', 'mov', 'avi', 'webm'])]
    )
    video_thumbnail = models.ImageField(upload_to='properties/videos/thumbnails/%Y/%m/', null=True, blank=True)
    virtual_tour_url = models.URLField(max_length=500, blank=True, null=True, help_text="360° Virtual Tour URL")
    
    # Neighborhood
    neighborhood_name = models.CharField(max_length=200, blank=True, help_text="Name of the neighborhood/area")
    neighborhood_description = models.TextField(blank=True, help_text="Description of the neighborhood")
    distance_to_city_center = models.DecimalField(max_digits=5, decimal_places=1, null=True, blank=True, help_text="Distance to city center (km)")
    distance_to_airport = models.DecimalField(max_digits=5, decimal_places=1, null=True, blank=True, help_text="Distance to nearest airport (km)")
    distance_to_highway = models.DecimalField(max_digits=5, decimal_places=1, null=True, blank=True, help_text="Distance to main highway (km)")
    
    # Schools
    nearby_schools = models.TextField(blank=True, help_text="List of nearby schools (comma-separated)")
    distance_to_nearest_school = models.DecimalField(max_digits=5, decimal_places=1, null=True, blank=True, help_text="Distance to nearest school (km)")
    school_rating = models.DecimalField(max_digits=3, decimal_places=1, null=True, blank=True, validators=[MinValueValidator(0), MaxValueValidator(5)], help_text="Area school rating (0-5)")
    
    # Transportation
    nearby_roads = models.CharField(max_length=500, blank=True, help_text="Main roads nearby (comma-separated)")
    nearest_road = models.CharField(max_length=200, blank=True, help_text="Nearest main road")
    public_transport = models.BooleanField(default=False, help_text="Public transport available nearby")
    nearest_bus_stop = models.CharField(max_length=200, blank=True)
    nearest_taxi_stage = models.CharField(max_length=200, blank=True)
    
    # Shopping & Amenities
    amenities = models.JSONField(default=list, blank=True, help_text="List of amenities")
    nearest_mall = models.CharField(max_length=200, blank=True)
    distance_to_mall = models.DecimalField(max_digits=5, decimal_places=1, null=True, blank=True, help_text="Distance to nearest mall (km)")
    nearest_supermarket = models.CharField(max_length=200, blank=True)
    nearest_market = models.CharField(max_length=200, blank=True)
    nearest_pharmacy = models.CharField(max_length=200, blank=True)
    nearest_hospital = models.CharField(max_length=200, blank=True)
    distance_to_hospital = models.DecimalField(max_digits=5, decimal_places=1, null=True, blank=True, help_text="Distance to nearest hospital (km)")
    
    # Entertainment
    nearest_restaurant = models.CharField(max_length=200, blank=True)
    nearest_cafe = models.CharField(max_length=200, blank=True)
    nearest_gym = models.CharField(max_length=200, blank=True)
    nearest_park = models.CharField(max_length=200, blank=True)
    
    # Property Features
    year_built = models.IntegerField(null=True, blank=True, validators=[MinValueValidator(1800), MaxValueValidator(2025)])
    furnishing_status = models.CharField(max_length=20, choices=FURNISHING_STATUS, default='unfurnished')
    parking_type = models.CharField(max_length=20, choices=PARKING_TYPES, default='none')
    parking_spaces = models.IntegerField(default=0)
    
    # Security
    has_security = models.BooleanField(default=False)
    has_cctv = models.BooleanField(default=False)
    has_electric_fence = models.BooleanField(default=False)
    has_security_lights = models.BooleanField(default=False)
    has_security_guards = models.BooleanField(default=False)
    has_gated_community = models.BooleanField(default=False)
    
    # Utilities
    has_solar = models.BooleanField(default=False)
    has_backup_generator = models.BooleanField(default=False)
    has_water_tank = models.BooleanField(default=False)
    has_borehole = models.BooleanField(default=False)
    has_internet = models.BooleanField(default=False)
    has_cable_tv = models.BooleanField(default=False)
    
    # Outdoor
    has_garden = models.BooleanField(default=False)
    has_balcony = models.BooleanField(default=False)
    has_terrace = models.BooleanField(default=False)
    has_swimming_pool = models.BooleanField(default=False)
    has_playground = models.BooleanField(default=False)
    has_bbq_area = models.BooleanField(default=False)
    
    # Interior
    has_air_conditioning = models.BooleanField(default=False)
    has_heating = models.BooleanField(default=False)
    has_fireplace = models.BooleanField(default=False)
    has_modern_kitchen = models.BooleanField(default=False)
    has_walk_in_closet = models.BooleanField(default=False)
    has_study_room = models.BooleanField(default=False)
    
    # Restrictions
    pets_allowed = models.BooleanField(default=True)
    smoking_allowed = models.BooleanField(default=True)
    
    # Energy
    energy_rating = models.CharField(max_length=10, blank=True, help_text="Energy efficiency rating (A-G)")
    
    # Legal
    has_title_deed = models.BooleanField(default=False)
    title_deed_number = models.CharField(max_length=100, blank=True)
    land_registration_number = models.CharField(max_length=100, blank=True)
    
    # Contact
    agent_phone = models.CharField(max_length=20, blank=True)
    agent_email = models.EmailField(blank=True)
    viewing_instructions = models.TextField(blank=True)
    
    class Meta:
        ordering = ['-is_boosted', '-created_at']
        indexes = [
            models.Index(fields=['city', 'district']),
            models.Index(fields=['property_type', 'transaction_type']),
            models.Index(fields=['price']),
            models.Index(fields=['bedrooms', 'bathrooms']),
            models.Index(fields=['created_at']),
            models.Index(fields=['is_boosted', '-created_at']),
        ]
    
    def __str__(self):
        return self.title
    
    def is_boosted_active(self):
        if self.is_boosted and self.boosted_until:
            return self.boosted_until > timezone.now()
        return False
    
    def get_boost_days_left(self):
        if self.boosted_until:
            days_left = (self.boosted_until - timezone.now()).days
            return max(0, days_left)
        return 0
    
    def get_amenities_list(self):
        if isinstance(self.amenities, list):
            return self.amenities
        return []
    
    def get_nearby_schools_list(self):
        if self.nearby_schools:
            return [s.strip() for s in self.nearby_schools.split(',')]
        return []
    
    def get_nearby_roads_list(self):
        if self.nearby_roads:
            return [r.strip() for r in self.nearby_roads.split(',')]
        return []
    
    @property
    def has_video(self):
        return bool(self.video_url or self.video_file)
    
    @property
    def full_address(self):
        parts = [self.address, self.district, self.city]
        return ', '.join(filter(None, parts))


class PropertyImage(models.Model):
    property = models.ForeignKey(Property, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(upload_to='properties/%Y/%m/')
    is_main = models.BooleanField(default=False)
    order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['order']
    
    def __str__(self):
        return f"{self.property.title} - Image"


class PropertyVideo(models.Model):
    property = models.ForeignKey(Property, on_delete=models.CASCADE, related_name='videos')
    video_file = models.FileField(
        upload_to='properties/videos/%Y/%m/',
        validators=[FileExtensionValidator(allowed_extensions=['mp4', 'mov', 'avi', 'webm'])]
    )
    video_url = models.URLField(blank=True, null=True)
    thumbnail = models.ImageField(upload_to='properties/videos/thumbnails/%Y/%m/', null=True, blank=True)
    title = models.CharField(max_length=200, blank=True)
    order = models.IntegerField(default=0)
    is_main = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['order']
    
    def __str__(self):
        return f"{self.property.title} - Video {self.order + 1}"


class PropertyDocument(models.Model):
    DOCUMENT_TYPES = [
        ('title_deed', 'Title Deed'),
        ('survey_plan', 'Survey Plan'),
        ('valuation_report', 'Valuation Report'),
        ('tax_clearance', 'Tax Clearance'),
        ('other', 'Other'),
    ]
    
    property = models.ForeignKey(Property, on_delete=models.CASCADE, related_name='documents')
    document_type = models.CharField(max_length=20, choices=DOCUMENT_TYPES)
    file = models.FileField(upload_to='properties/documents/%Y/%m/')
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.property.title} - {self.get_document_type_display()}"


class PropertyLike(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    property = models.ForeignKey(Property, on_delete=models.CASCADE, related_name='likes')
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ('user', 'property')
    
    def __str__(self):
        return f"{self.user.username} likes {self.property.title}"


class PropertyView(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, null=True, blank=True)
    property = models.ForeignKey(Property, on_delete=models.CASCADE, related_name='views')
    ip_address = models.GenericIPAddressField()
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"View for {self.property.title}"


class PropertyReview(models.Model):
    property = models.ForeignKey(Property, on_delete=models.CASCADE, related_name='reviews')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    rating = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    comment = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ('property', 'user')
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.user.username} - {self.property.title} - {self.rating}★"


class PropertyInquiry(models.Model):
    INQUIRY_TYPES = [
        ('viewing', 'Schedule Viewing'),
        ('price', 'Price Inquiry'),
        ('negotiation', 'Price Negotiation'),
        ('documents', 'Document Request'),
        ('general', 'General Question'),
    ]
    
    property = models.ForeignKey(Property, on_delete=models.CASCADE, related_name='inquiries')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, null=True, blank=True)
    name = models.CharField(max_length=100)
    email = models.EmailField()
    phone = models.CharField(max_length=20, blank=True)
    inquiry_type = models.CharField(max_length=20, choices=INQUIRY_TYPES, default='general')
    message = models.TextField()
    preferred_date = models.DateTimeField(null=True, blank=True)
    is_read = models.BooleanField(default=False)
    is_replied = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.name} - {self.property.title} - {self.get_inquiry_type_display()}"