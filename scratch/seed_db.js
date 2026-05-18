const mongoose = require('mongoose');

const uri = 'mongodb+srv://burimhod_db_user:tLrAkDi2F5JH48ud@agim-tours-cluster-0.cfnbout.mongodb.net/?appName=agim-tours-cluster-0';

const WebsiteCountrySchema = new mongoose.Schema(
  {
    name_sq: { type: String, required: true },
    name_mk: { type: String, required: true },
    is_active: { type: Boolean, default: true },
    is_deleted: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  },
);

const WebsiteCitySchema = new mongoose.Schema(
  {
    name_sq: { type: String, required: true },
    name_mk: { type: String, required: true },
    country: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'WebsiteCountry',
      required: true,
    },
    is_active: { type: Boolean, default: true },
    is_deleted: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  },
);

const WebsiteHotelSchema = new mongoose.Schema(
  {
    name_sq: { type: String, required: true },
    name_mk: { type: String, required: true },
    city: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'WebsiteCity',
      required: true,
    },
    location_sq: { type: String, required: true },
    location_mk: { type: String, required: true },
    location_maps_link: { type: String, required: true },
    images: { type: [String], default: [] },
    description_sq: { type: String },
    description_mk: { type: String },
    extra_info_sq: { type: String },
    extra_info_mk: { type: String },
    offer_start_date: { type: Date },
    offer_end_date: { type: Date },
    has_wifi: { type: Boolean, default: false },
    has_parking: { type: Boolean, default: false },
    has_breakfast: { type: Boolean, default: false },
    has_pool: { type: Boolean, default: false },
    has_ac: { type: Boolean, default: false },
    has_spa: { type: Boolean, default: false },
    has_gym: { type: Boolean, default: false },
    has_pet_friendly: { type: Boolean, default: false },
    has_restaurant: { type: Boolean, default: false },
    has_bar: { type: Boolean, default: false },
    is_active: { type: Boolean, default: true },
    is_deleted: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  },
);

const Country = mongoose.model(
  'WebsiteCountry',
  WebsiteCountrySchema,
  'websitecountries',
);
const City = mongoose.model('WebsiteCity', WebsiteCitySchema, 'websitecities');
const Hotel = mongoose.model(
  'WebsiteHotel',
  WebsiteHotelSchema,
  'websitehotels',
);

async function seed() {
  await mongoose.connect(uri);

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
    let country = await Country.findOne({
      name_sq: c.name_sq,
      is_deleted: { $ne: true },
    });
    if (!country) {
      country = new Country(c);
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

    let city = await City.findOne({
      name_sq: cityData.name_sq,
      country: countryObj._id,
      is_deleted: { $ne: true },
    });
    if (!city) {
      city = new City({
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
    const cityObj = seededCities.find((c) => c.name_sq === hotelData.cityNameSq);
    if (!cityObj) {
      continue;
    }

    let hotel = await Hotel.findOne({
      name_sq: hotelData.name_sq,
      city: cityObj._id,
      is_deleted: { $ne: true },
    });
    if (!hotel) {
      hotel = new Hotel({
        ...hotelData,
        city: cityObj._id,
      });
      await hotel.save();
    } else {
      hotel.name_mk = hotelData.name_mk;
      hotel.location_sq = hotelData.location_sq;
      hotel.location_mk = hotelData.location_mk;
      hotel.description_sq = hotelData.description_sq;
      hotel.description_mk = hotelData.description_mk;
      hotel.extra_info_sq = hotelData.extra_info_sq;
      hotel.extra_info_mk = hotelData.extra_info_mk;
      hotel.images = hotelData.images;
      await hotel.save();
    }
    seededHotels.push(hotel);
  }

  console.log('Seeded countries:', seededCountries.length);
  console.log('Seeded cities:', seededCities.length);
  console.log('Seeded hotels:', seededHotels.length);
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
