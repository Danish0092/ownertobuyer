-- Expand property categories/types: adds a PROJECTS category and the extra
-- residential, commercial, land and project/investment property types.
-- Enum additions only — no existing rows or values change.

alter type public.property_category add value if not exists 'PROJECTS';

alter type public.property_type add value if not exists 'VILLA';
alter type public.property_type add value if not exists 'TOWNHOUSE';
alter type public.property_type add value if not exists 'PENTHOUSE';
alter type public.property_type add value if not exists 'UPPER_PORTION';
alter type public.property_type add value if not exists 'LOWER_PORTION';
alter type public.property_type add value if not exists 'ROOM_STUDIO';
alter type public.property_type add value if not exists 'RESIDENTIAL_FILE';

alter type public.property_type add value if not exists 'SHOWROOM';
alter type public.property_type add value if not exists 'COMMERCIAL_UNIT';
alter type public.property_type add value if not exists 'HOTEL';
alter type public.property_type add value if not exists 'RESTAURANT_CAFE';
alter type public.property_type add value if not exists 'PETROL_STATION';

alter type public.property_type add value if not exists 'FARM_LAND';
alter type public.property_type add value if not exists 'INDUSTRIAL_LAND';
alter type public.property_type add value if not exists 'COMMERCIAL_LAND';
alter type public.property_type add value if not exists 'RESIDENTIAL_LAND';
alter type public.property_type add value if not exists 'ORCHARD_NURSERY';

alter type public.property_type add value if not exists 'NEW_DEVELOPMENT_PROJECT';
alter type public.property_type add value if not exists 'HOUSING_SOCIETY';
alter type public.property_type add value if not exists 'APARTMENT_PROJECT';
alter type public.property_type add value if not exists 'VILLA_PROJECT';
alter type public.property_type add value if not exists 'COMMERCIAL_PROJECT';
alter type public.property_type add value if not exists 'INSTALLMENT_PLAN';
alter type public.property_type add value if not exists 'INVESTMENT_OPPORTUNITY';
alter type public.property_type add value if not exists 'PRE_LAUNCH_PROJECT';
alter type public.property_type add value if not exists 'RENTAL_RETURN_PROPERTY';
