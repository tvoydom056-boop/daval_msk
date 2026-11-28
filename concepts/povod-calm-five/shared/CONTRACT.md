# Контракт пяти лендингов

Корень concepts/povod-calm-five. Каждый агент меняет только свои папки. Настоящий HTML в index.html и отдельный styles.css; никакого React/зависимостей и screenshot-as-site.

Общие файлы готовы: ../shared/base.css, ../shared/app.js, ../kit/system.css, ../kit/system.js, ../kit/motion/motion.css, ../kit/motion/motion.js, ../kit/layout/layout.css, ../kit/layout/layout.js. Подключать kit CSS до base.css и своей styles.css. Скрипты type=module в конце body: kit/system.js, kit/motion/motion.js, kit/layout/layout.js и shared/app.js. В head script document.documentElement.classList.add('m-enter');setTimeout(()=>document.documentElement.classList.add('m-enter-done'),700).
HTML lang=ru data-type=service data-motion data-buttons=solid; meta page-type=service,site-kind=other. Hero class=hero data-enter. Не использовать kit nav-классы: свои site-header/header-inner/site-nav.

Общие CSS: .wrap, .screen, .hero, .eyebrow, .lead, .small, .muted, .serif, .handwriting, .btn-row, .btn, .btn--secondary, .text-link, .site-header, .header-inner, .logo, .site-nav, .menu-toggle, .skip-link, .photo, .section-head, .paper-note, .voice-demo, .wave, .occasion-tabs, .occasion-panel, .steps, .step, .faq, .contact-grid, .contact-copy, .demo-form, .field, .full, .field-error, .form-message, .site-footer, .footer-top, .footer-links, .footer-note. Базовые токены --bg,--ink,--muted,--accent,--surface,--line,--font-display переопределять своим :root.

Продукт: сайт-подарок под ключ из фото, письма и голоса к 4 поводам. Без цен, сроков, отзывов, аккаунта, настоящей отправки. Главная кнопка Обсудить подарок -> #contact, дополнительная Посмотреть пример -> #story. Никаких устройств/мини-сайтов/макетов экранов. Сохранять data-slot у каждого img. Никаких U+2013/U+2014 в новых файлах.

Навигация:
<a class="skip-link" href="#main">К содержимому</a>
<header class="site-header"><div class="wrap header-inner"><a class="logo" href="#top" aria-label="Повод, в начало">повод.</a><button class="menu-toggle" type="button" data-menu-toggle aria-expanded="false" aria-controls="site-menu">Меню</button><nav class="site-nav" id="site-menu" data-menu aria-label="Основная навигация"><a href="#occasions">Поводы</a><a href="#story">Пример</a><a href="#process">Как это работает</a><a class="btn" href="#contact">Обсудить подарок</a></nav></div></header>
<main id="main">...</main>

Картинки будут готовы в media, ссылаться через ../media:
hero-editorial.webp, hero-garden.webp, hero-archive.webp, hero-letter.webp, hero-voice.webp.
Дополнительные: wedding.webp, birthday.webp, anniversary.webp, jubilee.webp, home.webp, trip.webp, meet.webp, hike.webp, family.webp.
Hero брать свой, остальные фото не повторять на одной странице. loading=eager fetchpriority=high у hero; lazy у остальных. img width height обязательны, фактическое соотношение можно crop через object-fit.

Аудио только честное демо:
<div class="voice-demo"><svg class="wave" data-waveform viewBox="0 0 360 80" aria-hidden="true"></svg><button type="button" disabled aria-describedby="audio-note">Слушать</button><p id="audio-note" class="small">В демо нет аудиозаписи. Здесь будет голос вашего близкого</p></div>
Ни кнопка play, ни toast не имитируют воспроизведение.

Один легкий момент на каждую страницу. Можно <div data-moment="word-highlight"><p class="mo-wh__text">Мы собираем ваши фотографии, письмо и голос в личный сайт, который вы подарите близкому человеку по одной ссылке</p></div>. 12-40 слов. Не превращать все блоки в анимации.

FAQ native details/summary. Короткие ответы: Сайт открывается по ссылке в браузере; вы присылаете фото, письмо и при желании голос; сначала согласовываем черновик. Без неподтвержденных сроков.

Форма в #contact:
<form class="demo-form" data-demo-form><fieldset disabled>
<div class="field"><label for="name">Ваше имя</label><input id="name" name="name" required minlength="2" maxlength="80" autocomplete="given-name" aria-describedby="name-error"><span class="field-error" id="name-error"></span></div>
<div class="field"><label for="contact-field">Телефон или Telegram</label><input id="contact-field" name="contact" required minlength="2" maxlength="120" autocomplete="off" aria-describedby="contact-error"><span class="field-error" id="contact-error"></span></div>
<div class="field full"><label for="occasion">Ваш повод</label><select id="occasion" name="occasion" required aria-describedby="occasion-error"><option value="">Выберите повод</option><option>День рождения</option><option>Свадьба</option><option>Годовщина</option><option>Юбилей</option></select><span class="field-error" id="occasion-error"></span></div>
<div class="field full"><label for="comment">Что хотите рассказать</label><textarea id="comment" name="comment" maxlength="1000" aria-describedby="comment-error"></textarea><span class="field-error" id="comment-error"></span></div>
<button class="btn" type="submit">Обсудить подарок</button></fieldset><p class="small">Демо-форма. Данные не отправляются и не сохраняются</p><p class="form-message" data-form-message role="status" aria-live="polite"></p></form>
<noscript><p>Это макет. Для проверки формы нужен JavaScript</p></noscript>
app.js включает fieldset только после назначения preventDefault. Не делать реальную отправку.

Footer: повод., ссылки по странице, ссылка ../index.html "Все пять концепций", короткое "Демонстрационная концепция. Люди и истории вымышлены, фотографии сгенерированы". Не добавлять частные URL, контакты и абсолютные пути.

Дизайн: спокойные плоские фоны, минимум 16px body, 14px labels, хорошая читаемость. Hero один первый экран (1440x900) с CTA до fold. На мобильном текст/CTA до фото (кроме landscape photo hero, где можно overlay). Общий край .wrap; 5 самостоятельных архитектур. 4-5 осмысленных секций с пустым пространством, не сплошная сетка карточек. Без подписей под одиночными фото, декоративных цифр, круглых значков или стрелок на кнопках.
