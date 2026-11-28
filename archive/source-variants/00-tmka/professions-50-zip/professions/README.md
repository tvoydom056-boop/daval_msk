# Библиотека предметов профессий

50 отдельных PNG с прозрачным фоном для страниц «Летописи» и генерации новых композиций. Первые 5 образцов сохранены без изменения содержимого, ещё 45 предметов созданы в согласованном реалистичном стиле. Все изображения созданы встроенным imagegen.

## Структура

```text
assets/professions/
  png/           50 изображений с прозрачным фоном
  catalog.json   ID, профессии, категории, пути, размеры, SHA-256 и промпты
  prompts.txt    исходные промпты и инструкции доработки фона
  README.md      состав библиотеки и правила переиспользования
```

## Переиспользование

- Выбирайте предмет по постоянному `id`, например `p001`, или по полю `profession`.
- Путь `file` в каталоге считается относительно `assets/professions/`: `png/01-doctor-stethoscope.png`.
- Для сайта используйте выбранный PNG. Исходные `width` и `height` указаны в каталоге; сохраняйте пропорции при выводе.
- Для новой генерации прикрепите нужный PNG и опишите композицию. Общий `reuse_prompt` и промпт каждого предмета сохранены в каталоге.
- Для подноса и клавиатуры в `edit_prompt` сохранена дополнительная инструкция удаления ореола фона. Она также есть в `prompts.txt`.
- `sha256` позволяет проверить, что при копировании файл сохранился без изменений.

## Состав

| ID | Профессия | Предмет |
|---|---|---|
| p001 | Врач | [Стетоскоп](png/01-doctor-stethoscope.png) |
| p002 | Строитель | [Строительная каска](png/02-builder-hard-hat.png) |
| p003 | Швея | [Швейная машинка](png/03-tailor-sewing-machine.png) |
| p004 | Повар | [Поварской нож](png/04-chef-knife.png) |
| p005 | Автомеханик | [Комбинированный гаечный ключ](png/05-mechanic-combination-wrench.png) |
| p006 | Учитель | [Перьевая ручка](png/06-teacher-fountain-pen.png) |
| p007 | Инженер | [Чертёжный циркуль](png/07-engineer-drawing-compass.png) |
| p008 | Архитектор | [Масштабная линейка](png/08-architect-scale-ruler.png) |
| p009 | Столяр | [Столярный рубанок](png/09-carpenter-hand-plane.png) |
| p010 | Электрик | [Стрелочный мультиметр](png/10-electrician-analog-multimeter.png) |
| p011 | Сантехник | [Трубный ключ](png/11-plumber-pipe-wrench.png) |
| p012 | Сварщик | [Сварочная маска](png/12-welder-mask.png) |
| p013 | Маляр | [Малярная кисть](png/13-painter-flat-brush.png) |
| p014 | Каменщик | [Кельма каменщика](png/14-mason-brick-trowel.png) |
| p015 | Геодезист | [Оптический нивелир](png/15-surveyor-optical-level.png) |
| p016 | Земледелец | [Серп](png/16-farmer-sickle.png) |
| p017 | Садовник | [Садовый секатор](png/17-gardener-pruning-shears.png) |
| p018 | Работник молочной фермы | [Молочный бидон](png/18-dairy-worker-milk-can.png) |
| p019 | Пчеловод | [Пчеловодный дымарь](png/19-beekeeper-smoker.png) |
| p020 | Моряк | [Судовой штурвал](png/20-sailor-ship-wheel.png) |
| p021 | Водитель | [Автомобильный руль](png/21-driver-steering-wheel.png) |
| p022 | Железнодорожник | [Железнодорожный сигнальный фонарь](png/22-railway-worker-signal-lantern.png) |
| p023 | Пилот | [Авиационная гарнитура](png/23-pilot-flight-headset.png) |
| p024 | Пожарный | [Пожарный топор](png/24-firefighter-fire-axe.png) |
| p025 | Почтальон | [Почтовая сумка](png/25-postman-leather-bag.png) |
| p026 | Сапожник | [Сапожная колодка](png/26-shoemaker-wooden-last.png) |
| p027 | Парикмахер | [Парикмахерские ножницы](png/27-barber-scissors.png) |
| p028 | Стоматолог | [Стоматологическое зеркало](png/28-dentist-mouth-mirror.png) |
| p029 | Фармацевт | [Аптечные весы](png/29-pharmacist-balance-scales.png) |
| p030 | Лаборант | [Лабораторный микроскоп](png/30-lab-technician-microscope.png) |
| p031 | Ветеринар | [Отоскоп](png/31-veterinarian-otoscope.png) |
| p032 | Пекарь | [Пекарская скалка](png/32-baker-rolling-pin.png) |
| p033 | Кондитер | [Кондитерский мешок](png/33-pastry-chef-piping-bag.png) |
| p034 | Официант | [Поднос](png/34-waiter-serving-tray.png) |
| p035 | Бариста | [Ручная кофемолка](png/35-barista-coffee-grinder.png) |
| p036 | Библиотекарь | [Переплетённая книга](png/36-librarian-clothbound-book.png) |
| p037 | Бухгалтер | [Деревянные счёты](png/37-accountant-wooden-abacus.png) |
| p038 | Журналист | [Печатная машинка](png/38-journalist-typewriter.png) |
| p039 | Фотограф | [Плёночный фотоаппарат](png/39-photographer-film-camera.png) |
| p040 | Музыкант | [Скрипка](png/40-musician-violin.png) |
| p041 | Художник | [Палитра художника](png/41-artist-palette.png) |
| p042 | Скульптор | [Киянка скульптора](png/42-sculptor-wooden-mallet.png) |
| p043 | Ювелир | [Ювелирная лупа](png/43-jeweler-folding-loupe.png) |
| p044 | Часовщик | [Часовой пинцет](png/44-watchmaker-tweezers.png) |
| p045 | Программист | [Компьютерная клавиатура](png/45-programmer-keyboard.png) |
| p046 | Химик | [Химическая колба](png/46-chemist-round-bottom-flask.png) |
| p047 | Геолог | [Геологический молоток](png/47-geologist-rock-hammer.png) |
| p048 | Печатник | [Типографский валик](png/48-printer-ink-brayer.png) |
| p049 | Архивист | [Архивная папка](png/49-archivist-document-folder.png) |
| p050 | Спасатель | [Спасательный круг](png/50-rescuer-lifebuoy.png) |

## Добавление

Следующий свободный ID - `p051`. Сохраняйте новый отдельный PNG в `png/`, целиком помещайте предмет в кадр и проверяйте прозрачный фон. Добавляйте запись с профессией, категорией, относительным путём, размерами, SHA-256 и промптом в каталог; обновляйте `count`, `prompts.txt` и таблицу выше. Существующие ID и имена файлов сохраняются.

## Git

В Git добавляется вся папка `assets/professions/`: отдельные PNG, каталог, промпты и этот README. Для использования библиотеки не нужен локальный кэш генератора. ZIP для скачивания хранится отдельно в `output/professions-50/` и исключён из Git.
