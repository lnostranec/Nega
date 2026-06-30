export type CdekCity = {
  code: number;
  name: string;
  region: string;
};

export type CdekPvz = {
  code: string;
  name: string;
  address: string;
  workTime: string;
  cityCode: number;
};

export const CDEK_CITIES: CdekCity[] = [
  { code: 44, name: "Москва", region: "Московская область" },
  { code: 137, name: "Санкт-Петербург", region: "Ленинградская область" },
  { code: 270, name: "Новосибирск", region: "Новосибирская область" },
  { code: 438, name: "Екатеринбург", region: "Сверdловская область" },
  { code: 344, name: "Казань", region: "Республика Татарстан" },
  { code: 152, name: "Краснодар", region: "Краснодарский край" },
  { code: 491, name: "Нижний Новгород", region: "Нижегородская область" },
  { code: 430, name: "Самара", region: "Самарская область" },
  { code: 250, name: "Ростов-на-Дону", region: "Ростовская область" },
  { code: 288, name: "Уфа", region: "Республика Башкортостан" },
];

export const CDEK_PVZ: CdekPvz[] = [
  {
    code: "MSK1",
    name: "ПВЗ на Тверской",
    address: "ул. Тверская, 12",
    workTime: "Пн–Вс 10:00–21:00",
    cityCode: 44,
  },
  {
    code: "MSK2",
    name: "ПВЗ на Арбате",
    address: "ул. Арбат, 24",
    workTime: "Пн–Вс 10:00–22:00",
    cityCode: 44,
  },
  {
    code: "MSK3",
    name: "ПВЗ на Кутузовском",
    address: "Кутузовский проспект, 36",
    workTime: "Пн–Сб 10:00–20:00",
    cityCode: 44,
  },
  {
    code: "SPB1",
    name: "ПВЗ на Невском",
    address: "Невский проспект, 58",
    workTime: "Пн–Вс 10:00–21:00",
    cityCode: 137,
  },
  {
    code: "SPB2",
    name: "ПВЗ на Лиговском",
    address: "Лиговский проспект, 30",
    workTime: "Пн–Вс 10:00–21:00",
    cityCode: 137,
  },
  {
    code: "NSK1",
    name: "ПВЗ на Красном",
    address: "ул. Красный проспект, 5",
    workTime: "Пн–Сб 10:00–20:00",
    cityCode: 270,
  },
  {
    code: "EKB1",
    name: "ПВЗ на Малышева",
    address: "ул. Малышева, 36",
    workTime: "Пн–Вс 10:00–21:00",
    cityCode: 438,
  },
  {
    code: "KZN1",
    name: "ПВЗ на Баумана",
    address: "ул. Баумана, 58",
    workTime: "Пн–Вс 10:00–21:00",
    cityCode: 344,
  },
];
