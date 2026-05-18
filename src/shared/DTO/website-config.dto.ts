import {
  IsArray,
  IsBoolean,
  IsDate,
  IsOptional,
  IsString,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateWebsiteCountryDto {
  @IsString()
  name_sq: string;

  @IsString()
  name_mk: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

export class UpdateWebsiteCountryDto {
  @IsOptional()
  @IsString()
  name_sq?: string;

  @IsOptional()
  @IsString()
  name_mk?: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

export class CreateWebsiteCityDto {
  @IsString()
  name_sq: string;

  @IsString()
  name_mk: string;

  @IsString()
  country: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

export class UpdateWebsiteCityDto {
  @IsOptional()
  @IsString()
  name_sq?: string;

  @IsOptional()
  @IsString()
  name_mk?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

export class CreateWebsiteHotelDto {
  @IsString()
  name_sq: string;

  @IsString()
  name_mk: string;

  @IsString()
  city: string;

  @IsString()
  location_sq: string;

  @IsString()
  location_mk: string;

  @IsString()
  location_maps_link: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @IsOptional()
  @IsString()
  description_sq?: string;

  @IsOptional()
  @IsString()
  description_mk?: string;

  @IsOptional()
  @IsString()
  extra_info_sq?: string;

  @IsOptional()
  @IsString()
  extra_info_mk?: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  offer_start_date?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  offer_end_date?: Date;

  @IsOptional()
  @IsBoolean()
  has_wifi?: boolean;

  @IsOptional()
  @IsBoolean()
  has_parking?: boolean;

  @IsOptional()
  @IsBoolean()
  has_breakfast?: boolean;

  @IsOptional()
  @IsBoolean()
  has_pool?: boolean;

  @IsOptional()
  @IsBoolean()
  has_ac?: boolean;

  @IsOptional()
  @IsBoolean()
  has_spa?: boolean;

  @IsOptional()
  @IsBoolean()
  has_gym?: boolean;

  @IsOptional()
  @IsBoolean()
  has_pet_friendly?: boolean;

  @IsOptional()
  @IsBoolean()
  has_restaurant?: boolean;

  @IsOptional()
  @IsBoolean()
  has_bar?: boolean;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

export class UpdateWebsiteHotelDto {
  @IsOptional()
  @IsString()
  name_sq?: string;

  @IsOptional()
  @IsString()
  name_mk?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  location_sq?: string;

  @IsOptional()
  @IsString()
  location_mk?: string;

  @IsOptional()
  @IsString()
  location_maps_link?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @IsOptional()
  @IsString()
  description_sq?: string;

  @IsOptional()
  @IsString()
  description_mk?: string;

  @IsOptional()
  @IsString()
  extra_info_sq?: string;

  @IsOptional()
  @IsString()
  extra_info_mk?: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  offer_start_date?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  offer_end_date?: Date;

  @IsOptional()
  @IsBoolean()
  has_wifi?: boolean;

  @IsOptional()
  @IsBoolean()
  has_parking?: boolean;

  @IsOptional()
  @IsBoolean()
  has_breakfast?: boolean;

  @IsOptional()
  @IsBoolean()
  has_pool?: boolean;

  @IsOptional()
  @IsBoolean()
  has_ac?: boolean;

  @IsOptional()
  @IsBoolean()
  has_spa?: boolean;

  @IsOptional()
  @IsBoolean()
  has_gym?: boolean;

  @IsOptional()
  @IsBoolean()
  has_pet_friendly?: boolean;

  @IsOptional()
  @IsBoolean()
  has_restaurant?: boolean;

  @IsOptional()
  @IsBoolean()
  has_bar?: boolean;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
