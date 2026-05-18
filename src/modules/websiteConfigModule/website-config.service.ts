import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  CreateWebsiteCountryDto,
  UpdateWebsiteCountryDto,
  CreateWebsiteCityDto,
  UpdateWebsiteCityDto,
  CreateWebsiteHotelDto,
  UpdateWebsiteHotelDto,
} from '../../shared/DTO/website-config.dto';

@Injectable()
export class WebsiteConfigService implements OnModuleInit {
  constructor(
    @InjectModel('WebsiteCountry')
    private readonly countryModel: Model<any>,
    @InjectModel('WebsiteCity')
    private readonly cityModel: Model<any>,
    @InjectModel('WebsiteHotel')
    private readonly hotelModel: Model<any>,
  ) {}

  async onModuleInit() {
    const count = await this.countryModel.countDocuments();
    if (count === 0) {
      await this.seedData();
    }
  }

  async createCountry(data: CreateWebsiteCountryDto) {
    const country = new this.countryModel(data);
    return country.save();
  }

  async findAllCountries() {
    return this.countryModel
      .find({ is_deleted: { $ne: true } })
      .sort({ name_sq: 1 })
      .lean();
  }

  async findOneCountry(id: string) {
    const country = await this.countryModel
      .findOne({
        _id: new Types.ObjectId(id),
        is_deleted: { $ne: true },
      })
      .lean();
    if (!country) {
      throw new NotFoundException('Country not found');
    }
    return country;
  }

  async updateCountry(id: string, data: UpdateWebsiteCountryDto) {
    const country = await this.countryModel
      .findOneAndUpdate(
        { _id: new Types.ObjectId(id), is_deleted: { $ne: true } },
        { $set: data },
        { new: true },
      )
      .lean();
    if (!country) {
      throw new NotFoundException('Country not found');
    }
    return country;
  }

  async deleteCountry(id: string) {
    const country = await this.countryModel
      .findOneAndUpdate(
        { _id: new Types.ObjectId(id), is_deleted: { $ne: true } },
        { $set: { is_deleted: true } },
        { new: true },
      )
      .lean();
    if (!country) {
      throw new NotFoundException('Country not found');
    }
    return country;
  }

  async createCity(data: CreateWebsiteCityDto) {
    await this.findOneCountry(data.country);
    const city = new this.cityModel({
      ...data,
      country: new Types.ObjectId(data.country),
    });
    const savedCity = await city.save();
    return this.cityModel
      .findById(savedCity._id)
      .populate('country')
      .lean();
  }

  async findAllCities(countryId?: string) {
    const query: any = { is_deleted: { $ne: true } };
    if (countryId) {
      query.country = new Types.ObjectId(countryId);
    }
    return this.cityModel
      .find(query)
      .populate('country')
      .sort({ name_sq: 1 })
      .lean();
  }

  async findOneCity(id: string) {
    const city = await this.cityModel
      .findOne({
        _id: new Types.ObjectId(id),
        is_deleted: { $ne: true },
      })
      .populate('country')
      .lean();
    if (!city) {
      throw new NotFoundException('City not found');
    }
    return city;
  }

  async updateCity(id: string, data: UpdateWebsiteCityDto) {
    const updateData: any = { ...data };
    if (data.country) {
      await this.findOneCountry(data.country);
      updateData.country = new Types.ObjectId(data.country);
    }
    const city = await this.cityModel
      .findOneAndUpdate(
        { _id: new Types.ObjectId(id), is_deleted: { $ne: true } },
        { $set: updateData },
        { new: true },
      )
      .populate('country')
      .lean();
    if (!city) {
      throw new NotFoundException('City not found');
    }
    return city;
  }

  async deleteCity(id: string) {
    const city = await this.cityModel
      .findOneAndUpdate(
        { _id: new Types.ObjectId(id), is_deleted: { $ne: true } },
        { $set: { is_deleted: true } },
        { new: true },
      )
      .populate('country')
      .lean();
    if (!city) {
      throw new NotFoundException('City not found');
    }
    return city;
  }

  async createHotel(data: CreateWebsiteHotelDto) {
    await this.findOneCity(data.city);
    const hotel = new this.hotelModel({
      ...data,
      city: new Types.ObjectId(data.city),
    });
    const savedHotel = await hotel.save();
    return this.hotelModel
      .findById(savedHotel._id)
      .populate({ path: 'city', populate: { path: 'country' } })
      .lean();
  }

  async findAllHotels(cityId?: string) {
    const query: any = { is_deleted: { $ne: true } };
    if (cityId) {
      query.city = new Types.ObjectId(cityId);
    }
    return this.hotelModel
      .find(query)
      .populate({ path: 'city', populate: { path: 'country' } })
      .sort({ name_sq: 1 })
      .lean();
  }

  async findOneHotel(id: string) {
    const hotel = await this.hotelModel
      .findOne({
        _id: new Types.ObjectId(id),
        is_deleted: { $ne: true },
      })
      .populate({ path: 'city', populate: { path: 'country' } })
      .lean();
    if (!hotel) {
      throw new NotFoundException('Hotel not found');
    }
    return hotel;
  }

  async updateHotel(id: string, data: UpdateWebsiteHotelDto) {
    const updateData: any = { ...data };
    if (data.city) {
      await this.findOneCity(data.city);
      updateData.city = new Types.ObjectId(data.city);
    }
    const hotel = await this.hotelModel
      .findOneAndUpdate(
        { _id: new Types.ObjectId(id), is_deleted: { $ne: true } },
        { $set: updateData },
        { new: true },
      )
      .populate({ path: 'city', populate: { path: 'country' } })
      .lean();
    if (!hotel) {
      throw new NotFoundException('Hotel not found');
    }
    return hotel;
  }

  async deleteHotel(id: string) {
    const hotel = await this.hotelModel
      .findOneAndUpdate(
        { _id: new Types.ObjectId(id), is_deleted: { $ne: true } },
        { $set: { is_deleted: true } },
        { new: true },
      )
      .populate({ path: 'city', populate: { path: 'country' } })
      .lean();
    if (!hotel) {
      throw new NotFoundException('Hotel not found');
    }
    return hotel;
  }

  async seedData() {
    const countriesToSeed = [
      { name_sq: 'Francë', name_mk: 'Франција' },
      { name_sq: 'Itali', name_mk: 'Италија' },
      { name_sq: 'Spanjë', name_mk: 'Шпанија' },
      { name_sq: 'Greqi', name_mk: 'Грција' },
      { name_sq: 'Gjermani', name_mk: 'Германија' },
      { name_sq: 'Zvicër', name_mk: 'Швајцарија' },
    ];

    const seededCountries = [];
    for (const c of countriesToSeed) {
      let country = await this.countryModel.findOne({
        name_sq: c.name_sq,
        is_deleted: { $ne: true },
      });
      if (!country) {
        country = new this.countryModel(c);
        await country.save();
      }
      seededCountries.push(country);
    }

    const citiesToSeed = [
      { name_sq: 'Paris', name_mk: 'Париз', countryNameSq: 'Francë' },
      { name_sq: 'Romë', name_mk: 'Рим', countryNameSq: 'Itali' },
      { name_sq: 'Venecia', name_mk: 'Венеција', countryNameSq: 'Itali' },
      { name_sq: 'Barcelonë', name_mk: 'Барселона', countryNameSq: 'Spanjë' },
      { name_sq: 'Madrid', name_mk: 'Мадрид', countryNameSq: 'Spanjë' },
      { name_sq: 'Athinë', name_mk: 'Атина', countryNameSq: 'Greqi' },
      { name_sq: 'Santorini', name_mk: 'Санторини', countryNameSq: 'Greqi' },
      { name_sq: 'Berlin', name_mk: 'Берлин', countryNameSq: 'Gjermani' },
      { name_sq: 'Mynih', name_mk: 'Минхен', countryNameSq: 'Gjermani' },
      { name_sq: 'Zurihi', name_mk: 'Цирих', countryNameSq: 'Zvicër' },
    ];

    const seededCities = [];
    for (const cityData of citiesToSeed) {
      const countryObj = seededCountries.find(
        (c) => c.name_sq === cityData.countryNameSq,
      );
      if (!countryObj) {
        continue;
      }

      let city = await this.cityModel.findOne({
        name_sq: cityData.name_sq,
        country: countryObj._id,
        is_deleted: { $ne: true },
      });
      if (!city) {
        city = new this.cityModel({
          name_sq: cityData.name_sq,
          name_mk: cityData.name_mk,
          country: countryObj._id,
        });
        await city.save();
      }
      seededCities.push(city);
    }

    const targetImages = [
      'https://pix10.agoda.net/hotelImages/124/1246280/1246280_16061017110043391702.jpg?ca=6&ce=1&s=414x232',
      'https://dynamic-media-cdn.tripadvisor.com/media/photo-o/30/b0/1b/8e/caption.jpg?w=1200&h=-1&s=1',
      'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRBKCKrz5yKmFJCosglRJoG0AKMQBo_Up0l6Q&s',
      'https://media-cdn.tripadvisor.com/media/photo-s/16/1a/ea/54/hotel-presidente-4s.jpg',
    ];

    const hotelsToSeed = [
      {
        name_sq: 'The Ritz Paris',
        name_mk: 'Ритц Париз',
        cityNameSq: 'Paris',
        location_sq: '15 Place Vendôme, 75001 Paris',
        location_mk: '15 Плејс Вандом, 75001 Париз',
        location_maps_link: 'https://maps.app.goo.gl/RitzParisLink',
        images: targetImages,
        description_sq:
          'Një hotel legjendar luksoz në zemër të Parisit, duke ofruar shërbim të klasit botëror dhe sharm historik.',
        description_mk:
          'Легендарен луксузен хотел во срцето на Париз, кој нуди услуга од светска класа и историски шарм.',
        extra_info_sq: 'Ideale për qëndrime romantike. Mëngjesi i përfshirë.',
        extra_info_mk: 'Идеално за романтични престои. Вклучен појадок.',
        offer_start_date: new Date('2026-06-01'),
        offer_end_date: new Date('2026-09-30'),
        has_wifi: true,
        has_parking: true,
        has_breakfast: true,
        has_pool: true,
        has_ac: true,
        has_spa: true,
        has_gym: true,
        has_pet_friendly: true,
        has_restaurant: true,
        has_bar: true,
      },
      {
        name_sq: 'Hotel Artemide Rome',
        name_mk: 'Хотел Артемида Рим',
        cityNameSq: 'Romë',
        location_sq: 'Via Nazionale, 22, 00184 Roma RM',
        location_mk: 'Виа Национале, 22, 00184 Рим РМ',
        location_maps_link: 'https://maps.app.goo.gl/ArtemideRomeLink',
        images: targetImages,
        description_sq:
          'Një hotel me vlerësim të lartë që ofron dhoma komode dhe një bar në çati me pamje nga Roma.',
        description_mk:
          'Високо оценет хотел кој нуди удобни соби и бар на покривот со поглед на Рим.',
        extra_info_sq: 'Minibar falas i mbushur çdo ditë.',
        extra_info_mk: 'Бесплатен минибар кој се полни секојдневно.',
        offer_start_date: new Date('2026-06-15'),
        offer_end_date: new Date('2026-08-31'),
        has_wifi: true,
        has_parking: false,
        has_breakfast: true,
        has_pool: false,
        has_ac: true,
        has_spa: true,
        has_gym: true,
        has_pet_friendly: false,
        has_restaurant: true,
        has_bar: true,
      },
      {
        name_sq: 'W Barcelona',
        name_mk: 'В Барселона',
        cityNameSq: 'Barcelonë',
        location_sq: 'Plaça Rosa Del Vents 1, Ciutat Vella, 08039 Barcelona',
        location_mk: 'Плаца Роса Дел Вентс 1, Сиутат Вела, 08039 Барселона',
        location_maps_link: 'https://maps.app.goo.gl/WBarcLink',
        images: targetImages,
        description_sq:
          'Duke u ngritur si një velë në plazhin e Barcelonës, W Barcelona është një pikë referimi e luksit.',
        description_mk:
          'Издигнувајќи се како едро на плажата во Барселона, W Барселона е обележје на луксузот.',
        extra_info_sq: 'Pishinë në çati dhe pamje nga plazhi.',
        extra_info_mk: 'Базен на покривот и поглед на плажата.',
        offer_start_date: new Date('2026-07-01'),
        offer_end_date: new Date('2026-08-31'),
        has_wifi: true,
        has_parking: true,
        has_breakfast: true,
        has_pool: true,
        has_ac: true,
        has_spa: true,
        has_gym: true,
        has_pet_friendly: true,
        has_restaurant: true,
        has_bar: true,
      },
      {
        name_sq: 'Grace Hotel Santorini',
        name_mk: 'Грејс Хотел Санторини',
        cityNameSq: 'Santorini',
        location_sq: 'Imerovigli, Santorini 84700',
        location_mk: 'Имеровигли, Санторини 84700',
        location_maps_link: 'https://maps.app.goo.gl/GraceSantoriniLink',
        images: targetImages,
        description_sq:
          'Një hotel ekskluziv butik i gdhendur në shkëmb, që ofron pamje të perëndimit të diellit mbi Kalderë.',
        description_mk:
          'Ексклузивен бутик хотел издлабен во карпата, кој нуди поглед на зајдисонцето над Калдерата.',
        extra_info_sq: 'Pishinë infiniti dhe ngrënie e shkëlqyer.',
        extra_info_mk: 'Инфинити базен и врвно јадење.',
        offer_start_date: new Date('2026-05-01'),
        offer_end_date: new Date('2026-10-31'),
        has_wifi: true,
        has_parking: false,
        has_breakfast: true,
        has_pool: true,
        has_ac: true,
        has_spa: true,
        has_gym: true,
        has_pet_friendly: false,
        has_restaurant: true,
        has_bar: true,
      },
    ];

    const seededHotels = [];
    for (const hotelData of hotelsToSeed) {
      const cityObj = seededCities.find(
        (c) => c.name_sq === hotelData.cityNameSq,
      );
      if (!cityObj) {
        continue;
      }

      let hotel = await this.hotelModel.findOne({
        name_sq: hotelData.name_sq,
        city: cityObj._id,
        is_deleted: { $ne: true },
      });
      if (!hotel) {
        hotel = new this.hotelModel({
          ...hotelData,
          city: cityObj._id,
        });
        await hotel.save();
      } else {
        hotel.images = hotelData.images;
        await hotel.save();
      }
      seededHotels.push(hotel);
    }

    return {
      message: 'Seed completed successfully',
      countries: seededCountries.length,
      cities: seededCities.length,
      hotels: seededHotels.length,
    };
  }
}
