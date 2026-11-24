# ГЛАВНОЕ ПРАВИЛО
Задание от режиссёра Claude - единственный источник требований. Старые HANDOFF и планы не применять. Не упрощать и не пропускать пункты молча: невозможное писать в отчёте. Ничего не удалять, Worker и серверы не трогать. Бюджет Syntx на всё задание: потолок 500 токенов, ни одного запуска сверх потолка.

# Видео-петли для макетов «Летописи» и «Повода» через Syntx
Цель: 17 тихих фоновых видео-петель по 5 с из готовых кадров. Движение спокойное и правдоподобное, как живая фотография: туман, свет, ветер, искры, лёгкие движения людей. Камера статична или едва дрейфует.

## Где работать
- Папка задачи: E:/CLAUDE/Сайты памяти и поздравлений/codex/v2/. Сырые клипы: codex/v2/raw/video/. Готовые: letopis/assets/v2/video/<name>.mp4 и povod/assets/v2/video/<name>.mp4.
- Клиент Syntx: скопируй E:/CLAUDE/ЮТУБ/Тестовый стенд/animation/lab78/release/syntx78.py в codex/v2/syntx_v2.py и работай с копией (оригинал не менять). Запуск: E:/CLAUDE/ЮТУБ/Тестовый стенд/animation/lab60/runtime/Scripts/python.exe -B syntx_v2.py ... Сессия: D:/CLAUDE_Apps/syntx77/profile.json. Свои задания, загрузки и бюджет храни в codex/v2/syntx/ (а не в папке lab78). Сначала проверь баланс. Если сессия не авторизована - СТОП, в отчёте напиши, что нужен вход в Telegram.
- Модель: seedance (Seedance 1.0 Pro-Fast), image-to-video по первому кадру, 1080p, 16:9, 5 с, ~24 токена. Перед первым запуском получи цену командой quote и сверь.
- Первый кадр: letopis/assets/v2/scenes/<name>.jpg или povod/assets/v2/scenes/<name>.jpg.
- В каждый промпт добавляй: «static shot, locked camera, subtle natural motion, no camera or tripod in scene, no text, no new people, keep faces and hands unchanged, photorealistic film look». Промпт на английском.

## Список клипов
| # | Сайт | name | Движение (смысл промпта) |
|---|---|---|---|
| 1 | letopis | hero | morning fog slowly drifts across the meadow, birch leaves sway gently, warm window light softly flickers |
| 2 | povod | slide-wedding | warm wind moves the tall grass and the dress, couple slowly sways in embrace, sun flares softly |
| 3 | letopis | war | low fog crawls over the grass, grass sways in wind, thin smoke on the horizon slowly rises, clouds drift |
| 4 | letopis | bridge | welding sparks flash and fall from the arch, river water ripples, smoke drifts, crane stays still |
| 5 | letopis | football | fog drifts through the floodlight beams, lights softly shimmer, the ball stays still, tree tops sway |
| 6 | letopis | school | dust motes float in the sunbeam, light slowly brightens, curtain-free window, nothing else moves |
| 7 | letopis | fog | white smoke clouds slowly billow and roll on pure black background, black stays pure black |
| 8 | povod | slide-birthday | sparklers sparkle, friends laugh and move slightly, string lights twinkle |
| 9 | povod | slide-anniversary | water shimmers with sunset reflections, couple breathes and smiles, steam from thermos cup |
| 10 | povod | slide-jubilee | string lights twinkle, family laughs softly, leaves sway, grandmother smiles |
| 11 | povod | story-meet | steam rises from cups, fairy lights twinkle, she tucks hair behind ear slowly |
| 12 | povod | story-trip | sea wind moves hair and shirts, waves roll below the cliffs, sun glows |
| 13 | povod | story-proposal | city lights twinkle, she trembles with joy holding hands to mouth, he holds the ring still |
| 14 | povod | story-today | dog wags tail and turns head, morning light shifts on the wall, couple laughs softly |
| 15 | povod | clouds | sunset clouds slowly billow and drift on pure black background, black stays pure black |
| 16 | letopis | tree-dust | создать первый кадр сам: чёрный фон #000000 с редкими тёплыми пылинками и мягким боке (Pillow или встроенная генерация); движение: warm dust particles slowly float upward on pure black |
| 17 | - | резерв | перезапуск худшего клипа (если брак) |

## Этапы
ЭТАП 1, потом СТОП: копия клиента, баланс, цена quote, клипы 1 и 2. Постобработка и проверка (ниже) для них. В отчёте: баланс до и после, путь к листу кадров. Остановиться и ждать.
ЭТАП 2 (запускается отдельной командой Claude): клипы 3-16, затем при браке 1-3 перезапуска. Запускать по 2 параллельно, после каждой пары смотреть кадры. Итог не меньше 400 и не больше 500 токенов за всё задание.

## Постобработка (ffmpeg)
- Бесшовная петля: последние 0,8 с плавно перетекают в первые 0,8 с (xfade), итог ровно 5 с, первый и последний кадр совпадают.
- H.264 yuv420p, 1920x1080, 24-30 fps, CRF 26-30, без звука, faststart, до 3 МБ (если больше - поднять CRF). Для fog и clouds чёрный фон должен остаться чистым (уровень не выше 8 из 255).
- Постер не нужен: уже есть scenes/<name>.jpg (для tree-dust сохрани его кадр как letopis/assets/v2/scenes/tree-dust.jpg).

## Проверка перед сдачей (сам, обязательно)
- Лист кадров по каждому клипу: 0; 1,25; 2,5; 3,75; 4,9 с -> codex/v2/sheet_video_stage<N>.jpg, посмотреть.
- Брак: искажённые лица и руки, новые люди или предметы, появившийся текст, камера/штатив в кадре, резкий скачок на шве петли, мерцание. Бракованный клип перезапустить (в рамках бюджета) или честно указать.

## Экономия контекста
Не читай HANDOFF, каталоги, старые лаборатории и чаты, кроме клиента syntx78.py. Без помощников.

## Сдача
Отчёт не длиннее 10 строк: какие клипы готовы, брак и перезапуски, расход токенов за этап и всего, баланс.
