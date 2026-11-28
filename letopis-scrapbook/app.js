const photographs = {
  wedding: {src:'assets/img/wedding-1956.jpg', title:'Николай и Анна', description:'Свадебная фотография у дома. Из демонстрационного семейного архива.'},
  family: {src:'assets/img/family-1985.jpg', title:'Все собрались. 1985', description:'Семья Соколовых за праздничным столом.'},
  bridge: {src:'assets/img/bridge-1967.jpg', title:'Дело всей жизни. 1967', description:'Строительство моста. Из истории Николая Петровича.'},
  nikolay: {src:'assets/img/nikolay-bw.jpg', title:'Николай Петрович Соколов', description:'1931-2019. Мостостроитель, муж Анны, отец Сергея и Ольги.'},
  anna: {src:'assets/img/anna-bw.jpg', title:'Анна Соколова', description:'1933-2015. Урождённая Орлова. Соединила две ветви этой семьи.'}
};
const people = {
  nikolay: {name:'Николай Петрович Соколов', years:'1931-2019', bio:'Тридцать лет на мостах, от Урала до Енисея. Дома чинил всё сам. Муж Анны, отец Сергея и Ольги.'},
  anna: {name:'Анна Соколова', years:'1933-2015', bio:'Урождённая Орлова. Дочь Ивана и Евдокии. Соединила две ветви этой семьи. Вместе с Николаем воспитала Сергея и Ольгу.'},
  sergey: {name:'Сергей Соколов', years:'Родился в 1958 году', bio:'Сын Николая и Анны. Играл за «Строитель», потом двадцать лет тренировал мальчишек. Муж Ирины, отец Дмитрия и Ани.'},
  olga: {name:'Ольга Соколова', years:'Родилась в 1962 году', bio:'Дочь Николая и Анны. Выбрала профессию врача. Её дочь Екатерина стала архитектором.'}
};
const photoDialog = document.querySelector('#photo-dialog');
document.querySelectorAll('[data-photo]').forEach(button => {
  button.addEventListener('click', () => {
    const photo = photographs[button.dataset.photo];
    document.querySelector('#full-photo').src = photo.src;
    document.querySelector('#full-photo').alt = photo.description;
    document.querySelector('#photo-dialog-title').textContent = photo.title;
    document.querySelector('#full-photo-description').textContent = photo.description;
    photoDialog.showModal();
  });
});
document.querySelectorAll('[data-filter]').forEach(button => {
  button.addEventListener('click', () => {
    document.querySelectorAll('[data-filter]').forEach(filter => filter.setAttribute('aria-pressed', String(filter === button)));
    document.querySelectorAll('[data-category]').forEach(photo => {
      photo.hidden = button.dataset.filter !== 'all' && photo.dataset.category !== button.dataset.filter;
    });
  });
});
document.querySelectorAll('[data-person]').forEach(button => {
  button.addEventListener('click', () => {
    const person = people[button.dataset.person];
    document.querySelector('#person-dialog-title').textContent = person.name;
    document.querySelector('#person-dialog-years').textContent = person.years;
    document.querySelector('#person-dialog-bio').textContent = person.bio;
    document.querySelector('#person-dialog').showModal();
  });
});
document.querySelectorAll('[data-close-dialog]').forEach(button => {
  button.addEventListener('click', () => button.closest('dialog').close());
});
document.querySelectorAll('dialog').forEach(dialog => {
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const bounds = dialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
  });
});
const memoryDialog = document.querySelector('#memory-dialog');
document.querySelectorAll('[data-add-memory]').forEach(button => button.addEventListener('click', () => memoryDialog.showModal()));
document.querySelector('#memory-form').addEventListener('submit', event => {
  event.preventDefault();
  const nameField = document.querySelector('#memory-name');
  const memoryField = document.querySelector('#memory-text');
  if (!nameField.value.trim() || !memoryField.value.trim()) {
    const field = !nameField.value.trim() ? nameField : memoryField;
    field.setCustomValidity('Напишите текст, используя не только пробелы.');
    field.reportValidity();
    field.addEventListener('input', () => field.setCustomValidity(''), {once:true});
    return;
  }
  document.querySelector('#memory-note blockquote').textContent = memoryField.value.trim();
  document.querySelector('#memory-note>p').textContent = nameField.value.trim();
  document.querySelector('.memory-note__bottom').textContent = 'Ваше воспоминание в этом просмотре';
  memoryDialog.close();
  event.target.reset();
  document.querySelector('#memories').scrollIntoView({behavior:'instant'});
  document.querySelector('.closing [data-add-memory]').focus({preventScroll:true});
  const status = document.querySelector('#status');
  status.textContent = 'Добавлено в демо. Текст сохранится до перезагрузки страницы.';
  status.classList.add('is-visible');
  setTimeout(() => status.classList.remove('is-visible'), 6000);
});
const menuButton = document.querySelector('.nav__toggle');
const navigation = document.querySelector('#navigation');
menuButton.addEventListener('click', () => {
  const isOpen = menuButton.getAttribute('aria-expanded') !== 'true';
  menuButton.setAttribute('aria-expanded', String(isOpen));
  navigation.classList.toggle('is-open', isOpen);
  menuButton.textContent = isOpen ? 'Закрыть' : 'Меню';
});
navigation.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
  menuButton.setAttribute('aria-expanded', 'false');
  navigation.classList.remove('is-open');
  menuButton.textContent = 'Меню';
}));
document.querySelector('#slotsToggle').addEventListener('click', event => {
  const visible = document.body.classList.toggle('show-slots');
  event.currentTarget.setAttribute('aria-pressed', String(visible));
  document.querySelectorAll('[data-slot]').forEach(image => {
    if (visible) image.title = image.dataset.slot;
    else image.removeAttribute('title');
  });
});
