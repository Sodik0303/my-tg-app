
const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();

const user = tg.initDataUnsafe?.user;
const userName = user?.first_name || 'Я';

// Приветствие по времени суток
function getGreeting() {
    const h = new Date().getHours();
    let word = 'Привет';
    if (h >= 5 && h < 12) word = 'Доброе утро';
    else if (h >= 12 && h < 18) word = 'Добрый день';
    else if (h >= 18 && h < 23) word = 'Добрый вечер';
    else word = 'Доброй ночи';
    return user?.first_name ? `${word}, ${user.first_name}! 💕` : `${word}! 💕`;
}
document.getElementById('greeting').textContent = getGreeting();

// ===== Хранилище =====
let wishes = JSON.parse(localStorage.getItem('wishes') || '[]');
let plans = JSON.parse(localStorage.getItem('plans') || '[]');
let ideas = JSON.parse(localStorage.getItem('ideas') || '[]');
let startDate = localStorage.getItem('startDate') || '';
let loveCount = parseInt(localStorage.getItem('loveCount') || '0', 10);

function save() {
    localStorage.setItem('wishes', JSON.stringify(wishes));
    localStorage.setItem('plans', JSON.stringify(plans));
    localStorage.setItem('ideas', JSON.stringify(ideas));
    localStorage.setItem('startDate', startDate);
    localStorage.setItem('loveCount', loveCount);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatExtra(extra) {
    if (!extra) return '';
    const safe = escapeHtml(extra);
    if (safe.startsWith('http://') || safe.startsWith('https://')) {
        return `<div class="card-extra"><a href="${safe}" target="_blank">🔗 Открыть ссылку</a></div>`;
    }
    return `<div class="card-extra">📌 ${safe}</div>`;
}

// ===== Вкладки =====
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
        tg.HapticFeedback?.selectionChanged();
    });
});

// ===== Дни вместе =====
function renderTogether() {
    const daysEl = document.getElementById('days-together');
    if (!startDate) {
        daysEl.textContent = '—';
        return;
    }
    const start = new Date(startDate);
    const now = new Date();
    const days = Math.floor((now - start) / (1000 * 60 * 60 * 24));
    daysEl.textContent = days >= 0 ? days : 0;
}

document.getElementById('edit-together-btn').addEventListener('click', () => {
    document.getElementById('start-date-input').value = startDate || '';
    document.getElementById('date-modal').classList.remove('hidden');
});
document.getElementById('save-date-btn').addEventListener('click', () => {
    startDate = document.getElementById('start-date-input').value;
    save();
    renderTogether();
    document.getElementById('date-modal').classList.add('hidden');
    tg.HapticFeedback?.notificationOccurred('success');
});
document.getElementById('cancel-date-btn').addEventListener('click', () => {
    document.getElementById('date-modal').classList.add('hidden');
});

// ===== Кнопка "люблю" =====
const loveBtn = document.getElementById('love-btn');
const loveCountEl = document.getElementById('love-count');
loveCountEl.textContent = loveCount;

loveBtn.addEventListener('click', (e) => {
    loveCount++;
    loveCountEl.textContent = loveCount;
    save();
    tg.HapticFeedback?.impactOccurred('medium');

    // Сердечки
    const rect = loveBtn.getBoundingClientRect();
    for (let i = 0; i < 4; i++) {
        const heart = document.createElement('div');
        heart.className = 'floating-heart';
        heart.textContent = ['❤️', '💖', '💕', '💗'][Math.floor(Math.random() * 4)];
        heart.style.left = (rect.left + Math.random() * rect.width) + 'px';
        heart.style.top = (rect.top - 10) + 'px';
        document.body.appendChild(heart);
        setTimeout(() => heart.remove(), 1300);
    }
});

// ===== Отрисовка =====
function renderWishes() {
    const list = document.getElementById('wishes-list');
    const done = wishes.filter(i => i.done).length;
    document.getElementById('wishes-stats').textContent = `${done} из ${wishes.length} подарено`;
    const pct = wishes.length ? Math.round((done / wishes.length) * 100) : 0;
    document.getElementById('wishes-progress').style.width = pct + '%';
    document.getElementById('wishes-progress-label').textContent = pct + '%';

    if (wishes.length === 0) {
        list.innerHTML = `<div class="empty"><div class="empty-icon">🎁</div><div>Вишлист пустой. Добавь первое желание!</div></div>`;
        return;
    }
    list.innerHTML = wishes.map((item, index) => `
        <div class="card ${item.done ? 'done' : ''}">
            <button class="card-check" onclick="toggleItem('wishes', ${index})">${item.done ? '✓' : ''}</button>
            <div class="card-body">
                <div class="card-text">${escapeHtml(item.text)}</div>
                ${formatExtra(item.extra)}
                <div class="card-meta">${escapeHtml(item.author || 'Я')} • ${item.date}</div>
            </div>
            <button class="card-delete" onclick="deleteItem('wishes', ${index})">×</button>
        </div>
    `).join('');
}

function renderPlans() {
    const list = document.getElementById('plans-list');
    const done = plans.filter(i => i.done).length;
    document.getElementById('plans-stats').textContent = `${done} из ${plans.length} выполнено`;
    const pct = plans.length ? Math.round((done / plans.length) * 100) : 0;
    document.getElementById('plans-progress').style.width = pct + '%';
    document.getElementById('plans-progress-label').textContent = pct + '%';

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
                <div class="card-meta">${escapeHtml(item.author || 'Я')} • ${item.date}</div>
            </div>
            <button class="card-delete" onclick="deleteItem('plans', ${index})">×</button>
        </div>
    `).join('');
}

function renderIdeas() {
    const list = document.getElementById('ideas-list');
    document.getElementById('ideas-stats').textContent = `Идей: ${ideas.length}`;

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
    renderTogether();
}

// ===== Добавление =====
function addNewItem(type) {
    const today = new Date().toLocaleDateString('ru-RU');
    if (type === 'wishes') {
        const input = document.getElementById('wish-input');
        const meta = document.getElementById('wish-meta');
        if (!input.value.trim()) return;
        wishes.unshift({ text: input.value.trim(), extra: meta.value.trim(), author: userName, done: false, date: today });
        input.value = ''; meta.value = '';
    } else if (type === 'plans') {
        const input = document.getElementById('plan-input');
        const meta = document.getElementById('plan-meta');
        if (!input.value.trim()) return;
        plans.unshift({ text: input.value.trim(), extra: meta.value.trim(), author: userName, done: false, date: today });
        input.value = ''; meta.value = '';
    } else if (type === 'ideas') {
        const input = document.getElementById('idea-input');
        const cat = document.getElementById('idea-category');
        if (!input.value.trim()) return;
        ideas.unshift({ text: input.value.trim(), extra: cat.value, author: userName, done: false, date: today });
        input.value = '';
    }
    save();
    renderAll();
    tg.HapticFeedback?.impactOccurred('light');
}

// ===== Переключение / удаление =====
window.toggleItem = function(type, index) {
    const map = { wishes, plans, ideas };
    map[type][index].done = !map[type][index].done;
    save();
    renderAll();
    tg.HapticFeedback?.selectionChanged();
};

window.deleteItem = function(type, index) {
    const map = { wishes, plans, ideas };
    map[type].splice(index, 1);
    save();
    renderAll();
    tg.HapticFeedback?.impactOccurred('medium');
};

// ===== Случайная идея =====
document.getElementById('random-idea-btn').addEventListener('click', () => {
    const active = ideas.filter
