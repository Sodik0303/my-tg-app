// Инициализация Telegram WebApp
const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();

// Цвета под тему Telegram
document.body.style.backgroundColor = tg.themeParams.bg_color || '#0f0f13';

// Элементы
const wishInput = document.getElementById('wish-input');
const planInput = document.getElementById('plan-input');
const wishesList = document.getElementById('wishes-list');
const plansList = document.getElementById('plans-list');
const addWishBtn = document.getElementById('add-wish-btn');
const addPlanBtn = document.getElementById('add-plan-btn');
const tabs = document.querySelectorAll('.tab');
const tabContents = document.querySelectorAll('.tab-content');

// Переключение вкладок
tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tabContents.forEach(c => c.classList.remove('active'));
        
        tab.classList.add('active');
        document.getElementById(tab.dataset.tab).classList.add('active');
    });
});

// Временное хранилище (потом заменим на сервер)
let wishes = JSON.parse(localStorage.getItem('wishes') || '[]');
let plans = JSON.parse(localStorage.getItem('plans') || '[]');

// Отрисовка карточек
function renderWishes() {
    if (wishes.length === 0) {
        wishesList.innerHTML = `
            <div class="empty">
                <div class="empty-icon">🎁</div>
                <div>Вишлист пока пустой</div>
            </div>`;
        return;
    }

    wishesList.innerHTML = wishes.map((item, index) => `
        <div class="card ${item.done ? 'done' : ''}" data-index="${index}">
            <button class="card-check" onclick="toggleWish(${index})">${item.done ? '✓' : ''}</button>
            <div class="card-body">
                <div class="card-text">${escapeHtml(item.text)}</div>
                <div class="card-meta">${item.date || ''}</div>
            </div>
            <button class="card-delete" onclick="deleteWish(${index})">×</button>
        </div>
    `).join('');
}

function renderPlans() {
    if (plans.length === 0) {
        plansList.innerHTML = `
            <div class="empty">
                <div class="empty-icon">📅</div>
                <div>Планов пока нет</div>
            </div>`;
        return;
    }

    plansList.innerHTML = plans.map((item, index) => `
        <div class="card ${item.done ? 'done' : ''}" data-index="${index}">
            <button class="card-check" onclick="togglePlan(${index})">${item.done ? '✓' : ''}</button>
            <div class="card-body">
                <div class="card-text">${escapeHtml(item.text)}</div>
                <div class="card-meta">${item.date || ''}</div>
            </div>
            <button class="card-delete" onclick="deletePlan(${index})">×</button>
        </div>
    `).join('');
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function save() {
    localStorage.setItem('wishes', JSON.stringify(wishes));
    localStorage.setItem('plans', JSON.stringify(plans));
}

// Добавление
function addWish() {
    const text = wishInput.value.trim();
    if (!text) return;

    wishes.unshift({
        text: text,
        done: false,
        date: new Date().toLocaleDateString('ru-RU')
    });
    wishInput.value = '';
    save();
    renderWishes();
    tg.HapticFeedback.impactOccurred('light');
}

function addPlan() {
    const text = planInput.value.trim();
    if (!text) return;

    plans.unshift({
        text: text,
        done: false,
        date: new Date().toLocaleDateString('ru-RU')
    });
    planInput.value = '';
    save();
    renderPlans();
    tg.HapticFeedback.impactOccurred('light');
}

// Действия с карточками
function toggleWish(index) {
    wishes[index].done = !wishes[index].done;
    save();
    renderWishes();
    tg.HapticFeedback.selectionChanged();
}

function togglePlan(index) {
    plans[index].done = !plans[index].done;
    save();
    renderPlans();
    tg.HapticFeedback.selectionChanged();
}

function deleteWish(index) {
    wishes.splice(index, 1);
    save();
    renderWishes();
    tg.HapticFeedback.impactOccurred('medium');
}

function deletePlan(index) {
    plans.splice(index, 1);
    save();
    renderPlans();
    tg.HapticFeedback.impactOccurred('medium');
}

// Обработчики
addWishBtn.addEventListener('click', addWish);
addPlanBtn.addEventListener('click', addPlan);

wishInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addWish();
});
planInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addPlan();
});

// Первая отрисовка
renderWishes();
renderPlans();

// Сообщаем Telegram, что приложение готово
tg.MainButton.hide();