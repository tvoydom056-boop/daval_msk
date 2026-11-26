/* Runs in the head, before the incoming document's first rendering opportunity. */
(() => {
  if (!('onpageswap' in window) || !CSS.supports('view-transition-name', 'example-page')) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const formats = ['page', 'life', 'family', 'maria', 'sergey'];
  const format = url => { const match = new URL(url, location.href).pathname.match(/\/examples\/(page|life|family|maria|sergey)\.html$/); return match?.[1]; };
  const destination = id => document.querySelector({page:'.memory-cover-image',life:'#petr .field',family:'.family-album',maria:'#maria .chalkboard',sergey:'#sergey .scene-background'}[id]);
  const clear = () => document.querySelectorAll('[data-flight]').forEach(el => {el.style.removeProperty('view-transition-name'); delete el.dataset.flight;});
  const name = (el, id) => {if (el && formats.includes(id)) {el.dataset.flight=id; el.style.viewTransitionName='example-'+id;}};
  const sourceCard = id => {
    const links=[...document.querySelectorAll('a[href]')].filter(a=>a.querySelector('img')&&format(a.href)===id);
    let index=0;try {index=Number(sessionStorage.getItem('letopis-flight-'+id)||0);} catch {}
    const link=links[index],rect=link?.getBoundingClientRect();
    return rect&&rect.bottom>0&&rect.top<innerHeight?link.querySelector('img'):null;
  };
  let clicked;
  document.addEventListener('click', event => {
    if (event.button || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.defaultPrevented) return;
    const link=event.target.closest('a[href]');
    if (!link || link.target || link.download) return;
    const url=new URL(link.href),id=format(url);
    if (url.origin===location.origin && id && link.querySelector('img')) clicked={link,id};
  });
  addEventListener('pageswap', event => {
    clear();
    if (!event.viewTransition || reduced.matches) {event.viewTransition?.skipTransition();return;}
    const url=event.activation?.entry?.url;
    if (clicked && url && new URL(clicked.link.href).href===new URL(url).href) {
      const links=[...document.querySelectorAll('a[href]')].filter(a=>format(a.href)===clicked.id&&a.querySelector('img'));
      try {sessionStorage.setItem('letopis-flight-'+clicked.id,String(links.indexOf(clicked.link)));} catch {}
      name(clicked.link.querySelector('img'),clicked.id);
    } else if (format(location.href)) name(destination(format(location.href)),format(location.href));
    else if(url&&format(url)) name(sourceCard(format(url)),format(url));
    event.viewTransition.finished.finally(clear);
  });
  addEventListener('pagereveal', event => {
    clear();clicked=undefined;
    if (!event.viewTransition || reduced.matches) {event.viewTransition?.skipTransition();return;}
    window.__incomingViewTransition=event.viewTransition;
    const id=format(location.href);
    if (id) name(destination(id),id);
    else {
      const previous=window.navigation?.activation?.from?.url;
      const from=previous&&format(previous);
      if (from) name(sourceCard(from),from);
    }
    window.__film?.settle();
    event.viewTransition.finished.finally(()=>{clear();window.__incomingViewTransition=undefined;});
  });
  addEventListener('pageshow',event=>{if(event.persisted){clear();clicked=undefined;}});
})();
