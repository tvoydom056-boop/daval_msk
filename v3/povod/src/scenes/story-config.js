import { OCCASIONS, V2 } from '../data.js';

export const weddingScenes = [
  { id: 'before', year: '2017', label: 'До встречи', media: 'before-him', second: 'before-her', transition: 'diagonal', bg: '#23313f', accent: '#f2c14e', ink: '#fff4dc', position: 'bottom-center', mobile: 'bottom', text: '2017. Он - в Питере, она - в Казани. Они ещё не знают друг о друге.' },
  { id: 'meet', year: '2019', label: 'Как всё началось', media: 'story-meet', video: 'story-meet', transition: 'polaroid', bg: '#3a2418', accent: '#e8a35a', ink: '#fff0df', position: 'bottom-right', mobile: 'top', text: '2019. Кофейня на Покровке. Он опоздал на 20 минут.' },
  { id: 'rain', year: '2019', label: 'Ещё немного погуляем?', media: 'date-rain', transition: 'rain', bg: '#10202a', accent: '#d64d8a', ink: '#ffe8f2', position: 'middle-left', mobile: 'bottom', text: 'Дождь, один зонт на двоих и три часа разговоров.' },
  { id: 'summer', year: '2020', label: 'Лето пахнет клубникой', media: 'summer', transition: 'flash', bg: '#f6e7b0', accent: '#7cb342', ink: '#253121', position: 'top-right', mobile: 'top', text: 'Первое лето: велосипеды, клубника и её веснушки.' },
  { id: 'trip', year: '2021', label: 'Два билета, пожалуйста', media: 'story-trip', video: 'story-trip', transition: 'ticket', bg: '#ffd2bf', accent: '#ff7a59', ink: '#3d2522', position: 'bottom-left', mobile: 'bottom', text: 'Первое море вдвоём. Она боялась высоты, он держал за руку.' },
  { id: 'quarrel', year: '2021', label: 'Любовь - это и так тоже', media: 'quarrel', transition: 'sunrise', bg: '#5d6b78', warm: '#e9c46a', accent: '#e9c46a', ink: '#fff7e7', position: 'bottom-center', mobile: 'bottom-high', text: 'Первая ссора из-за ерунды. Помирились к утру.' },
  { id: 'home', year: '2022', label: 'Наши квадратные метры', media: 'home', transition: 'keyhole', bg: '#e9eee3', accent: '#6b8f71', ink: '#273a2c', position: 'middle-right', mobile: 'top', text: 'Первая квартира: два стула, матрас и счастье.' },
  { id: 'puppy', year: '2023', label: 'Главная в этом доме', media: 'puppy', second: 'story-today', video: 'story-today', transition: 'paws', bg: '#f3d9b1', accent: '#c97b3c', ink: '#46301f', position: 'top-left', mobile: 'bottom', text: 'Появилась Булка. Теперь их трое.' },
  { id: 'proposal', year: '2024', label: 'Тот самый вопрос', media: 'story-proposal', video: 'story-proposal', transition: 'blackout', bg: '#1b1636', accent: '#f5c76a', ink: '#fff0d8', position: 'bottom-right', mobile: 'bottom', text: 'Крыша, ноябрь, плюс два. Она сказала «да» раньше, чем он договорил.' },
  { id: 'wedding', year: '2025', label: 'И это только начало', media: 'slide-wedding', video: 'slide-wedding', transition: 'petals', bg: '#f7d6cc', accent: '#e8743b', ink: '#402728', position: 'middle-left', mobile: 'top', text: 'Сегодня - их свадьба. А этот сайт гости откроют прямо за столом.' },
];

const palettes = {
  birthday: [ ['#382b49','#ffba79','#fff0dc'], ['#d8bf98','#98532f','#3a2821'], ['#253c34','#e6b958','#fff3db'], ['#34445f','#f39f8a','#fff0e4'], ['#f6d6bd','#d65d3e','#462b30'] ],
  anniversary: [ ['#e8d6c6','#995e57','#46322e'], ['#d8e6eb','#6b8ca8','#2b3b4a'], ['#ead8b5','#a26f3a','#4b3528'], ['#425549','#c2d5a5','#fff3dd'], ['#f1d4c2','#b76a52','#482c2c'] ],
  jubilee: [ ['#e8d4b6','#ad7e3c','#49382c'], ['#70554b','#e5bd7d','#fff3d9'], ['#cbd4ad','#697346','#36402d'], ['#a25e4c','#edc78c','#fff2da'], ['#f1dfc5','#ad7549','#4b3227'] ],
};

export function getStoryScenes(key) {
  if (key === 'wedding') return weddingScenes;
  const o = OCCASIONS[key], chapters = o.gift.sections.find(s => s.type === 'chapters').items;
  const rows = [{ id: `${key}-cover`, year: '2026', label: o.demoTitle, text: o.gift.cover.sub, image: o.gift.cover.img }, ...chapters.map((c, i) => ({ id: `${key}-${i}`, year: c.y, label: c.h, text: c.p, image: `assets/img/${V2[key].images[i]}.jpg` }))];
  return rows.map((row, i) => ({ ...row, bg: palettes[key][i][0], accent: palettes[key][i][1], ink: palettes[key][i][2], transition: ['aperture','polaroid','flash','curtain','page'][i], position: ['bottom-center','bottom-right','top-right','middle-left','bottom-left'][i], mobile: i % 2 ? 'top' : 'bottom' }));
}

export function captionLines(text, mobile = false) {
  const result = []; let line = '';
  for (const word of text.split(' ')) {
    if ((line + ' ' + word).length > (mobile ? 22 : 34) && line) { result.push(line); line = word; }
    else line += (line ? ' ' : '') + word;
  }
  if (line) result.push(line);
  return result;
}
