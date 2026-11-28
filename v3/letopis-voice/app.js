(() => {
  const selected = window.LETOPIS_CASES[new URLSearchParams(location.search).get('case')];
  if (selected?.hideImages) {
    document.body.classList.add('audio-only');
    document.querySelectorAll('.photo-material').forEach(element => { element.hidden = true; });
  }
  if (selected?.date) {
    document.getElementById('episode-date').textContent = selected.date;
    document.getElementById('date-note').textContent = selected.note;
  }

  const audio = document.getElementById('recording');
  const player = document.getElementById('player');
  const toggle = document.getElementById('toggle');
  const seek = document.getElementById('seek');
  const elapsed = document.getElementById('elapsed');
  const duration = document.getElementById('duration');
  const status = document.getElementById('audio-status');
  const time = seconds => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
  const updatePosition = () => {
    const seconds = Math.floor(audio.currentTime || 0);
    elapsed.textContent = time(seconds);
    seek.value = seconds;
    seek.setAttribute('aria-valuetext', `${Math.floor(seconds / 60)} минут ${seconds % 60} секунд`);
  };
  const updateState = () => {
    toggle.textContent = audio.paused ? (audio.currentTime ? 'Продолжить' : 'Воспроизвести') : 'Пауза';
    toggle.setAttribute('aria-pressed', String(!audio.paused));
  };
  const ready = () => {
    if (!Number.isFinite(audio.duration)) return;
    duration.textContent = time(audio.duration);
    seek.max = Math.floor(audio.duration);
    seek.disabled = false;
  };
  const failed = () => {
    status.textContent = 'Запись не загрузилась. Попробуйте обновить страницу. Короткую историю можно прочитать ниже.';
    toggle.disabled = true;
    seek.disabled = true;
    duration.textContent = 'Недоступна';
  };
  const play = async () => {
    status.textContent = '';
    try { await audio.play(); }
    catch { status.textContent = 'Не удалось включить запись. Попробуйте ещё раз. Текст истории доступен ниже.'; }
  };
  toggle.addEventListener('click', () => {
    if (!audio.paused) audio.pause();
    else play();
  });
  document.querySelector('.hero__actions a[href="#listen"]').addEventListener('click', () => {
    if (audio.paused) play();
    toggle.focus({ preventScroll: true });
  });
  seek.addEventListener('input', () => { audio.currentTime = Number(seek.value); updatePosition(); });
  audio.addEventListener('loadedmetadata', ready);
  audio.addEventListener('durationchange', ready);
  audio.addEventListener('timeupdate', updatePosition);
  audio.addEventListener('play', updateState);
  audio.addEventListener('pause', updateState);
  audio.addEventListener('ended', updateState);
  audio.addEventListener('error', failed);
  player.hidden = false;
  audio.controls = false;
  audio.hidden = true;
  ready();
  if (audio.error) failed();
})();
