// ===== Инициализация =====
const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();
const userName = tg.initDataUnsafe?.user?.first_name || 'Я';

// Приветствие
function getGreeting() {
    const h = new Date().getHours();
    let word = h >= 5 && h < 12 ? 'Доброе утро' : h >= 12 && h < 18 ? 'Добрый день' : h >= 18 && h < 23 ? 'Добрый вечер' : 'Доброй ночи';
    return userName !== 'Я' ? `${word}, ${userName}! 💕` : `${word}! 💕`;
}
document.getElementById('greeting').textContent = getGreeting();

// Хранилище
let wishes = JSON.parse(localStorage.getItem('wishes') || '[]');
let plans = JSON.parse(localStorage.getItem('plans') || '[]');
let ideas = JSON.parse(localStorage.getItem('ideas') || '[]');
let startDate = localStorage.getItem('startDate') || '';
let loveCount = parseInt(localStorage.getItem('loveCount') || '0', 10);
let streak = parseInt(localStorage.getItem('streak') || '0', 10);
let lastVisit = localStorage.getItem('lastVisit') || '';

// Записки
const notes = [
    "Ты делаешь этот мир намного лучше, просто находясь в нём.",
    "Я обожаю, как ты улыбаешься, когда думаешь, что я не вижу.",
    "С тобой даже скучные дела становятся приключением.",
    "Ты — мой самый любимый человек на планете.",
    "Спасибо, что ты рядом. Я самый счастливый.",
    "Я скучаю по тебе, даже если не видел всего час.",
    "Ты самая красивая, когда сонная и лохматая утром.",
    "Мне очень повезло, что именно ты — моя девушка."
];

// ===== Логика стрика =====
function updateStreak() {
    const today = new Date().toDateString();
    if (lastVisit !== today) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        
        if (lastVisit === yesterday.toDateString()) {
            streak++; // Заходили вчера
        } else if (lastVisit !== '') {
            streak = 1; // Пропустили день или зашли впервые за долгое время
        } else {
            streak = 1; // Первый визит
        }
        lastVisit = today;
        save();
    }
    document.getElementById('streak-days').textContent = streak;
}

// ===== Сохранение =====
function save() {
    localStorage.setItem('wishes', JSON.stringify(wishes));
    localStorage.setItem('plans', JSON.stringify(plans));
    localStorage.setItem('ideas', JSON.stringify(ideas));
    localStorage.setItem('startDate', startDate);
    localStorage.setItem('loveCount', loveCount);
    localStorage.setItem('streak', streak);
    localStorage.setItem('lastVisit', lastVisit);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
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
    if (!startDate) { daysEl.textContent = '—'; return; }
    const days = Math.floor((new Date() - new Date(startDate)) / (1000 * 60 * 60 * 24));
    daysEl.textContent = days >= 0 ? days : 0;
}

document.getElementById('edit-together-btn').addEventListener('click', (e) => {
    e.stopPropagation();
    document.getElementById('start-date-input').value = startDate || '';
    document.getElementById('date-modal').classList.remove('hidden');
});
document.getElementById('save-date-btn').addEventListener('click', () => {
    startDate = document.getElementById('start-date-input').value;
    save(); renderTogether();
    document.getElementById('date-modal').classList.add('hidden');
    tg.HapticFeedback?.notificationOccurred('success');
});
document.getElementById('cancel-date-btn').addEventListener('click', () => document.getElementById('date-modal').classList.add('hidden'));

// ===== Кнопка Любви =====
const loveBtn = document.getElementById('love-btn');
document.getElementById('love-count').textContent = loveCount;

loveBtn.addEventListener('click', () => {
    loveCount++;
    document.getElementById('love-count').textContent = loveCount;
    save();
    tg.HapticFeedback?.impactOccurred('medium');

    const rect = loveBtn.getBoundingClientRect();
    for (let i = 0; i < 5; i++) {
        setTimeout(() => {
            const heart = document.createElement('div');
            heart.className = 'floating-heart';
            heart.textContent = ['❤️', '💖', '💕', '💗', '✨'][Math.floor(Math.random() * 5)];
            heart.style.left = (rect.left + Math.random() * rect.width) + 'px';
            heart.style.top = (rect.top - 10) + 'px';
            document.body.appendChild(heart);
            setTimeout(() => heart.remove(), 1300);
        }, i * 100);
    }
});

// ===== Записки =====
document.getElementById('note-btn').addEventListener('click', () => {
    const randomNote = notes[Math.floor(Math.random() * notes.length)];
    document.getElementById('note-text').textContent = `«${randomNote}»`;
    document.getElementById('note-modal').classList.remove('hidden');
    tg.HapticFeedback?.notificationOccurred('success');
});
document.getElementById('close-note-btn').addEventListener('click', () => document.getElementById('note-modal').classList.add('hidden'));

// ===== Отрисовка карточек =====
function getCatName(cat) {
    if (cat === 'movie') return '🎬 Кино';
    if (cat === 'food') return '🍕 Еда';
    return '✨ Свидание';
}

function renderWishes() {
    const list = document.getElementById('wishes-list');
    const done = wishes.filter(i => i.done).length;
    document.getElementById('wishes-stats').textContent = `${done} из ${wishes.length} подарено`;
    const pct = wishes.length ? Math.round((done / wishes.length) * 100) : 0;
    document.getElementById('wishes-progress').style.width = pct + '%';
    document.getElementById('wishes-progress-label').textContent = pct + '%';

    if (!wishes.length) return list.innerHTML = `<div class="empty"><div class="empty-icon">🎁</div><div>Вишлист пустой.</div></div>`;
    
    list.innerHTML = wishes.map((item, index) => `
        <div class="card ${item.done ? 'done' : ''}">
            <button class="card-check" onclick="toggleItem('wishes', ${index})">${item.done ? '✓' : ''}</button>
            <div class="card-body">
                <div class="card-text">${escapeHtml(item.text)}</div>
                ${item.extra ? `<div class="card-extra">${escapeHtml(item.extra)}</div>` : ''}
                <div class="card-meta">${escapeHtml(item.author)} • ${item.date}</div>
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

    if (!plans.length) return list.innerHTML = `<div class="empty"><div class="empty-icon">📅</div><div>Планов пока нет.</div></div>`;
    
    list.innerHTML = plans.map((item, index) => {
        let timerHtml = '';
        // Логика таймера
        if (item.extra && item.extra !== 'Без даты') {
            const diff = new Date(item.extra) - new Date().setHours(0,0,0,0);
            const daysLeft = Math.ceil(diff / (1000 * 60 * 60 * 24));
            if (!item.done) {
                if (daysLeft === 0) timerHtml = `<div class="timer-badge">🔥 Это сегодня!</div>`;
                else if (daysLeft === 1) timerHtml = `<div class="timer-badge">⏳ Завтра</div>`;
                else if (daysLeft > 1) timerHtml = `<div class="timer-badge">⏳ Через ${daysLeft} дн.</div>`;
            }
        }
        return `
        <div class="card ${item.done ? 'done' : ''}">
            <button class="card-check" onclick="toggleItem('plans', ${index})">${item.done ? '✓' : ''}</button>
            <div class="card-body">
                <div class="card-text">${escapeHtml(item.text)}</div
