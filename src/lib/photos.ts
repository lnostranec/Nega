/** Тестовые фото из /public/NegraPhoto — позже заменим на боевые */
const base = "/NegraPhoto";

export const NEGRA_PHOTOS = {
  hero: {
    1: `${base}/Hero1.jpg`,
    2: `${base}/Hero2.jpg`,
    3: `${base}/Hero3.jpg`,
    4: `${base}/Hero4.jpg`,
  },
  card: {
    1: `${base}/Card1.jpg`,
    2: `${base}/Card2.jpg`,
    3: `${base}/Card3.jpg`,
    4: `${base}/Card4.jpg`,
    12: `${base}/Card12.jpg`,
    13: `${base}/Card13.jpg`,
    14: `${base}/Card14.jpg`,
    15: `${base}/Card15.jpg`,
  },
  category: {
    sets: `${base}/Complect.jpg`,
    bras: `${base}/Bustgalter.jpg`,
    panties: `${base}/Trysiki.jpg`,
    accessories: `${base}/Acsessuar.jpg`,
  },
} as const;

export const LEO_SET_GALLERY = [
  NEGRA_PHOTOS.card[1],
  NEGRA_PHOTOS.card[2],
  NEGRA_PHOTOS.card[3],
  NEGRA_PHOTOS.card[4],
] as const;

export const BRUNA_SET_GALLERY = [
  NEGRA_PHOTOS.card[12],
  NEGRA_PHOTOS.card[13],
  NEGRA_PHOTOS.card[14],
  NEGRA_PHOTOS.card[15],
] as const;
