# План библиотеки из 150 новых PNG

Текущий этап: 36 образцов для утверждения, по 3 на каждую из 12 тем. Полный объём 150 включает эти образцы: после их утверждения останется 114 новых изображений. Метка SAMPLE выделяет первую тройку каждой темы.

## Объём и результат

- Семейный архив: 14 PNG.
- Спорт, музыка, путешествия, увлечения, дом и сад, учёба и достижения, личные вещи, эпоха и быт, компьютерные игры, животные: по 12 PNG.
- Шаблоны одежды: 16 PNG, 8 мужских и 8 женских.
- Сейчас готовятся только 36 образцов в `output/imagegen/collections-samples/`. До их явного утверждения полный набор не генерируется, коммит и отправка не выполняются.
- Записи `draft-catalog.json` описывают планируемые изображения, а не уже существующие файлы. Идентификаторы c001-c150 и относительные пути постоянные.

## Требования к изображениям

- Отдельный PNG с настоящим прозрачным фоном, фотореализм, спокойные цвета и мягкий свет. Умеренный износ только по смыслу.
- Объект полностью помещается в кадре, с прозрачными полями около 10 процентов. Нет фона, поверхности, отдельной тени, ореола, логотипа или водяного знака.
- Документы, фотокарточки, билеты и бирки содержат пустые зоны для последующего заполнения. Нет персональных данных и вымышленных читаемых надписей.
- Игровые ассеты показывают физические предметы, без персонажей, брендов и экранного текста.
- Животные естественные, целиком, с корректной анатомией и сохранёнными хвостами, лапами, ушами, крыльями и плавниками.
- Одежда пока предлагается как фронтальные шаблоны плеч и груди. Нет головы, шеи, кожи, рук, тела или манекена; горловина пустая и прозрачная. Плечи не обрезаны. Образцы позволяют выбрать форму до полной генерации.
- Первые три образца одежды: мужчина в тёмном пиджаке, женщина в светлой блузке, женщина в бордовом платье. Изображается только одежда.

## Переиспользование и исключённые повторы

Проверены 50 предметов из `assets/professions/catalog.json` и 50 медалей из `assets/medals/catalog.json`. Новые медали не нужны. Имеющиеся предметы не копируются в новую папку и не входят в число 150.

Переиспользовать существующие: перьевую ручку p006, чертёжный циркуль p007, масштабную линейку p008, секатор p017, автомобильный руль p021, авиационную гарнитуру p023, швейную машинку p003, переплетённую книгу p036, счёты p037, печатную машинку p038, фотоаппарат p039, скрипку p040, палитру p041, клавиатуру p045 и архивную папку p049. Остальные предметы профессий также остаются в исходном каталоге.

Закрытый фотоальбом - отдельный запрошенный предмет, не новая версия обычной книги. Магнитный компас не повторяет чертёжный циркуль. Логарифмическая линейка не повторяет масштабную. В игровых предметах нет новой клавиатуры, руля или авиационной гарнитуры. Три кота, две породы собак и мужские/женские варианты одежды запланированы как разные выбранные варианты, не перекраски существующих PNG.

## Порядок работы и проверки

1. Сгенерировать только 36 записей с `sample: true`, сохраняя тему, номер и имя файла в папке образцов. Проверить каждую до показа.
2. Проверить чтение PNG, ненулевую площадь объекта и рабочий альфа-канал: прозрачность вне силуэта, прозрачные отверстия, отсутствие прямоугольного фона. У твёрдых непрозрачных материалов внутри силуэта не должно быть случайной полупрозрачности.
3. Проверить границы по альфа-каналу и прозрачные поля со всех сторон. Осмотреть изображения на белом и тёмном фоне: края, волосы и шерсть, мелкие детали, тени, читаемый мусор и обрезанные части.
4. Проверить точное количество 36 и по 3 образца в каждой теме. SHA-256 выявляет одинаковые файлы; совпадения предметов дополнительно сверяются с обоими исходными каталогами и списком новых ассетов.
5. Показать образцы пользователю и дождаться явного утверждения вида и стиля. Не считать молчание утверждением. Внести согласованные изменения в план и образцы.
6. После утверждения сохранить принятые образцы и сгенерировать оставшиеся 114. При замене образца итоговая квота темы остаётся прежней.
7. Собрать `assets/collections/<theme>/png/`, единый `assets/collections/catalog.json`, `prompts.txt` с использованными запросами и `README.md` с правилами применения. Пути в каталоге относительны папке `assets/collections/`; старые PNG не дублируются.
8. Дополнить финальный каталог фактическими размерами, байтами, форматом и SHA-256. Проверить существование каждого пути, 150 уникальных ID и путей, квоты 14/12/16, 8 мужских и 8 женских шаблонов, читаемость всех PNG и отсутствие точных дублей.
9. Передать библиотеку отдельной задачей в ветке `content/collections-library`. Коммит и отправку выполнять после утверждения. Интерфейс сайта, код приложения и тестовый фреймворк этой задачей не меняются.

## Полный список

### Семейный архив (14)

1. Семейный фотоальбом, закрытый, без надписей [SAMPLE] - `family-archive/png/01-photo-album.png` (c001)
2. Открытый почтовый конверт без надписей [SAMPLE] - `family-archive/png/02-open-envelope.png` (c002)
3. Перевязанная стопка писем без читаемого текста [SAMPLE] - `family-archive/png/03-tied-letters.png` (c003)
4. Пустая деревянная фоторамка - `family-archive/png/04-wooden-photo-frame.png` (c004)
5. Чистая состаренная фотокарточка - `family-archive/png/05-blank-vintage-photo-card.png` (c005)
6. Почтовая открытка с пустыми полями - `family-archive/png/06-blank-postcard.png` (c006)
7. Полоска фотонегативов - `family-archive/png/07-film-negative-strip.png` (c007)
8. Деревянная шкатулка для семейных реликвий - `family-archive/png/08-keepsake-box.png` (c008)
9. Детская вязаная пинетка - `family-archive/png/09-baby-bootie.png` (c009)
10. Браслет новорождённого с пустой биркой - `family-archive/png/10-blank-newborn-bracelet.png` (c010)
11. Свадебный атласный бант - `family-archive/png/11-wedding-ribbon-bow.png` (c011)
12. Засушенная роза - `family-archive/png/12-pressed-rose.png` (c012)
13. Старая детская погремушка - `family-archive/png/13-vintage-baby-rattle.png` (c013)
14. Фотослайд в картонной рамке без надписей - `family-archive/png/14-mounted-photo-slide.png` (c014)

### Спорт (12)

15. Футбольный мяч [SAMPLE] - `sport/png/01-football.png` (c015)
16. Теннисная ракетка [SAMPLE] - `sport/png/02-tennis-racket.png` (c016)
17. Фигурный конёк [SAMPLE] - `sport/png/03-figure-skate.png` (c017)
18. Деревянная лыжа с креплением - `sport/png/04-wooden-ski.png` (c018)
19. Гантель - `sport/png/05-dumbbell.png` (c019)
20. Плавательные очки - `sport/png/06-swimming-goggles.png` (c020)
21. Боксёрская перчатка - `sport/png/07-boxing-glove.png` (c021)
22. Дорожный велосипед - `sport/png/08-road-bicycle.png` (c022)
23. Баскетбольный мяч - `sport/png/09-basketball.png` (c023)
24. Волан для бадминтона - `sport/png/10-badminton-shuttlecock.png` (c024)
25. Ракетка для настольного тенниса - `sport/png/11-table-tennis-paddle.png` (c025)
26. Фехтовальная маска - `sport/png/12-fencing-mask.png` (c026)

### Музыка (12)

27. Акустическая гитара [SAMPLE] - `music/png/01-acoustic-guitar.png` (c027)
28. Баян [SAMPLE] - `music/png/02-button-accordion.png` (c028)
29. Виниловая пластинка без надписей [SAMPLE] - `music/png/03-vinyl-record.png` (c029)
30. Поперечная флейта - `music/png/04-concert-flute.png` (c030)
31. Труба - `music/png/05-trumpet.png` (c031)
32. Бубен - `music/png/06-tambourine.png` (c032)
33. Деревянный механический метроном - `music/png/07-wooden-metronome.png` (c033)
34. Аудиокассета без надписей - `music/png/08-audio-cassette.png` (c034)
35. Балалайка - `music/png/09-balalaika.png` (c035)
36. Акустическое пианино - `music/png/10-upright-piano.png` (c036)
37. Губная гармошка - `music/png/11-harmonica.png` (c037)
38. Саксофон - `music/png/12-saxophone.png` (c038)

### Путешествия (12)

39. Старый дорожный чемодан [SAMPLE] - `travel/png/01-vintage-suitcase.png` (c039)
40. Магнитный туристический компас [SAMPLE] - `travel/png/02-magnetic-compass.png` (c040)
41. Бинокль [SAMPLE] - `travel/png/03-binoculars.png` (c041)
42. Походный рюкзак - `travel/png/04-hiking-backpack.png` (c042)
43. Складная карта без надписей - `travel/png/05-unlabeled-folding-map.png` (c043)
44. Железнодорожный билет с пустыми полями - `travel/png/06-blank-railway-ticket.png` (c044)
45. Походный термос - `travel/png/07-camping-thermos.png` (c045)
46. Брезентовая туристическая палатка - `travel/png/08-canvas-tent.png` (c046)
47. Походный ботинок - `travel/png/09-hiking-boot.png` (c047)
48. Треккинговая палка - `travel/png/10-trekking-pole.png` (c048)
49. Багажная бирка с пустым полем - `travel/png/11-blank-luggage-tag.png` (c049)
50. Морская раковина на память о поездке - `travel/png/12-seashell-souvenir.png` (c050)

### Увлечения (12)

51. Деревянный шахматный конь [SAMPLE] - `hobbies/png/01-wooden-chess-knight.png` (c051)
52. Пяльцы с вышивкой [SAMPLE] - `hobbies/png/02-embroidery-hoop.png` (c052)
53. Удочка с катушкой [SAMPLE] - `hobbies/png/03-fishing-rod.png` (c053)
54. Клубок шерсти - `hobbies/png/04-wool-yarn-ball.png` (c054)
55. Крючок для вязания - `hobbies/png/05-crochet-hook.png` (c055)
56. Любительский астрономический телескоп - `hobbies/png/06-amateur-telescope.png` (c056)
57. Модель парусника - `hobbies/png/07-model-sailboat.png` (c057)
58. Механический кубик-головоломка без маркировки - `hobbies/png/08-twist-puzzle-cube.png` (c058)
59. Керамическая ваза ручной работы - `hobbies/png/09-handmade-pottery-vase.png` (c059)
60. Бумажный журавлик оригами - `hobbies/png/10-origami-crane.png` (c060)
61. Коллекционная модель ретроавтомобиля - `hobbies/png/11-model-vintage-car.png` (c061)
62. Резная деревянная фигурка птицы - `hobbies/png/12-carved-wooden-bird.png` (c062)

### Дом и сад (12)

63. Садовая лейка [SAMPLE] - `home-and-garden/png/01-garden-watering-can.png` (c063)
64. Керамический заварочный чайник [SAMPLE] - `home-and-garden/png/02-ceramic-teapot.png` (c064)
65. Пеларгония в терракотовом горшке [SAMPLE] - `home-and-garden/png/03-potted-pelargonium.png` (c065)
66. Садовая лопата с длинной ручкой - `home-and-garden/png/04-garden-spade.png` (c066)
67. Плетёная хозяйственная корзина - `home-and-garden/png/05-wicker-basket.png` (c067)
68. Чугунная сковорода - `home-and-garden/png/06-cast-iron-skillet.png` (c068)
69. Деревянные настенные часы без надписей - `home-and-garden/png/07-wooden-wall-clock.png` (c069)
70. Деревянный скворечник - `home-and-garden/png/08-wooden-birdhouse.png` (c070)
71. Каменная кухонная ступка - `home-and-garden/png/09-stone-kitchen-mortar.png` (c071)
72. Эмалированный дуршлаг - `home-and-garden/png/10-enamel-colander.png` (c072)
73. Садовые грабли - `home-and-garden/png/11-garden-rake.png` (c073)
74. Плетёное кресло - `home-and-garden/png/12-wicker-armchair.png` (c074)

### Учёба и достижения (12)

75. Выпускная академическая шапочка [SAMPLE] - `education/png/01-graduation-cap.png` (c075)
76. Свёрнутый диплом без текста [SAMPLE] - `education/png/02-blank-diploma-scroll.png` (c076)
77. Учебный глобус без надписей [SAMPLE] - `education/png/03-unlabeled-school-globe.png` (c077)
78. Школьная грифельная доска без текста - `education/png/04-blank-school-slate.png` (c078)
79. Школьный колокольчик - `education/png/05-school-bell.png` (c079)
80. Деревянный карандаш без маркировки - `education/png/06-wooden-pencil.png` (c080)
81. Прозрачный транспортир - `education/png/07-school-protractor.png` (c081)
82. Логарифмическая линейка - `education/png/08-slide-rule.png` (c082)
83. Школьная меловая губка - `education/png/09-chalkboard-eraser.png` (c083)
84. Деревянный пенал - `education/png/10-wooden-pencil-case.png` (c084)
85. Школьный ранец без эмблем - `education/png/11-school-satchel.png` (c085)
86. Кубок за достижения без надписей - `education/png/12-blank-achievement-trophy.png` (c086)

### Личные вещи (12)

87. Карманные часы [SAMPLE] - `personal-items/png/01-pocket-watch.png` (c087)
88. Круглые очки [SAMPLE] - `personal-items/png/02-round-eyeglasses.png` (c088)
89. Открытый медальон с пустым местом под фото [SAMPLE] - `personal-items/png/03-open-photo-locket.png` (c089)
90. Гладкое обручальное кольцо - `personal-items/png/04-plain-wedding-ring.png` (c090)
91. Гребень для волос - `personal-items/png/05-hair-comb.png` (c091)
92. Старый домашний ключ - `personal-items/png/06-old-house-key.png` (c092)
93. Хлопковый носовой платок - `personal-items/png/07-cotton-handkerchief.png` (c093)
94. Зажим для галстука - `personal-items/png/08-tie-clip.png` (c094)
95. Флакон духов без этикетки - `personal-items/png/09-unlabeled-perfume-bottle.png` (c095)
96. Кожаный бумажник - `personal-items/png/10-leather-wallet.png` (c096)
97. Заколка для волос - `personal-items/png/11-hair-barrette.png` (c097)
98. Деревянная трость - `personal-items/png/12-wooden-walking-cane.png` (c098)

### Эпоха и быт (12)

99. Дисковый телефон [SAMPLE] - `everyday-history/png/01-rotary-telephone.png` (c099)
100. Транзисторный радиоприёмник [SAMPLE] - `everyday-history/png/02-transistor-radio.png` (c100)
101. Керосиновая лампа [SAMPLE] - `everyday-history/png/03-kerosene-lamp.png` (c101)
102. Самовар - `everyday-history/png/04-samovar.png` (c102)
103. Походный примус - `everyday-history/png/05-primus-stove.png` (c103)
104. Сумка-авоська - `everyday-history/png/06-string-grocery-bag.png` (c104)
105. Эмалированная кружка - `everyday-history/png/07-enamel-mug.png` (c105)
106. Катушечный магнитофон - `everyday-history/png/08-reel-to-reel-recorder.png` (c106)
107. Чугунный угольный утюг - `everyday-history/png/09-charcoal-iron.png` (c107)
108. Телевизор с кинескопом и выключенным экраном - `everyday-history/png/10-crt-television.png` (c108)
109. Эмалированная хлебница - `everyday-history/png/11-enamel-bread-bin.png` (c109)
110. Сифон для газированной воды - `everyday-history/png/12-soda-siphon.png` (c110)

### Компьютерные игры (12)

111. Геймпад с двумя аналоговыми стиками [SAMPLE] - `gaming/png/01-dual-analog-gamepad.png` (c111)
112. Настольный игровой джойстик [SAMPLE] - `gaming/png/02-desktop-gaming-joystick.png` (c112)
113. Портативная игровая консоль с выключенным экраном [SAMPLE] - `gaming/png/03-handheld-console.png` (c113)
114. Проводная игровая мышь - `gaming/png/04-wired-gaming-mouse.png` (c114)
115. Шлем виртуальной реальности - `gaming/png/05-vr-headset.png` (c115)
116. Игровой картридж без наклейки - `gaming/png/06-blank-game-cartridge.png` (c116)
117. Стационарная игровая приставка без маркировки - `gaming/png/07-retro-game-console.png` (c117)
118. Блок педалей для автосимулятора - `gaming/png/08-racing-pedals.png` (c118)
119. Игровой оптический диск в футляре без надписей - `gaming/png/09-game-disc-case.png` (c119)
120. Панель аркадных кнопок без джойстика - `gaming/png/10-arcade-button-panel.png` (c120)
121. Карта памяти для игровой приставки без надписей - `gaming/png/11-console-memory-card.png` (c121)
122. Тканевый коврик для мыши без рисунка - `gaming/png/12-plain-mouse-pad.png` (c122)

### Коты и другие животные (12)

123. Рыжий полосатый кот, целиком [SAMPLE] - `animals/png/01-ginger-tabby-cat.png` (c123)
124. Палевый пёс, целиком [SAMPLE] - `animals/png/02-yellow-dog.png` (c124)
125. Волнистый попугай, целиком [SAMPLE] - `animals/png/03-budgerigar.png` (c125)
126. Серый длинношёрстный кот, целиком - `animals/png/04-gray-longhair-cat.png` (c126)
127. Чёрно-белый кот, целиком - `animals/png/05-black-white-cat.png` (c127)
128. Такса, целиком - `animals/png/06-dachshund.png` (c128)
129. Домашний кролик, целиком - `animals/png/07-domestic-rabbit.png` (c129)
130. Морская свинка, целиком - `animals/png/08-guinea-pig.png` (c130)
131. Лошадь, целиком - `animals/png/09-horse.png` (c131)
132. Сухопутная черепаха, целиком - `animals/png/10-tortoise.png` (c132)
133. Золотая рыбка, целиком - `animals/png/11-goldfish.png` (c133)
134. Ёж, целиком - `animals/png/12-hedgehog.png` (c134)

### Шаблоны одежды (16)

135. Мужской тёмный пиджак с рубашкой и галстуком [SAMPLE] - `clothing-templates/png/01-male-dark-suit.png` (c135)
136. Женская светлая блузка [SAMPLE] - `clothing-templates/png/02-female-light-blouse.png` (c136)
137. Женское бордовое платье [SAMPLE] - `clothing-templates/png/03-female-burgundy-dress.png` (c137)
138. Мужская клетчатая повседневная рубашка - `clothing-templates/png/04-male-plaid-shirt.png` (c138)
139. Мужской вязаный свитер с круглой горловиной - `clothing-templates/png/05-male-crewneck-sweater.png` (c139)
140. Мужская джинсовая куртка - `clothing-templates/png/06-male-denim-jacket.png` (c140)
141. Мужской вязаный жилет с рубашкой - `clothing-templates/png/07-male-knitted-vest-shirt.png` (c141)
142. Мужская лёгкая рабочая куртка без эмблем - `clothing-templates/png/08-male-work-jacket.png` (c142)
143. Мужская летняя льняная рубашка со стойкой - `clothing-templates/png/09-male-linen-shirt.png` (c143)
144. Мужская водолазка - `clothing-templates/png/10-male-turtleneck.png` (c144)
145. Женский мягкий кардиган с блузкой - `clothing-templates/png/11-female-cardigan-blouse.png` (c145)
146. Женский твидовый жакет - `clothing-templates/png/12-female-tweed-jacket.png` (c146)
147. Женский вязаный свитер с круглой горловиной - `clothing-templates/png/13-female-crewneck-sweater.png` (c147)
148. Женская блузка с бантом у воротника - `clothing-templates/png/14-female-bow-blouse.png` (c148)
149. Женская джинсовая куртка - `clothing-templates/png/15-female-denim-jacket.png` (c149)
150. Женское шерстяное пальто с лацканами - `clothing-templates/png/16-female-wool-coat.png` (c150)
