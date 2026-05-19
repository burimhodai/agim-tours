import {
  IsArray,
  IsBoolean,
  IsDate,
  IsOptional,
  IsString,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateWebsiteCountryDto {
  @ApiProperty({ description: 'Name of the country in Albanian language' })
  @IsString()
  name_sq: string;

  @ApiProperty({ description: 'Name of the country in Macedonian language' })
  @IsString()
  name_mk: string;

  @ApiPropertyOptional({ description: 'Status of the country', default: true })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

export class UpdateWebsiteCountryDto {
  @ApiPropertyOptional({ description: 'Name of the country in Albanian language' })
  @IsOptional()
  @IsString()
  name_sq?: string;

  @ApiPropertyOptional({ description: 'Name of the country in Macedonian language' })
  @IsOptional()
  @IsString()
  name_mk?: string;

  @ApiPropertyOptional({ description: 'Status of the country' })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

export class CreateWebsiteCityDto {
  @ApiProperty({ description: 'Name of the city in Albanian language' })
  @IsString()
  name_sq: string;

  @ApiProperty({ description: 'Name of the city in Macedonian language' })
  @IsString()
  name_mk: string;

  @ApiProperty({ description: 'Associated Country Mongo ID' })
  @IsString()
  country: string;

  @ApiPropertyOptional({ description: 'Status of the city', default: true })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

export class UpdateWebsiteCityDto {
  @ApiPropertyOptional({ description: 'Name of the city in Albanian language' })
  @IsOptional()
  @IsString()
  name_sq?: string;

  @ApiPropertyOptional({ description: 'Name of the city in Macedonian language' })
  @IsOptional()
  @IsString()
  name_mk?: string;

  @ApiPropertyOptional({ description: 'Associated Country Mongo ID' })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional({ description: 'Status of the city' })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

export class CreateWebsiteHotelDto {
  @ApiProperty({ description: 'Name of the hotel in Albanian language' })
  @IsString()
  name_sq: string;

  @ApiProperty({ description: 'Name of the hotel in Macedonian language' })
  @IsString()
  name_mk: string;

  @ApiProperty({ description: 'Associated City Mongo ID' })
  @IsString()
  city: string;

  @ApiProperty({ description: 'Physical address / location description in Albanian' })
  @IsString()
  location_sq: string;

  @ApiProperty({ description: 'Physical address / location description in Macedonian' })
  @IsString()
  location_mk: string;

  @ApiProperty({ description: 'Google Maps directions link' })
  @IsString()
  location_maps_link: string;

  @ApiPropertyOptional({ description: 'Array of Cloudinary uploaded image URLs', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @ApiPropertyOptional({ description: 'Description in Albanian' })
  @IsOptional()
  @IsString()
  description_sq?: string;

  @ApiPropertyOptional({ description: 'Description in Macedonian' })
  @IsOptional()
  @IsString()
  description_mk?: string;

  @ApiPropertyOptional({ description: 'Additional instructions / notes in Albanian' })
  @IsOptional()
  @IsString()
  extra_info_sq?: string;

  @ApiPropertyOptional({ description: 'Additional instructions / notes in Macedonian' })
  @IsOptional()
  @IsString()
  extra_info_mk?: string;

  @ApiPropertyOptional({ description: 'Hotel offer starting date' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  offer_start_date?: Date;

  @ApiPropertyOptional({ description: 'Hotel offer ending date' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  offer_end_date?: Date;

  @ApiPropertyOptional({ description: 'Wireless internet support', default: false })
  @IsOptional()
  @IsBoolean()
  has_wifi?: boolean;

  @ApiPropertyOptional({ description: 'Free parking availability', default: false })
  @IsOptional()
  @IsBoolean()
  has_parking?: boolean;

  @ApiPropertyOptional({ description: 'Breakfast included', default: false })
  @IsOptional()
  @IsBoolean()
  has_breakfast?: boolean;

  @ApiPropertyOptional({ description: 'Swimming pool', default: false })
  @IsOptional()
  @IsBoolean()
  has_pool?: boolean;

  @ApiPropertyOptional({ description: 'Air conditioning support', default: false })
  @IsOptional()
  @IsBoolean()
  has_ac?: boolean;

  @ApiPropertyOptional({ description: 'Spa & Wellness support', default: false })
  @IsOptional()
  @IsBoolean()
  has_spa?: boolean;

  @ApiPropertyOptional({ description: 'Gym & fitness support', default: false })
  @IsOptional()
  @IsBoolean()
  has_gym?: boolean;

  @ApiPropertyOptional({ description: 'Pet friendly support', default: false })
  @IsOptional()
  @IsBoolean()
  has_pet_friendly?: boolean;

  @ApiPropertyOptional({ description: 'Hotel restaurant availability', default: false })
  @IsOptional()
  @IsBoolean()
  has_restaurant?: boolean;

  @ApiPropertyOptional({ description: 'Bar or lounge availability', default: false })
  @IsOptional()
  @IsBoolean()
  has_bar?: boolean;

  @ApiPropertyOptional({ description: 'Status of the hotel', default: true })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @ApiPropertyOptional({ description: 'Show in top list', default: false })
  @IsOptional()
  @IsBoolean()
  show_in_top_list?: boolean;

  @ApiPropertyOptional({ description: 'Star rating from 1 to 5', minimum: 1, maximum: 5, default: 3 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  stars?: number;
}

export class UpdateWebsiteHotelDto {
  @ApiPropertyOptional({ description: 'Name of the hotel in Albanian language' })
  @IsOptional()
  @IsString()
  name_sq?: string;

  @ApiPropertyOptional({ description: 'Name of the hotel in Macedonian language' })
  @IsOptional()
  @IsString()
  name_mk?: string;

  @ApiPropertyOptional({ description: 'Associated City Mongo ID' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ description: 'Physical address / location description in Albanian' })
  @IsOptional()
  @IsString()
  location_sq?: string;

  @ApiPropertyOptional({ description: 'Physical address / location description in Macedonian' })
  @IsOptional()
  @IsString()
  location_mk?: string;

  @ApiPropertyOptional({ description: 'Google Maps directions link' })
  @IsOptional()
  @IsString()
  location_maps_link?: string;

  @ApiPropertyOptional({ description: 'Array of Cloudinary uploaded image URLs', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @ApiPropertyOptional({ description: 'Description in Albanian' })
  @IsOptional()
  @IsString()
  description_sq?: string;

  @ApiPropertyOptional({ description: 'Description in Macedonian' })
  @IsOptional()
  @IsString()
  description_mk?: string;

  @ApiPropertyOptional({ description: 'Additional instructions / notes in Albanian' })
  @IsOptional()
  @IsString()
  extra_info_sq?: string;

  @ApiPropertyOptional({ description: 'Additional instructions / notes in Macedonian' })
  @IsOptional()
  @IsString()
  extra_info_mk?: string;

  @ApiPropertyOptional({ description: 'Hotel offer starting date' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  offer_start_date?: Date;

  @ApiPropertyOptional({ description: 'Hotel offer ending date' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  offer_end_date?: Date;

  @ApiPropertyOptional({ description: 'Wireless internet support' })
  @IsOptional()
  @IsBoolean()
  has_wifi?: boolean;

  @ApiPropertyOptional({ description: 'Free parking availability' })
  @IsOptional()
  @IsBoolean()
  has_parking?: boolean;

  @ApiPropertyOptional({ description: 'Breakfast included' })
  @IsOptional()
  @IsBoolean()
  has_breakfast?: boolean;

  @ApiPropertyOptional({ description: 'Swimming pool' })
  @IsOptional()
  @IsBoolean()
  has_pool?: boolean;

  @ApiPropertyOptional({ description: 'Air conditioning support' })
  @IsOptional()
  @IsBoolean()
  has_ac?: boolean;

  @ApiPropertyOptional({ description: 'Spa & Wellness support' })
  @IsOptional()
  @IsBoolean()
  has_spa?: boolean;

  @ApiPropertyOptional({ description: 'Gym & fitness support' })
  @IsOptional()
  @IsBoolean()
  has_gym?: boolean;

  @ApiPropertyOptional({ description: 'Pet friendly support' })
  @IsOptional()
  @IsBoolean()
  has_pet_friendly?: boolean;

  @ApiPropertyOptional({ description: 'Hotel restaurant availability' })
  @IsOptional()
  @IsBoolean()
  has_restaurant?: boolean;

  @ApiPropertyOptional({ description: 'Bar or lounge availability' })
  @IsOptional()
  @IsBoolean()
  has_bar?: boolean;

  @ApiPropertyOptional({ description: 'Status of the hotel' })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @ApiPropertyOptional({ description: 'Show in top list' })
  @IsOptional()
  @IsBoolean()
  show_in_top_list?: boolean;

  @ApiPropertyOptional({ description: 'Star rating from 1 to 5', minimum: 1, maximum: 5 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  stars?: number;
}

export class CreateWebsiteTopDestinationDto {
  @ApiProperty({ description: 'Associated City Mongo ID' })
  @IsString()
  city: string;

  @ApiProperty({ description: 'Destination Image URL' })
  @IsString()
  image: string;

  @ApiPropertyOptional({ description: 'Status of the destination', default: true })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

export class UpdateWebsiteTopDestinationDto {
  @ApiPropertyOptional({ description: 'Associated City Mongo ID' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ description: 'Destination Image URL' })
  @IsOptional()
  @IsString()
  image?: string;

  @ApiPropertyOptional({ description: 'Status of the destination' })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
