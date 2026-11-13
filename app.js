// Инициализация Telegram WebApp
const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();

// Получаем имя пользователя из Telegram
const user = tg.initDataUnsafe?.user;
const userName = user?.first_name || 'Я';
if (user?.first_name) {
    document.getElementById('greeting').textContent = `Привет, ${user.first_name}! 💕`;
}

// Хранилище данных
let wishes = JSON.parse(localStorage.getItem('wishes') || '[]');
let plans = JSON.parse(localStorage.getItem('plans') || '[]');
let ideas = JSON.parse(localStorage.getItem('ideas') || '[]');

// Переключение вкладок
const tabs = document.querySelectorAll('.tab');
const tabContents = document.querySelectorAll('.tab-content');
let activeTabId = 'wishes-tab';

tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tabContents.forEach(c => c.classList.remove('active'));
        
        tab.classList.add('active');
        activeTabId = tab.dataset.tab;
        document.getElementById(activeTabId).classList.add('active');
        tg.HapticFeedback.selectionChanged();
    });
});

function save() {
    localStorage.setItem('wishes', JSON.stringify(wishes));
    localStorage.setItem('plans', JSON.stringify(plans));
    localStorage.setItem('ideas', JSON.stringify(ideas));
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Форматирование ссылки или цены
function formatExtra(extra) {
    if (!extra) return '';
    const safe = escapeHtml(extra);
    if (safe.startsWith('http://') || safe.startsWith('https://')) {
        return `<div class="card-extra"><a href="${safe}" target="_blank">🔗 Открыть ссылку</a></div>`;
    }
    return `<div class="card-extra">📌 ${safe}</div>`;
}

// Отрисовка Вишлиста
function renderWishes() {
    const list = document.getElementById('wishes-list');
    const doneCount = wishes.filter(i => i.done).length;
    document.getElementById('wishes-stats').textContent = `Подарено: ${doneCount} из ${wishes.length}`;

    if (wishes.length === 0) {
        list.innerHTML = `<div class="empty"><div class="empty-icon">🎁</div><div>Вишлист пока пустой. Добавь первое желание!</div></div>`;
        return;
    }

    list.innerHTML = wishes.map((item, index) => `
        <div class="card ${item.done ? 'done' : ''}">
            <button class="card-check" onclick="toggleItem('wishes', ${index})">${item.done ? '✓' : ''}</button>
            <div class="card-body">
                <div class="card-text">${escapeHtml(item.text)}</div>
                ${formatExtra(item.extra)}
                <div class="card-meta">Добавил(а): ${escapeHtml(item.author || 'Я')} • ${item.date}</div>
            </div>
            <button class="card-delete" onclick="deleteItem('wishes', ${index})">×</button>
        </div>
    `).join('');
}

// Отрисовка Планов
function renderPlans() {
    const list = document.getElementById('plans-list');
    const doneCount = plans.filter(i => i.done).length;
    document.getElementById('plans-stats').textContent = `Выполнено: ${doneCount} из ${plans.length}`;

    if (plans.length === 0) {
        list.innerHTML = `<div class="empty"><div class="empty-icon">📅</div><div>Планов пока нет. Куда сходим?</div></div>`;
        return;
    }

    list.innerHTML = plans.map((item, index) => `
        <div class="card ${item.done ? 'done' : ''}">
            <button class="card-check" onclick="toggleItem('plans', ${index})">${item.done ? '✓' : ''}</button>
            <div class="card-body">
                <div class="card-text">${escapeHtml(item.text)}</div>
                ${formatExtra(item.extra)}
                <div class="card-meta">Автор: ${escapeHtml(item.author || 'Я')} • ${item.date}</div>
            </div>
            <button class="card-delete" onclick="deleteItem('plans', ${index})">×</button>
        </div>
    `).join('');
}

// Отрисовка Идей
function renderIdeas() {
    const list = document.getElementById('ideas-list');
    document.getElementById('ideas-stats').textContent = `В копилке: ${ideas.length}`;

    if (ideas.length === 0) {
        list.innerHTML = `<div class="empty"><div class="empty-icon">🎬</div><div>Добавь фильм на вечер или идею для свидания</div></div>`;
        return;
    }

    list.innerHTML = ideas.map((item, index) => `
        <div class="card ${item.done ? 'done' : ''}">
            <button class="card-check" onclick="toggleItem('ideas', ${index})">${item.done ? '✓' : ''}</button>
            <div class="card-body">
                <div class="card-text">${escapeHtml(item.text)}</div>
                <div class="card-extra">${escapeHtml(item.extra)}</div>
                <div class="card-meta">${escapeHtml(item.author || 'Я')} • ${item.date}</div>
            </div>
            <button class="card-delete" onclick="deleteItem('ideas', ${index})">×</button>
        </div>
    `).join('');
}

function renderAll() {
    renderWishes();
    renderPlans();
    renderIdeas();
}

// Добавление элементов
function addNewItem(type) {
    const today = new Date().toLocaleDateString('ru-RU');
    if (type === 'wishes') {
        const input = document.getElementById('wish-input');
        const meta = document.getElementById('wish-meta');
        if (!input.value.trim()) return;
        wishes.unshift({ text: input.value.trim(), extra: meta.value.trim(), author: userName, done: false, date: today });
        input.value = '';
        meta.value = '';
    } else if (type === 'plans') {
        const input = document.getElementById('plan-input');
        const meta = document.getElementById('plan-meta');
        if (!input.value.trim()) return;
        plans.unshift({ text: input.value.trim(), extra: meta.value.trim(), author: userName, done: false, date: today });
        input.value = '';
        meta.value = '';
    } else if (type === 'ideas') {
        const input = document.getElementById('idea-input');
        const cat = document.getElementById('idea-category');
        if (!input.value.trim()) return;
        ideas.unshift({ text: input.value.trim(), extra: cat.value, author: userName, done: false, date: today });
        input.value = '';
    }
    save();
    renderAll();
    tg.HapticFeedback.impactOccurred('light');
}

// Переключение статуса и удаление
window.toggleItem = function(type, index) {
    const map = { wishes, plans, ideas };
    map[type][index].done = !map[type][index].done;
    save();
    renderAll();
    tg.HapticFeedback.selectionChanged();
};

window.deleteItem = function(type, index) {
    const map = { wishes, plans, ideas };
    map[type].splice(index, 1);
    save();
    renderAll();
    tg.HapticFeedback.impactOccurred('medium');
};

// Случайный выбор идеи
document.getElementById('random-idea-btn').addEventListener('click', () => {
    const activeIdeas = ideas.filter(i => !i.done);
    if (activeIdeas.length === 0) {
        tg.showAlert('Добавьте хотя бы одну невыполненную идею в список!');
        return;
    }
    const random = activeIdeas[Math.floor(Math.random() * activeIdeas.length)];
    document.getElementById('random-result-text').textContent = random.text;
    document.getElementById('random-result-cat').textContent = random.extra;
    document.getElementById('random-modal').classList.remove('hidden');
    tg.HapticFeedback.notificationOccurred('success');
});

document.getElementById('close-modal-btn').addEventListener('click', () => {
    document.getElementById('random-modal').classList.add('hidden');
});

// Отправка списка в чат Telegram
document.getElementById('share-btn').addEventListener('click', () => {
    let text = '💕 Наш список из Семейного бота:\n\n';
    if (activeTabId === 'wishes-tab') {
        text += '🎁 Вишлист:\n' + (wishes.map(w => `${w.done ? '✅' : '▫️'} ${w.text}${w.extra ? ` (${w.extra})` : ''}`).join('\n') || 'Пока пусто');
    } else if (activeTabId === 'plans-tab') {
        text += '📅 Наши планы:\n' + (plans.map(p => `${p.done ? '✅' : '▫️'} ${p.text}${p.extra ? ` (${p.extra})` : ''}`).join('\n') || 'Пока пусто');
    } else {
        text += '🎬 Идеи для нас:\n' + (ideas.map(i => `${i.done ? '✅' : '▫️'} ${i.text} [${i.extra}]`).join('\n') || 'Пока пусто');
    }
    const shareUrl = `https://t.me{encodeURIComponent('https://t.me')}&text=${encodeURIComponent(text)}`;
    tg.openTelegramLink(shareUrl);
});

// Привязка кнопок добавления
document.getElementById('add-wish-btn').addEventListener('click', () => addNewItem('wishes'));
document.getElementById('add-plan-btn').addEventListener('click', () => addNewItem('plans'));
document.getElementById('add-idea-btn').addEventListener('click', () => addNewItem('ideas'));

// Первый запуск
renderAll();
tg.MainButton.hide();
