# properties/models.py - USING STANDARD UUID (WORKING VERSION)
from django.db import models
from django.conf import settings
from django.utils import timezone
from datetime import timedelta
from django.core.validators import MinValueValidator, MaxValueValidator
from cloudinary.models import CloudinaryField
import uuid


class Property(models.Model):
    # Expanded PROPERTY TYPES
    PROPERTY_TYPES = [
        # Residential
        ('house', 'House'),
        ('apartment', 'Apartment'),
        ('condo', 'Condo'),
        ('villa', 'Villa'),
        ('townhouse', 'Townhouse'),
        ('duplex', 'Duplex'),
        ('triplex', 'Triplex'),
        ('bungalow', 'Bungalow'),
        ('mansion', 'Mansion'),
        ('studio', 'Studio Apartment'),
        ('penthouse', 'Penthouse'),
        ('loft', 'Loft'),
        ('farmhouse', 'Farmhouse'),
        ('cottage', 'Cottage'),
        ('cabin', 'Cabin'),
        ('row_house', 'Row House'),
        
        # Commercial
        ('office', 'Office Space'),
        ('retail', 'Retail Space'),
        ('shop', 'Shop'),
        ('restaurant', 'Restaurant Space'),
        ('cafe', 'Cafe Space'),
        ('hotel', 'Hotel'),
        ('lodge', 'Lodge'),
        ('warehouse', 'Warehouse'),
        ('factory', 'Factory/Industrial'),
        ('showroom', 'Showroom'),
        ('mall_space', 'Mall Space'),
        
        # Land
        ('land', 'Land'),
        ('agricultural_land', 'Agricultural Land'),
        ('commercial_land', 'Commercial Land'),
        ('industrial_land', 'Industrial Land'),
        ('residential_land', 'Residential Land'),
        ('mixed_use_land', 'Mixed-Use Land'),
        ('farm_land', 'Farm Land'),
        ('ranch', 'Ranch'),
        ('plot', 'Building Plot'),
        
        # Special Purpose
        ('school', 'School/Educational'),
        ('hospital', 'Hospital/Medical'),
        ('church', 'Church/Worship'),
        ('mosque', 'Mosque'),
        ('temple', 'Temple'),
        ('community_center', 'Community Center'),
        ('sports_facility', 'Sports Facility'),
        ('parking_lot', 'Parking Lot'),
        ('event_center', 'Event Center'),
        ('funeral_home', 'Funeral Home'),
        
        # Industrial
        ('industrial', 'Industrial'),
        ('manufacturing', 'Manufacturing'),
        ('storage', 'Storage Facility'),
        ('cold_storage', 'Cold Storage'),
        ('workshop', 'Workshop'),
        
        # Mixed Use
        ('mixed_use', 'Mixed Use'),
        ('live_work', 'Live-Work Unit'),
    ]
    
    # Expanded TRANSACTION TYPES
    TRANSACTION_TYPES = [
        ('sale', 'For Sale'),
        ('rent', 'For Rent'),
        ('shortlet', 'Shortlet'),
        ('lease', 'Long-term Lease'),
        ('auction', 'Auction'),
        ('foreclosure', 'Foreclosure'),
        ('pre_construction', 'Pre-Construction'),
        ('exchange', 'Property Exchange'),
        ('rent_to_own', 'Rent to Own'),
        ('commercial_lease', 'Commercial Lease'),
    ]
    
    # Expanded FURNISHING STATUS
    FURNISHING_STATUS = [
        ('unfurnished', 'Unfurnished'),
        ('semi_furnished', 'Semi-Furnished'),
        ('fully_furnished', 'Fully Furnished'),
        ('luxury', 'Luxury Furnished'),
        ('bare_shell', 'Bare Shell'),
        ('white_box', 'White Box'),
        ('turnkey', 'Turnkey Ready'),
    ]
    
    # Expanded PARKING TYPES
    PARKING_TYPES = [
        ('none', 'No Parking'),
        ('street', 'Street Parking'),
        ('open', 'Open Parking'),
        ('covered', 'Covered Parking'),
        ('garage', 'Garage'),
        ('multiple', 'Multiple Garages'),
        ('underground', 'Underground Parking'),
        ('valet', 'Valet Parking'),
        ('carport', 'Carport'),
        ('parking_lot', 'Designated Parking Lot'),
        ('parking_permit', 'Parking Permit Required'),
    ]
    
    # New: OWNERSHIP TYPES
    OWNERSHIP_TYPES = [
        ('freehold', 'Freehold'),
        ('leasehold', 'Leasehold'),
        ('shared_ownership', 'Shared Ownership'),
        ('co_op', 'Co-operative'),
        ('timeshare', 'Timeshare'),
        ('land_lease', 'Land Lease'),
        ('government', 'Government Owned'),
        ('trust', 'Trust Ownership'),
    ]
    
    # New: PROPERTY CONDITIONS
    PROPERTY_CONDITIONS = [
        ('new', 'New Construction'),
        ('excellent', 'Excellent Condition'),
        ('good', 'Good Condition'),
        ('needs_updating', 'Needs Updating'),
        ('needs_renovation', 'Needs Renovation'),
        ('fixer_upper', 'Fixer Upper'),
        ('under_construction', 'Under Construction'),
        ('shell', 'Shell Condition'),
        ('as_is', 'Sold As-Is'),
        ('repossessed', 'Repossessed'),
        ('heritage', 'Heritage Listed'),
    ]
    
    # New: TENURE TYPES (Uganda specific)
    TENURE_TYPES = [
        ('freehold', 'Freehold'),
        ('leasehold', 'Leasehold'),
        ('mailo', 'Mailo Land'),
        ('customary', 'Customary'),
        ('kibanja', 'Kibanja'),
        ('permanent', 'Permanent'),
        ('temporary', 'Temporary'),
    ]
    
    # New: RENTAL FREQUENCY
    RENTAL_FREQUENCY = [
        ('monthly', 'Monthly'),
        ('quarterly', 'Quarterly'),
        ('semi_annually', 'Semi-Annually'),
        ('annually', 'Annually'),
        ('weekly', 'Weekly'),
        ('daily', 'Daily'),
    ]
    
    # New: BUILDING TYPES
    BUILDING_TYPES = [
        ('detached', 'Detached'),
        ('semi_detached', 'Semi-Detached'),
        ('attached', 'Attached'),
        ('corner', 'Corner Unit'),
        ('end_unit', 'End Unit'),
        ('mid_rise', 'Mid-Rise Building'),
        ('high_rise', 'High-Rise Building'),
        ('low_rise', 'Low-Rise Building'),
    ]
    
    # New: FLOOR LEVEL (for apartments/offices)
    FLOOR_LEVELS = [
        ('ground', 'Ground Floor'),
        ('upper', 'Upper Floor'),
        ('top', 'Top Floor'),
        ('basement', 'Basement'),
        ('mezzanine', 'Mezzanine'),
    ]
    
    # Use UUID as the primary key (simple and works out of the box)
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Basic Information
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='properties')
    title = models.CharField(max_length=255)
    description = models.TextField()
    property_type = models.CharField(max_length=30, choices=PROPERTY_TYPES, default='house')
    transaction_type = models.CharField(max_length=30, choices=TRANSACTION_TYPES, default='sale')
    price = models.DecimalField(max_digits=12, decimal_places=2)
    bedrooms = models.IntegerField(default=0)
    bathrooms = models.IntegerField(default=0)
    square_meters = models.IntegerField(null=True, blank=True)
    
    # Location
    latitude = models.FloatField(null=True, blank=True)   # ✅ Add null=True, blank=True
    longitude = models.FloatField(null=True, blank=True)  # ✅ Add null=True, blank=True
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
    video_file = CloudinaryField('video_file',
                                 folder='properties/videos/',
                                 null=True, blank=True,
                                 resource_type='video')
    video_thumbnail = CloudinaryField('video_thumbnail',
                                      folder='properties/videos/thumbnails/',
                                      null=True, blank=True)
    virtual_tour_url = models.URLField(max_length=500, blank=True, null=True, help_text="360° Virtual Tour URL")
    
    # New: Ownership & Legal
    ownership_type = models.CharField(max_length=30, choices=OWNERSHIP_TYPES, default='freehold')
    property_condition = models.CharField(max_length=30, choices=PROPERTY_CONDITIONS, default='good')
    tenure_type = models.CharField(max_length=30, choices=TENURE_TYPES, default='freehold')
    building_type = models.CharField(max_length=30, choices=BUILDING_TYPES, blank=True, null=True)
    floor_level = models.CharField(max_length=30, choices=FLOOR_LEVELS, blank=True, null=True)
    rental_frequency = models.CharField(max_length=30, choices=RENTAL_FREQUENCY, default='monthly')
    
    # New: Building Information
    number_of_buildings = models.IntegerField(default=1, help_text="Number of buildings on property")
    number_of_floors = models.IntegerField(default=1, help_text="Number of floors in the building")
    floor_number = models.IntegerField(null=True, blank=True, help_text="Which floor (for apartments/offices)")
    total_floors = models.IntegerField(null=True, blank=True, help_text="Total floors in building")
    elevator_available = models.BooleanField(default=False)
    year_renovated = models.IntegerField(null=True, blank=True, validators=[MinValueValidator(1800), MaxValueValidator(2025)])
    
    # New: Commercial Features
    is_accessible = models.BooleanField(default=True, help_text="Wheelchair accessible")
    has_reception = models.BooleanField(default=False, help_text="Has reception area")
    has_meeting_rooms = models.BooleanField(default=False, help_text="Has meeting rooms")
    number_of_meeting_rooms = models.IntegerField(default=0)
    has_kitchenette = models.BooleanField(default=False)
    has_server_room = models.BooleanField(default=False)
    has_pantry = models.BooleanField(default=False)
    has_emergency_exits = models.BooleanField(default=True)
    loading_dock = models.BooleanField(default=False, help_text="Commercial loading dock")
    signage_allowed = models.BooleanField(default=True, help_text="Business signage allowed")
    
    # New: Zoning Information
    zoning_type = models.CharField(max_length=100, blank=True, help_text="Zoning classification")
    permitted_uses = models.TextField(blank=True, help_text="Permitted business/use types")
    
    # New: Utility Details
    water_source = models.CharField(max_length=100, blank=True, help_text="Source of water (National, Borehole, Tank)")
    power_source = models.CharField(max_length=100, blank=True, help_text="Power source (National, Solar, Generator)")
    has_gas = models.BooleanField(default=False, help_text="Natural gas available")
    sewage_system = models.CharField(max_length=100, blank=True, choices=[
        ('septic', 'Septic Tank'),
        ('sewer', 'Municipal Sewer'),
        ('cesspool', 'Cesspool'),
        ('none', 'None'),
    ], default='septic')
    
    # New: Nearby Facilities (Expanded)
    nearest_bank = models.CharField(max_length=200, blank=True)
    nearest_police_station = models.CharField(max_length=200, blank=True)
    nearest_fire_station = models.CharField(max_length=200, blank=True)
    nearest_daycare = models.CharField(max_length=200, blank=True)
    nearest_university = models.CharField(max_length=200, blank=True)
    
    # Neighborhood (Existing)
    neighborhood_name = models.CharField(max_length=200, blank=True, help_text="Name of the neighborhood/area")
    neighborhood_description = models.TextField(blank=True, help_text="Description of the neighborhood")
    distance_to_city_center = models.DecimalField(max_digits=5, decimal_places=1, null=True, blank=True)
    distance_to_airport = models.DecimalField(max_digits=5, decimal_places=1, null=True, blank=True)
    distance_to_highway = models.DecimalField(max_digits=5, decimal_places=1, null=True, blank=True)
    
    # Schools (Existing)
    nearby_schools = models.TextField(blank=True)
    distance_to_nearest_school = models.DecimalField(max_digits=5, decimal_places=1, null=True, blank=True)
    school_rating = models.DecimalField(max_digits=3, decimal_places=1, null=True, blank=True, validators=[MinValueValidator(0), MaxValueValidator(5)])
    
    # Transportation (Existing)
    nearby_roads = models.CharField(max_length=500, blank=True)
    nearest_road = models.CharField(max_length=200, blank=True)
    public_transport = models.BooleanField(default=False)
    nearest_bus_stop = models.CharField(max_length=200, blank=True)
    nearest_taxi_stage = models.CharField(max_length=200, blank=True)
    
    # Shopping & Amenities (Existing)
    amenities = models.JSONField(default=list, blank=True)
    nearest_mall = models.CharField(max_length=200, blank=True)
    distance_to_mall = models.DecimalField(max_digits=5, decimal_places=1, null=True, blank=True)
    nearest_supermarket = models.CharField(max_length=200, blank=True)
    nearest_market = models.CharField(max_length=200, blank=True)
    nearest_pharmacy = models.CharField(max_length=200, blank=True)
    nearest_hospital = models.CharField(max_length=200, blank=True)
    distance_to_hospital = models.DecimalField(max_digits=5, decimal_places=1, null=True, blank=True)
    
    # Entertainment (Existing)
    nearest_restaurant = models.CharField(max_length=200, blank=True)
    nearest_cafe = models.CharField(max_length=200, blank=True)
    nearest_gym = models.CharField(max_length=200, blank=True)
    nearest_park = models.CharField(max_length=200, blank=True)
    
    # Property Features (Existing)
    year_built = models.IntegerField(null=True, blank=True, validators=[MinValueValidator(1800), MaxValueValidator(2025)])
    furnishing_status = models.CharField(max_length=30, choices=FURNISHING_STATUS, default='unfurnished')
    parking_type = models.CharField(max_length=30, choices=PARKING_TYPES, default='none')
    parking_spaces = models.IntegerField(default=0)
    
    # Security (Existing)
    has_security = models.BooleanField(default=False)
    has_cctv = models.BooleanField(default=False)
    has_electric_fence = models.BooleanField(default=False)
    has_security_lights = models.BooleanField(default=False)
    has_security_guards = models.BooleanField(default=False)
    has_gated_community = models.BooleanField(default=False)
    
    # Utilities (Existing)
    has_solar = models.BooleanField(default=False)
    has_backup_generator = models.BooleanField(default=False)
    has_water_tank = models.BooleanField(default=False)
    has_borehole = models.BooleanField(default=False)
    has_internet = models.BooleanField(default=False)
    has_cable_tv = models.BooleanField(default=False)
    
    # Outdoor (Existing)
    has_garden = models.BooleanField(default=False)
    has_balcony = models.BooleanField(default=False)
    has_terrace = models.BooleanField(default=False)
    has_swimming_pool = models.BooleanField(default=False)
    has_playground = models.BooleanField(default=False)
    has_bbq_area = models.BooleanField(default=False)
    
    # Interior (Existing)
    has_air_conditioning = models.BooleanField(default=False)
    has_heating = models.BooleanField(default=False)
    has_fireplace = models.BooleanField(default=False)
    has_modern_kitchen = models.BooleanField(default=False)
    has_walk_in_closet = models.BooleanField(default=False)
    has_study_room = models.BooleanField(default=False)
    
    # Restrictions (Existing)
    pets_allowed = models.BooleanField(default=True)
    smoking_allowed = models.BooleanField(default=True)
    events_allowed = models.BooleanField(default=True, help_text="Events/parties allowed")
    
    # Energy (Existing)
    energy_rating = models.CharField(max_length=10, blank=True)
    
    # Legal (Existing)
    has_title_deed = models.BooleanField(default=False)
    title_deed_number = models.CharField(max_length=100, blank=True)
    land_registration_number = models.CharField(max_length=100, blank=True)
    
    # Contact (Existing)
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
            models.Index(fields=['ownership_type']),
            models.Index(fields=['property_condition']),
        ]
    
    def __str__(self):
        return f"{self.title} ({str(self.id)[:8]})"
    
    @property
    def property_category(self):
        """Get the category of the property"""
        residential = ['house', 'apartment', 'condo', 'villa', 'townhouse', 'duplex', 
                       'triplex', 'bungalow', 'mansion', 'studio', 'penthouse', 'loft',
                       'farmhouse', 'cottage', 'cabin', 'row_house']
        commercial = ['office', 'retail', 'shop', 'restaurant', 'cafe', 'hotel', 'lodge',
                      'warehouse', 'factory', 'showroom', 'mall_space', 'commercial_land']
        land = ['land', 'agricultural_land', 'commercial_land', 'industrial_land',
                'residential_land', 'mixed_use_land', 'farm_land', 'ranch', 'plot']
        
        if self.property_type in residential:
            return 'residential'
        elif self.property_type in commercial:
            return 'commercial'
        elif self.property_type in land:
            return 'land'
        else:
            return 'special'
    
    @property
    def is_commercial(self):
        return self.property_category == 'commercial'
    
    @property
    def is_residential(self):
        return self.property_category == 'residential'
    
    @property
    def is_land(self):
        return self.property_category == 'land'
    
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
    
    def get_video_url(self):
        if self.video_file:
            return self.video_file.url
        return self.video_url


# PropertyImage Model
class PropertyImage(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    property = models.ForeignKey(Property, on_delete=models.CASCADE, related_name='images')
    image = CloudinaryField('image', 
                            folder='properties/images/',
                            transformation={'quality': 'auto', 'fetch_format': 'auto'})
    is_main = models.BooleanField(default=False)
    order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['order']
    
    def __str__(self):
        return f"{self.property.title} - Image {self.order}"
    
    def get_image_url(self, width=None, height=None):
        if self.image:
            if width and height:
                return self.image.build_url(
                    transformation={'width': width, 'height': height, 'crop': 'fill'}
                )
            return self.image.url
        return None
    
    def get_thumbnail_url(self):
        return self.get_image_url(width=300, height=200)
    
    def save(self, *args, **kwargs):
        if self.is_main:
            PropertyImage.objects.filter(property=self.property, is_main=True).update(is_main=False)
        super().save(*args, **kwargs)


# PropertyVideo Model
class PropertyVideo(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    property = models.ForeignKey(Property, on_delete=models.CASCADE, related_name='videos')
    video_file = CloudinaryField('video', 
                                 folder='properties/videos/',
                                 resource_type='video', 
                                 null=True, blank=True)
    video_url = models.URLField(blank=True, null=True)
    thumbnail = CloudinaryField('thumbnail',
                                folder='properties/videos/thumbnails/',
                                null=True, blank=True)
    title = models.CharField(max_length=200, blank=True)
    order = models.IntegerField(default=0)
    is_main = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['order']
    
    def __str__(self):
        return f"{self.property.title} - Video {self.order + 1}"
    
    def get_video_url(self):
        if self.video_file:
            return self.video_file.url
        return self.video_url
    
    def get_thumbnail_url(self):
        if self.thumbnail:
            return self.thumbnail.url
        if self.video_file:
            return self.video_file.build_url(
                resource_type='video',
                transformation={'start_offset': '0', 'width': 640, 'crop': 'fill'}
            )
        return None


# PropertyDocument Model
class PropertyDocument(models.Model):
    DOCUMENT_TYPES = [
        ('title_deed', 'Title Deed'),
        ('survey_plan', 'Survey Plan'),
        ('valuation_report', 'Valuation Report'),
        ('tax_clearance', 'Tax Clearance'),
        ('other', 'Other'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    property = models.ForeignKey(Property, on_delete=models.CASCADE, related_name='documents')
    document_type = models.CharField(max_length=20, choices=DOCUMENT_TYPES)
    file = CloudinaryField('file', 
                          folder='properties/documents/',
                          resource_type='raw', 
                          null=True, blank=True)
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.property.title} - {self.get_document_type_display()}"
    
    def get_file_url(self):
        if self.file:
            return self.file.url
        return None


# PropertyLike Model
class PropertyLike(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    property = models.ForeignKey(Property, on_delete=models.CASCADE, related_name='likes')
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ('user', 'property')
    
    def __str__(self):
        return f"{self.user.username} likes {self.property.title}"


# PropertyView Model
class PropertyView(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, null=True, blank=True)
    property = models.ForeignKey(Property, on_delete=models.CASCADE, related_name='views')
    ip_address = models.GenericIPAddressField()
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"View for {self.property.title}"


# PropertyReview Model
class PropertyReview(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
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


# PropertyInquiry Model
class PropertyInquiry(models.Model):
    INQUIRY_TYPES = [
        ('viewing', 'Schedule Viewing'),
        ('price', 'Price Inquiry'),
        ('negotiation', 'Price Negotiation'),
        ('documents', 'Document Request'),
        ('general', 'General Question'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
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


# BankRate Model (keep AutoField as it's not sensitive)
class BankRate(models.Model):
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=100)
    interest_rate = models.DecimalField(max_digits=5, decimal_places=3)
    max_term = models.IntegerField()
    min_down_payment = models.DecimalField(max_digits=5, decimal_places=3)
    is_active = models.BooleanField(default=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['interest_rate']
    
    def __str__(self):
        return f"{self.name} - {self.interest_rate * 100}%"