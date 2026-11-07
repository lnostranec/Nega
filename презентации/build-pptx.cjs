const PptxGenJS = require("pptxgenjs");
const path = require("path");

const pptx = new PptxGenJS();
pptx.defineLayout({ name: "WIDE", width: 13.333, height: 7.5 });
pptx.layout = "WIDE";
pptx.title = "1 сентября — День знаний";
pptx.author = "Тестовая презентация";
pptx.subject = "День знаний";

const dir = __dirname;
const titleBg = path.join(dir, "assets", "title-bg.png");
const stillLife = path.join(dir, "assets", "still-life.png");
const finale = path.join(dir, "assets", "finale.png");

const C = {
  cream: "F6EFE4",
  ink: "2A1C18",
  burgundy: "7A2E3E",
  gold: "C4A35A",
  muted: "6B5348",
  white: "F6EFE4",
};

const titleFont = "Times New Roman";
const bodyFont = "Calibri";

function kicker(slide, text, x, y, color) {
  slide.addText(text.toUpperCase(), {
    x,
    y,
    w: 10,
    h: 0.35,
    fontFace: bodyFont,
    fontSize: 12,
    color: color || C.gold,
    charSpacing: 6,
    margin: 0,
  });
}

function goldLine(slide, x, y) {
  slide.addShape(pptx.shapes.RECTANGLE, {
    x,
    y,
    w: 0.9,
    h: 0.03,
    fill: { color: C.gold },
    line: { color: C.gold },
  });
}

// 1. Title
{
  const s = pptx.addSlide();
  s.addImage({ path: titleBg, x: 0, y: 0, w: 13.333, h: 7.5 });
  s.addShape(pptx.shapes.RECTANGLE, {
    x: 0,
    y: 0,
    w: 13.333,
    h: 7.5,
    fill: { color: "1A0E10", transparency: 42 },
  });
  kicker(s, "Школьная линейка", 0.9, 1.85, "E4C57A");
  s.addText("1 сентября", {
    x: 0.9,
    y: 2.25,
    w: 10,
    h: 1.35,
    fontFace: titleFont,
    fontSize: 60,
    color: C.white,
    margin: 0,
  });
  goldLine(s, 0.9, 3.75);
  s.addText("День знаний. Тестовая презентация,\nчтобы посмотреть оформление и ритм слайдов.", {
    x: 0.9,
    y: 4.05,
    w: 8,
    h: 1.1,
    fontFace: bodyFont,
    fontSize: 18,
    color: "EADCC8",
    margin: 0,
  });
  s.addText("УЧЕБНЫЙ ГОД 2026 / 2027", {
    x: 0.9,
    y: 6.7,
    w: 6,
    h: 0.3,
    fontFace: bodyFont,
    fontSize: 11,
    color: "EADCC8",
    charSpacing: 2,
    margin: 0,
  });
}

// 2. Greeting
{
  const s = pptx.addSlide();
  s.addShape(pptx.shapes.RECTANGLE, {
    x: 0, y: 0, w: 13.333, h: 7.5,
    fill: { color: C.cream },
  });
  kicker(s, "Поздравление", 0.9, 1.35);
  s.addText("С новым учебным годом!", {
    x: 0.9, y: 1.8, w: 11, h: 1.05,
    fontFace: titleFont, fontSize: 40, color: C.ink, margin: 0,
  });
  goldLine(s, 0.9, 3.0);
  s.addText("Пусть этот год будет щедрым на открытия, добрых друзей и тихие победы. Сегодня звонок звучит не как конец лета — а как начало большой и красивой дороги.", {
    x: 0.9, y: 3.3, w: 10.5, h: 1.35,
    fontFace: bodyFont, fontSize: 18, color: C.muted, margin: 0,
  });
  s.addText("«Ученье — свет, а неученье — тьма.»", {
    x: 0.9, y: 5.0, w: 10, h: 0.6,
    fontFace: titleFont, fontSize: 22, italic: true, color: C.burgundy, margin: 0,
  });
}

// 3. First bell
{
  const s = pptx.addSlide();
  s.addShape(pptx.shapes.RECTANGLE, {
    x: 0, y: 0, w: 13.333, h: 7.5,
    fill: { color: C.cream },
  });
  s.addImage({ path: stillLife, x: 7.15, y: 0.55, w: 5.55, h: 6.4 });
  kicker(s, "Традиция", 0.75, 1.2);
  s.addText("Первый звонок", {
    x: 0.75, y: 1.65, w: 6.1, h: 0.85,
    fontFace: titleFont, fontSize: 36, color: C.ink, margin: 0,
  });
  goldLine(s, 0.75, 2.65);
  s.addText([
    { text: "Линейка во дворе школы", options: { breakLine: true } },
    { text: "Букеты учителям и первый класс впереди", options: { breakLine: true } },
    { text: "Гимн знаний — короткий, торжественный, общий", options: { breakLine: true } },
    { text: "После праздника — первый урок", options: { breakLine: true } },
  ], {
    x: 0.75, y: 3.0, w: 6.1, h: 3.2,
    fontFace: bodyFont, fontSize: 18, color: C.ink,
    paraSpaceAfter: 10,
    bullet: { code: "25CF", color: C.gold },
  });
}

// 4. Students
{
  const s = pptx.addSlide();
  s.addShape(pptx.shapes.RECTANGLE, {
    x: 0, y: 0, w: 13.333, h: 7.5,
    fill: { color: C.cream },
  });
  kicker(s, "Ученикам", 0.9, 1.2);
  s.addText("Дорогие ребята", {
    x: 0.9, y: 1.65, w: 11, h: 0.85,
    fontFace: titleFont, fontSize: 40, color: C.ink, margin: 0,
  });
  goldLine(s, 0.9, 2.65);
  s.addText([
    { text: "Не бойтесь спрашивать — вопрос уже половина ответа", options: { breakLine: true } },
    { text: "Помогайте одноклассникам: вместе учиться легче", options: { breakLine: true } },
    { text: "Берегите любопытство — оно важнее идеальных оценок", options: { breakLine: true } },
    { text: "Этот год принадлежит вам. Сделайте его своим", options: { breakLine: true } },
  ], {
    x: 0.9, y: 3.0, w: 11, h: 3.2,
    fontFace: bodyFont, fontSize: 20, color: C.ink,
    paraSpaceAfter: 12,
    bullet: { code: "25CF", color: C.gold },
  });
}

// 5. Teachers
{
  const s = pptx.addSlide();
  s.addShape(pptx.shapes.RECTANGLE, {
    x: 0, y: 0, w: 13.333, h: 7.5,
    fill: { color: C.cream },
  });
  kicker(s, "Учителям", 0.9, 1.45);
  s.addText("Спасибо тем,\nкто открывает двери", {
    x: 0.9, y: 1.9, w: 11.5, h: 1.7,
    fontFace: titleFont, fontSize: 40, color: C.ink, margin: 0,
  });
  goldLine(s, 0.9, 3.8);
  s.addText("За терпение, за строгий взгляд и тёплое слово. За то, что каждый сентябрь снова верите: в этом классе обязательно случится что-то настоящее.", {
    x: 0.9, y: 4.15, w: 10.8, h: 1.6,
    fontFace: bodyFont, fontSize: 20, color: C.muted, margin: 0,
  });
}

// 6. Parents
{
  const s = pptx.addSlide();
  s.addShape(pptx.shapes.RECTANGLE, {
    x: 0, y: 0, w: 13.333, h: 7.5,
    fill: { color: C.cream },
  });
  kicker(s, "Родителям", 0.9, 1.2);
  s.addText("Рядом — и этого достаточно", {
    x: 0.9, y: 1.65, w: 11.5, h: 0.9,
    fontFace: titleFont, fontSize: 36, color: C.ink, margin: 0,
  });
  goldLine(s, 0.9, 2.7);
  s.addText([
    { text: "Соберите портфель без суеты: дети чувствуют спокойствие", options: { breakLine: true } },
    { text: "Спросите вечером не «какая оценка», а «что было интересного»", options: { breakLine: true } },
    { text: "Школа — общий путь. Учителя, дети и вы — одна команда", options: { breakLine: true } },
  ], {
    x: 0.9, y: 3.1, w: 11.2, h: 2.8,
    fontFace: bodyFont, fontSize: 20, color: C.ink,
    paraSpaceAfter: 14,
    bullet: { code: "25CF", color: C.gold },
  });
}

// 7. Year ahead
{
  const s = pptx.addSlide();
  s.addShape(pptx.shapes.RECTANGLE, {
    x: 0, y: 0, w: 13.333, h: 7.5,
    fill: { color: C.cream },
  });
  kicker(s, "Год впереди", 0.9, 0.7);
  s.addText("Что нас ждёт", {
    x: 0.9, y: 1.1, w: 11, h: 0.75,
    fontFace: titleFont, fontSize: 36, color: C.ink, margin: 0,
  });

  const cards = [
    ["Знания", "Новые предметы, проекты и первые самостоятельные открытия."],
    ["Дружба", "Класс, в котором можно быть собой и рассчитывать на поддержку."],
    ["Праздники", "Концерты, олимпиады, поездки и дни, которые запоминаются."],
    ["Рост", "Чуть больше ответственности — и гораздо больше уверенности."],
  ];
  cards.forEach((card, idx) => {
    const col = idx % 2;
    const row = Math.floor(idx / 2);
    const x = 0.9 + col * 5.85;
    const y = 2.2 + row * 2.4;
    s.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
      x, y, w: 5.5, h: 2.15,
      fill: { color: "FFFAF3" },
      line: { color: "E2D2A8", width: 1 },
      rectRadius: 0.06,
    });
    s.addText(card[0], {
      x: x + 0.3, y: y + 0.3, w: 4.9, h: 0.55,
      fontFace: titleFont, fontSize: 24, color: C.burgundy, margin: 0,
    });
    s.addText(card[1], {
      x: x + 0.3, y: y + 0.9, w: 4.9, h: 0.9,
      fontFace: bodyFont, fontSize: 15, color: C.muted, margin: 0,
    });
  });
}

// 8. Finale
{
  const s = pptx.addSlide();
  s.addImage({ path: finale, x: 0, y: 0, w: 13.333, h: 7.5 });
  s.addShape(pptx.shapes.RECTANGLE, {
    x: 0, y: 0, w: 13.333, h: 7.5,
    fill: { color: "1A0E10", transparency: 40 },
  });
  kicker(s, "В добрый путь", 1.5, 2.05, "E4C57A");
  s.addText("Пусть звенит\nпервый звонок", {
    x: 1.5, y: 2.45, w: 10.3, h: 2.0,
    fontFace: titleFont, fontSize: 44, color: C.white, align: "center", margin: 0,
  });
  s.addShape(pptx.shapes.RECTANGLE, {
    x: 6.2, y: 4.6, w: 0.9, h: 0.03,
    fill: { color: C.gold },
    line: { color: C.gold },
  });
  s.addText("Удачи в новом учебном году. До встречи на уроках.", {
    x: 1.5, y: 4.9, w: 10.3, h: 0.55,
    fontFace: bodyFont, fontSize: 18, color: "EADCC8", align: "center", margin: 0,
  });
}

const out = path.join(dir, "1-сентября.pptx");
pptx.writeFile({ fileName: out }).then(() => {
  console.log("Wrote", out);
});
