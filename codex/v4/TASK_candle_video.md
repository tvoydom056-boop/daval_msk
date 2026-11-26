Задание только на видео через Syntx. Код сайта не трогай. Бюджет на всё задание: потолок 120 токенов, ни одного запуска сверх потолка.

Клиент: codex/v2/syntx_v2.py (уже настроен в прошлой работе, см. codex/v2/TASK_video.md - там команды, путь к python и профиль сессии). Свои задания, загрузки и учёт бюджета храни в codex/v4/syntx/. Сначала status (баланс). Если сессия не авторизована - СТОП, в отчёте напиши «нужен вход в Telegram», ничего не запускай.

## Что сделать
Свеча памяти для сайта. Тёмный фон строго #1c1714 (как блок свечи на сайте).
1. Подготовь первые кадры 1920x1080: свеча из v3/letopis/public/media/home/candle.png (горящая) и candle-unlit.png (не горящая), по центру, высотой ~55% кадра, на фоне #1c1714 с очень мягким тёплым светом вокруг. Сохрани в codex/v4/syntx/frames/.
2. Клип A «горит» (luup): seedance, 1080p, 16:9, 5 с, первый кадр - горящая. Промпт: candle flame gently flickers and breathes, soft warm glow pulses on the wax, tiny wisp of smoke, static shot, locked camera, subtle natural motion, background stays solid dark, no text, photorealistic.
3. Клип B «зажигается»: seedance, тот же формат, первый кадр - не горящая. Промпт: a small flame catches on the wick by itself and slowly grows into a calm steady flame, warm light spreads over the wax, static shot, locked camera, no hands, no matches, background stays solid dark, no text, photorealistic.
Перед первым запуском quote и сверка цены (~24 токена за клип).
4. Посмотри результат (кадры через ffmpeg, view_image). Если клип B сделал руку/спичку/скачок - одна повторная попытка с уточнённым промптом, не больше. Клип A сделай бесшовным: кроссфейд конца в начало 0,6 с через ffmpeg.
5. Готовые файлы: v3/letopis/public/media/home/candle-loop.mp4 (A, H.264, без звука, до 3 МБ) и candle-light.mp4 (B, без звука, до 3 МБ), плюс постеры candle-loop.jpg и candle-light.jpg (первые кадры).

Отчёт до 6 строк: баланс до/после, сколько токенов потрачено, что получилось, есть ли брак.
