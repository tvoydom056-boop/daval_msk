const menuButton = document.querySelector('[data-menu-toggle]');
const menu = document.querySelector('[data-menu]');
function closeMenu() {
  menu?.classList.remove('is-open');
  menuButton?.setAttribute('aria-expanded', 'false');
  if (menuButton) menuButton.textContent = 'Меню';
}
menuButton?.addEventListener('click', () => {
  const open = menuButton.getAttribute('aria-expanded') !== 'true';
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.textContent = open ? 'Закрыть' : 'Меню';
  menu.classList.toggle('is-open', open);
});
menu?.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && menuButton?.getAttribute('aria-expanded') === 'true') {
    closeMenu();
    menuButton.focus();
  }
});
window.matchMedia('(min-width:761px)').addEventListener('change', closeMenu);

document.querySelectorAll('[data-occasion-group]').forEach(group => {
  const buttons = [...group.querySelectorAll('[data-occasion]')];
  const panels = [...group.querySelectorAll('[data-occasion-panel]')];
  buttons.forEach(button => button.addEventListener('click', () => {
    buttons.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    panels.forEach(panel => { panel.hidden = panel.dataset.occasionPanel !== button.dataset.occasion; });
  }));
});

document.querySelectorAll('[data-waveform]').forEach(svg => {
  const heights = [5,9,13,7,19,27,12,36,18,45,25,57,32,64,41,52,23,39,17,28,47,68,51,34,56,28,43,19,32,14,25,11,17,7,13,5,9,4,7,3];
  heights.forEach((height, index) => {
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', 4 + index * 9);
    line.setAttribute('x2', 4 + index * 9);
    line.setAttribute('y1', 40 - height / 2);
    line.setAttribute('y2', 40 + height / 2);
    line.setAttribute('stroke', 'currentColor');
    line.setAttribute('stroke-width', '2');
    svg.append(line);
  });
});

document.querySelectorAll('[data-demo-form]').forEach(form => {
  const status = form.querySelector('[data-form-message]');
  const fields = [...form.querySelectorAll('input, select, textarea')];
  form.noValidate = true;
  const messageFor = field => {
    if (field.validity.valueMissing) return field.name === 'occasion' ? 'Выберите повод' : 'Заполните это поле';
    if (field.validity.tooShort || (field.required && field.value.trim().length < 2)) return 'Введите хотя бы два символа';
    if (!field.validity.valid) return 'Проверьте значение';
    return '';
  };
  function validate(field) {
    const error = messageFor(field);
    field.setAttribute('aria-invalid', String(Boolean(error)));
    const errorNode = document.getElementById(field.getAttribute('aria-describedby'));
    if (errorNode) errorNode.textContent = error;
    return !error;
  }
  form.addEventListener('submit', event => {
    event.preventDefault();
    status.textContent = '';
    const invalid = fields.filter(field => !validate(field));
    if (invalid.length) {
      invalid[0].focus();
      status.textContent = 'Проверьте отмеченные поля';
      return;
    }
    status.textContent = 'Поля заполнены. Это демо: заявка не отправлена и данные не сохранены';
  });
  fields.forEach(field => field.addEventListener('input', () => {
    status.textContent = '';
    if (field.getAttribute('aria-invalid') === 'true') validate(field);
  }));
  form.querySelector('fieldset').disabled = false;
});
