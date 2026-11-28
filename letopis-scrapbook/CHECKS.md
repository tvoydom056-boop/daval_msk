GATE: OPEN 44 (rounds used up)

# Проверка скрапбук-концепции «Летописи»

26 ноября 2026 года. Ветка site/letopis-scrapbook.

Функциональная проверка текущей версии в Edge headless пройдена на 1440x900, 768x1024, 375x812 и 320x812.
Проверены открытие фото и Escape, все фильтры, карточки родных, мобильное меню, валидация формы, показ демо-воспоминания и его сброс при перезагрузке. Все содержательные изображения декодируются; ошибок JavaScript и консоли нет; горизонтальной прокрутки нет. Reduced motion показывает три статичные главы.

node --check app.js и git diff --check выполнены. python build_artifacts.py выполнен для существующих макетов; отдельная новая папка не упаковывается этим скриптом. PDF-отчёт не пересобран.

Дизайн-чекер design-taste-frontend не пройден: остались 44 замечания после трёх проходов (64, 48, 44). Подписи, наклоны фотографий, перекрытия бумаги и свободная сетка выбраны по референсу пользователя. Чекер рассчитан на строгие одинаковые края, отсутствие подписей и ровно один раздел на экран. Эти правила расходятся с выбранной скрапбук-композицией. Все оставшиеся замечания приведены ниже, а не выданы за PASS. Waiver-файл не использовался.

Оформление: кремовая бумага #eee9df, бордовый картон #783c33, текст #3c322c; Literata normal/italic, Caveat только для письма. Один photo-chapters из набора, нативная прокрутка, вход обложки и hover/press. WebGL, видео, автопрокрутки и шейдеров нет.

Тон: семейный рассказ, детали из существующего демонстрационного архива. Реальные отзывы и клиентские данные не использовались. Вымышленность семьи и фотографий указана в подвале, характер формы - непосредственно перед полями.

Фото: wedding-1956.jpg, family-1985.jpg, bridge-1967.jpg, nikolay-bw.jpg, anna-bw.jpg и letter.png скопированы из существующих макетов. Исходные изображения не менялись. Слоты подписаны data-slot; кнопка «Слоты медиа» показывает границы, подсказки доступны при наведении. Живого голоса и видео в этой концепции нет.

Независимая консультация Opus 5.5 была запущена через профиль opus с готовым пакетом кода и результатами проверок. Ответ не получен: соединение прервалось до завершения ответа. Зависший собственный процесс консультации остановлен; успешное внешнее ревью не заявляется.

Серверное сохранение и публикация не выполнялись. Отдельная perf-проверка и полная матрица hover/scroll дизайн-чекера не запускались; функциональные сценарии и reduced motion проверены отдельно.

Открытые замечания дизайн-чекера:

1. spill - section.hero.section > div.wrap.hero__layout > div.hero__collage > figure.photo.hero__wedding "Николай и Анна. Начало нашей истории."
   runs 131px past the left edge of the panel it sits on (section.hero.section > div.wrap.hero__layout > div.hero__collage > div.red-paper)
   Предложение чекера: keep the box inside the panel it starts on: shrink it, or grow the panel to hold it

2. spill - section.hero.section > div.wrap.hero__layout > div.hero__collage > figure.photo.hero__portrait "Наш Николай Петрович"
   runs 153px past the bottom edge of the panel it sits on (div.wrap.hero__layout > div.hero__collage > figure.photo.hero__wedding > button.photo__image.m-zoom)
   Предложение чекера: keep the box inside the panel it starts on: shrink it, or grow the panel to hold it

3. no-visual - section#family "Всё начинается с родных."
   pictures, effects and mocks cover 5% of this section; a feature section needs a visual (about 25% or more)
   Предложение чекера: give the section a visual: a UI fragment on a ground, real icons, or a photograph that fits

4. card-layout - section#album > div.wrap > div.album__photos "Тот самый день"
   4 of 4 cards drawn one way (one panel, ground, placement and fragment): copies of one card
   Предложение чекера: a card layout at most twice on a page: build the other sections another way

5. top-stagger - section#album > div.wrap > div.album__photos "Тот самый день Все собрались. 1985 Его м"
   4 boxes side by side start at different heights (+0, +15, +15, +11px)
   Предложение чекера: align the tops of the boxes in the row (one floor, one ceiling)

6. off-grid - section#letters > div.wrap.letters__layout > div.letters__intro > img.letters__envelope "img: Сложенное треугольником старое пись"
   left edge at 63.5px, 16.5px off the page margin at 80px (20 elements, like p.letters__date)
   Предложение чекера: move it onto the page margin, or the column edge its section uses

7. tilt - section.hero.section > div.wrap.hero__layout > div.hero__collage > div.red-paper "С любовью, из прошлого."
   rotated 6.0° (and 5 more like it: "Наш Николай Петрович", "Семейный архив Хранить б", "Все собрались. 1985", "Наша Анна", ...)
   Предложение чекера: set it straight

8. tilt - section.hero.section > div.wrap.hero__layout > div.hero__collage > img.hero__letter "img: letter.png"
   rotated -19.0° (and 5 more like it: "Николай и Анна. Начало н", "Тот самый день", "Его мост. 1967", "img: Сложенное треугольн", ...)
   Предложение чекера: set it straight

9. visual-caption - div.wrap.hero__layout > div.hero__collage > figure.photo.hero__wedding > figcaption "Николай и Анна. Начало нашей истории."
   a figcaption under the picture wedding-1956.jpg: "Николай и Анна. Начало нашей истории."; no caption or description under any image, render or visual (house rule)
   Предложение чекера: take the line away: no caption or description under, over or on any image, render or visual; a licence credit goes in one footer line

10. visual-caption - div.wrap.hero__layout > div.hero__collage > figure.photo.hero__portrait > figcaption "Наш Николай Петрович"
   a figcaption under the picture nikolay-bw.jpg: "Наш Николай Петрович"; no caption or description under any image, render or visual (house rule)
   Предложение чекера: take the line away: no caption or description under, over or on any image, render or visual; a licence credit goes in one footer line

11. visual-caption - div.wrap > div.album__photos > figure.photo.album__photo:nth-of-type(1) > figcaption "Тот самый день"
   a figcaption under the picture wedding-1956.jpg: "Тот самый день"; no caption or description under any image, render or visual (house rule)
   Предложение чекера: take the line away: no caption or description under, over or on any image, render or visual; a licence credit goes in one footer line

12. visual-caption - div.wrap > div.album__photos > figure.photo.album__photo:nth-of-type(2) > figcaption "Все собрались. 1985"
   a figcaption under the picture family-1985.jpg: "Все собрались. 1985"; no caption or description under any image, render or visual (house rule)
   Предложение чекера: take the line away: no caption or description under, over or on any image, render or visual; a licence credit goes in one footer line

13. visual-caption - div.wrap > div.album__photos > figure.photo.album__photo:nth-of-type(3) > figcaption "Его мост. 1967"
   a figcaption under the picture bridge-1967.jpg: "Его мост. 1967"; no caption or description under any image, render or visual (house rule)
   Предложение чекера: take the line away: no caption or description under, over or on any image, render or visual; a licence credit goes in one footer line

14. visual-caption - div.wrap > div.album__photos > figure.photo.album__photo:nth-of-type(4) > figcaption "Наша Анна"
   a figcaption under the picture anna-bw.jpg: "Наша Анна"; no caption or description under any image, render or visual (house rule)
   Предложение чекера: take the line away: no caption or description under, over or on any image, render or visual; a licence credit goes in one footer line

15. hero-screen - main#top > section.hero.section > div.wrap.hero__layout > div.hero__collage "С любовью,из прошлого. Николай и Анна. Н"
   a strip docked in the hero is 652px tall: at most 96px on a desktop (SR-1)
   Предложение чекера: keep the hero's content between the nav and 24px above the fold (and the action bar): shorten the picture or the text; a docked strip 96px at most

16. section-height - footer#memories "У этой истории есть продолжениеЧто выпом"
   the section's content does not fit it: its lowest content ends 868px below its top, past 828px (the section less 72px of bottom padding) (SR-2)
   Предложение чекера: fit the content above the section's bottom padding (--padb), or make it two screens (.g2) in two groups

17. container-edges - main#top > section.hero.section > div.wrap.hero__layout "Сохраняем то, что любим СемейныйальбомСо"
   the hero's .wrap holds 3 children, 1 of them .hero-text: one .hero-text and at most one strip (SR-6)
   Предложение чекера: build the page as header.nav, a main of sections (each one in-flow .wrap plus background layers) and footer.closing

18. container-edges - section.hero.section > div.wrap.hero__layout > div.hero__collage > div.red-paper "С любовью,из прошлого."
   a box runs 823-1385px, outside the container lines of section 1 at 80-1360px: full width is for background layers and grounds only (SR-6)
   Предложение чекера: keep it inside the container lines (.wrap): full width is for background layers and grounds only

19. container-edges - section.hero.section > div.wrap.hero__layout > div.hero__collage > figure.photo.hero__portrait "Наш Николай Петрович"
   a box runs 1118-1381px, outside the container lines of section 1 at 80-1360px: full width is for background layers and grounds only (SR-6)
   Предложение чекера: keep it inside the container lines (.wrap): full width is for background layers and grounds only

20. container-edges - section#letters > div.wrap.letters__layout > div.letters__intro > img.letters__envelope "Сложенное треугольником старое письмо"
   "Сложенное треугольником старое п" runs 63-456px, outside the container lines of section 4 at 80-1360px: full width is for background layers and grounds only (and 7 more like it: "Май, 1943 Маша, береги р", "На память«Мост должен ст", "Открыть портрет Николая") (SR-6)
   Предложение чекера: keep it inside the container lines (.wrap): full width is for background layers and grounds only

21. container-edges - section#album > div.wrap > p.album__hint "Нажмите на фотографию, чтобы рассмотреть"
   1 text block starts on a left line at x 536, 456px from the container's left: text starts on the container's left, or on one split line (x 623, 732, 841) (SR-6)
   Предложение чекера: start the text on the container's left, or on the one split line every split shares

22. container-edges - div.wrap.hero__layout > div.hero-text > p.hero__meta > span "Собрано семьёй"
   1 text block starts on a left line at x 212, 132px from the container's left: text starts on the container's left, or on one split line (x 623, 732, 841) (SR-6)
   Предложение чекера: start the text on the container's left, or on the one split line every split shares

23. row-lines - section#album > div.wrap > div.album__photos "Тот самый день Все собрались. 1985 Его м"
   a row of 2 items: its first item starts at 401px, the container's left line at 80px; its last item ends at 1038px, the container's right line at 1360px; its items are 365/324px tall, not one height (2px either way) (SR-7)
   Предложение чекера: start the row's first item on the container's left line and end its last on the right line, every item one height

24. row-lines - div.wrap.hero__layout > div.hero__collage > figure.photo.hero__portrait > button.photo__image.m-zoom "Открыть портрет Николая"
   "Открыть портрет Николая" ends at 1368px, past the container's right line at 1360px (SR-7)
   Предложение чекера: end it at the container's right line

25. split-pair - footer#memories > div.wrap > div.closing__main "У этой истории есть продолжениеЧто выпом"
   the two columns of the split start 23px apart at the top: a split's columns are top-aligned, 8px either way (SR-8)
   Предложение чекера: top-align both columns of the split (align-items: start)

26. split-pair - section#letters > div.wrap.letters__layout "Из семейного архива Знакомыйпочерк. Трид"
   the split's columns are off the page's one pair of lines: its right column starts at x 770, on none of the split lines 623 (k=5), 732 (k=6), 841 (k=7) (SR-8)
   Предложение чекера: start every split's right column on one shared line (wrap.left + k x (width + 24) / 12, k 5, 6 or 7; 6 on a place page) and end the left one 24px before it

27. flush - section.hero.section > div.wrap.hero__layout > div.hero__collage > img.hero__letter "img: letter.png"
   its last line sits 5px above the lower edge of section.hero.section, where the ground changes to section#stories
   Предложение чекера: give the section its padding at the edge where the ground changes (the closing call keeps a clear gap above the footer)

28. spill - div.wrap.hero__layout > div.hero__collage > figure.photo.hero__portrait > button.photo__image.m-zoom
   runs 89px past the right edge of the panel it sits on (section.hero.section > div.wrap.hero__layout > div.hero__collage > img.hero__letter)
   Предложение чекера: keep the box inside the panel it starts on: shrink it, or grow the panel to hold it

29. off-grid - section.hero.section > div.wrap.hero__layout > div.hero__collage > img.hero__letter "img: letter.png"
   left edge at 12.5px, 11.5px off the page margin at 24px (24 elements, like p.collage-note); 1 more in this section off the grid too (figure.photo.hero__wedding at 10px)
   Предложение чекера: move it onto the page margin, or the column edge its section uses

30. off-grid - div#memory-note "На память «Мост должен стоять дольше, че"
   left edge at 18px, 6px off the page margin at 24px (24 elements, like button.btn.btn--primary)
   Предложение чекера: move it onto the page margin, or the column edge its section uses

31. right-edge - section.hero.section > div.wrap.hero__layout > div.hero__collage > figure.photo.hero__portrait "Наш Николай Петрович"
   its right edge runs 6px past the content's right edge (372px, where 4 boxes end)
   Предложение чекера: end it on the content's right edge, like the other blocks of its section

32. edge-left - section.hero.section div.hero__collage "С любовью,из прошлого. Николай и"
   starts at x 668.8; the lines are 79.9 and the column starts
   Предложение чекера: start it on the .wrap left line

33. edge-left - #album p "На обороте - даты и знакомый поч"
   starts at x 1070.9; the lines are 79.9 and the column starts
   Предложение чекера: start it on the .wrap left line

34. spill - #album figure.photo.album__photo "Тот самый день"
   x 76.6 to 397.2, the page runs 79.9 to 1360.1
   Предложение чекера: keep it inside the .wrap; nothing past the right edge

35. edge-left - #album figure.photo.album__photo "Все собрались. 1985"
   starts at x 401; the lines are 79.9 and the column starts
   Предложение чекера: start it on the .wrap left line

36. edge-right - #album figure.photo.album__photo "Все собрались. 1985"
   ends at x 716.9; the right line is 1360.1
   Предложение чекера: end it on the .wrap right line

37. edge-left - #album figure.photo.album__photo "Его мост. 1967"
   starts at x 724.1; the lines are 79.9 and the column starts
   Предложение чекера: start it on the .wrap left line

38. edge-right - #album figure.photo.album__photo "Его мост. 1967"
   ends at x 1037.9; the right line is 1360.1
   Предложение чекера: end it on the .wrap right line

39. spill - #album figure.photo.album__photo "Наша Анна"
   x 1039.4 to 1366.7, the page runs 79.9 to 1360.1
   Предложение чекера: keep it inside the .wrap; nothing past the right edge

40. edge-right - #letters div.letters__intro "Из семейного архива Знакомыйпоче"
   ends at x 656; the right line is 1360.1
   Предложение чекера: end it on the .wrap right line

41. spill - #letters article.letter-paper "Май, 1943 Маша, береги ребят.Вер"
   x 770 to 1374, the page runs 79.9 to 1360.1
   Предложение чекера: keep it inside the .wrap; nothing past the right edge

42. edge-left - #family p "Имена, лица и нити между ними.На"
   starts at x 1105.8; the lines are 79.9 and the column starts
   Предложение чекера: start it on the .wrap left line

43. spill - #album figure.photo.album__photo "Все собрались. 1985"
   x 199.4 to 367.6, the page runs 24 to 366
   Предложение чекера: keep it inside the .wrap; nothing past the right edge

44. spill - #album figure.photo.album__photo "Его мост. 1967"
   x 22.4 to 190.6, the page runs 24 to 366
   Предложение чекера: keep it inside the .wrap; nothing past the right edge

Предупреждения consistency:

- caption, 1440 px, div.wrap.hero__layout > div.hero__collage > figure.photo.hero__wedding > figcaption: a line of words sits right under a picture, like "Николай и Анна. Начало нашей истории.": the section's text says it, or the picture speaks for itself
- cut-text, 1440, 390 px, div.wrap.hero__layout > div.hero__collage > figure.photo.hero__wedding > figcaption: sits across the edge of a panel behind it
- pinned, 1440, 390 px, section#stories > div.wrap.mo-ph: held on screen for 2 screens of scroll (position: sticky) while the page moves on (inside a dealt moment's section, [data-moment]: expected on every kind, two moments at most, house rule; its still is judged under reduced motion)
- cta, 1440, 390 px, section#stories: a section over 1.5 screens long with no link or button in it
- copy-headline, 1440 px, h1#hero-title: "Семейный альбом Соколовых": no category known to check it against (pass --category, or write the <title> as "Name: what it is for whom")
- copy-headline, 1440 px, h1#hero-title: the h1 has 0 words (2 to 8 read at a glance)
- off-grid, 1440 px, section#album > div.wrap > div.album__photos > figure.photo.album__photo:nth-of-type(1): left edge at 76.5px, 3.5px off the page margin at 80px (20 elements, like p.eyebrow)
- section-gaps, 1440 px, main#top > section.hero.section / section#stories: 144px between these sections, -25% against the median 193px of gaps at a change of ground
- section-gaps, 1440 px, section#stories / section#album: 127px between these sections, -34% against the median 193px of gaps at a change of ground
- section-gaps, 1440 px, section#letters / section#family: 284px between these sections, +47% against the median 193px of gaps at a change of ground
- section-gaps, 1440 px, main#top > section.hero.section / section#stories: uneven space at the edge of a band: 33px outside its edge, 111px inside it (the space on either side of a change of ground reads as one gap only when the two match)
- proximity, 1440 px, div.wrap > div.album__photos > figure.photo.album__photo:nth-of-type(2) > figcaption: touches the picture or panel above it (2px) (and 1 more like it: "Его мост. 1967")
- photo-set, 1440 px, section#letters > div.wrap.letters__layout > div.letters__intro > img.letters__envelope: 10 photographs in more than one look: saturation from 0.03 to 0.34; the odd one out is letter.png
- photo-repeat, 1440 px, div.wrap.mo-ph > div.mo-ph__stage > figure.mo-ph__pic:nth-of-type(1) > img: the photograph wedding.jpg is shown 3 times on the page: a picture the visitor has already seen
- photo-repeat, 1440 px, div.family-tree > div.family-tree__couple > button.person:nth-of-type(1) > img: the photograph nikolay-bw.jpg is shown 2 times on the page: a picture the visitor has already seen
- photo-repeat, 1440 px, div.album__photos > figure.photo.album__photo:nth-of-type(3) > button.photo__image.m-zoom > img: the photograph bridge.jpg is shown 2 times on the page: a picture the visitor has already seen
- grounds, 1440 px, section#album: 4 flat grounds across the page (#eee9df section x2, #e3dac8 section x2, #783c33 section, #dfd1bb footer): three at most (the base, a surface, an inverse)
- empty-area, 1440 px, section#family: 47% of the section is empty: 16px of empty rows between its content, 16px under its last (button.person.person--note:nth-of-type(1)), 43% beside content that covers under half the container, in its 720px of rows (WARN over 35%, FAIL over 50%)
- skip-link, 1440 px, header.nav > div.wrap.nav__inner > a.skip-link:nth-of-type(1): the first Tab stop is "К содержимому", not a skip link: a keyboard user tabs through the whole nav on every visit
- tap-size, 390 px, header.nav > div.wrap.nav__inner > a.wordmark: a 123x27px tap target: under the 44px a phone needs
- tap-size, 390 px, footer#memories > div.wrap > div.closing__bottom > a.wordmark: a 246x27px tap target: under the 44px a phone needs
- off-grid, 390 px, section#album > div.wrap > div.album__photos > figure.photo.album__photo:nth-of-type(1): left edge at 20.5px, 3.5px off the page margin at 24px (24 elements, like figure.photo.album__photo:nth-of-type(3))
- off-grid, 390 px, section#letters > div.wrap.letters__layout > article.letter-paper: left edge at 21px, 3px off the page margin at 24px (24 elements, like p.eyebrow)
- body-size, 390 px, section#album > div.wrap > div.section-heading > p: 3 of 5 paragraphs of running text are set under 16px (14, 15px)
- section-gaps, 390 px, section#family / footer#memories: 197px between these sections, +50% against the median 131px of gaps at a change of ground
- section-gaps, 390 px, main#top > section.hero.section / section#stories: uneven space at the edge of a band: 5px outside its edge, 103px inside it (the space on either side of a change of ground reads as one gap only when the two match)
- proximity, 390 px, div.wrap > div.album__photos > figure.photo.album__photo:nth-of-type(1) > figcaption: touches the picture or panel above it (-1px)
- proximity, 390 px, div.wrap > div.album__photos > figure.photo.album__photo:nth-of-type(2) > figcaption: touches the picture or panel above it (1px) (and 1 more like it: "Его мост. 1967")
- photo-weight, 390 px, div.wrap.mo-ph > div.mo-ph__stage > figure.mo-ph__pic:nth-of-type(3) > img: 7 photographs are 3x or more wider than drawn on the phone, with no srcset: family-1985.jpg is 1600px (333 KB, lazy) for a 363px frame; on a phone it arrives late and its frame shows only its ground until then
- photo-repeat, 390 px, div.wrap.mo-ph > div.mo-ph__stage > figure.mo-ph__pic:nth-of-type(1) > img: the photograph wedding.jpg is shown 2 times on the page: a picture the visitor has already seen
- grounds, 390 px, section#album: 5 flat grounds across the page (#eee9df section x3, #e3dac8 section x2, #783c33 section, #dfd1bb footer, #f8efe0 band): three at most (the base, a surface, an inverse)

Эти предупреждения сохранены как ограничения концепта; они не считаются пройденными проверками.
