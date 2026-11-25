import imageSizes from './image-sizes.json';

export const order = ['wedding', 'birthday', 'anniversary', 'jubilee'];
export const $ = (selector, root = document) => root.querySelector(selector);
export const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
export const media = (path) => `${import.meta.env.BASE_URL}media/${path.replace(/^assets\//, '')}`;
export const esc = (s = '') => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const image = (path, alt = '', extra = '') => {
  const dimensions = imageSizes[path.replace(/^assets\//, '')];
  if (!dimensions) return `<img src="${media(path)}" alt="${esc(alt)}" decoding="async" ${extra}>`;
  const source = dimensions.variants.find(variant => variant.width >= 960) || dimensions.variants.at(-1);
  const srcset = dimensions.variants.map(variant => `${media(variant.path)} ${variant.width}w`).join(', ');
  const sizes = /(?:^|\s)sizes\s*=/i.test(extra) ? '' : ' sizes="(max-width: 767px) calc(100vw - 40px), 760px"';
  const width = /(?:^|\s)width\s*=/i.test(extra) ? '' : ` width="${dimensions.width}"`;
  const height = /(?:^|\s)height\s*=/i.test(extra) ? '' : ` height="${dimensions.height}"`;
  return `<img src="${media(source.path)}" srcset="${srcset}" alt="${esc(alt)}" decoding="async"${sizes}${width}${height} ${extra}>`;
};
