// ===== Инициализация Telegram =====
const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();
const user = tg.initDataUnsafe?.user;
const userName = user?.first_name || 'Я';

// ID комнаты
const roomId = 'our_super_secret_room_2026'; 

// ПРОВЕРКА ПОДДЕРЖКИ ОБЛАКА
const isCloudSupported = tg.isVersionAtLeast('6.9') && tg.CloudStorage;

// Приветствие
function getGreeting() {
    const h = new Date().getHours();
    let word = h >= 5 && h < 12 ? 'Доброе утро' : h >= 12 && h < 18 ? 'Добрый день' : h >= 18 && h < 23 ? 'Добрый вечер' : 'Доброй ночи';
    return user?.first_name ? `${word}, ${user.first_name}! 💕` : `${word}! 💕`;
}
document.getElementById('greeting').textContent = getGreeting();

// Базовые переменные
let wishes = [];
let plans = [];
let ideas = [];
let startDate = '';
let loveCount = 0;
let streak = 0;
let lastVisit = localStorage.getItem('lastVisit') || '';

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

// ===== СИНХРОНИЗАЦИЯ И СОХРАНЕНИЕ =====

function save() {
    const data = { wishes, plans, ideas, startDate, loveCount, streak, lastVisit };
    const json = JSON.stringify(data);
    
    // Всегда сохраняем локально
    localStorage.setItem('appData', json);
    
    // Если облако поддерживается, сохраняем и туда
    if (isCloudSupported) {
        tg.CloudStorage.setItem(roomId, json, (err) => {
            if (err) console.error('Ошибка сохранения в облако:', err);
        });
    }
}

function loadInitialData(callback) {
    // Если облако не поддерживается — берем только локальные данные
    if (!isCloudSupported) {
        console.warn('CloudStorage не поддерживается. Работаем локально.');
        const local = localStorage.getItem('appData');
        if (local) parseData(local);
        if (callback) callback();
        return;
    }

    // Если поддерживается — берем из облака
    tg.CloudStorage.getItem(roomId, (err, value) => {
        if (!err && value) {
            parseData(value);
        } else {
            const local = localStorage.getItem('appData');
            if (local) parseData(local);
        }
        if (callback) callback();
    });
}

function parseData(json) {
    try {
        const data = JSON.parse(json);
        wishes = data.wishes || [];
        plans = data.plans || [];
        ideas = data.ideas || [];
        startDate = data.startDate || '';
        loveCount = data.loveCount || 0;
        streak = data.streak || 0;
        if (data.lastVisit) lastVisit = data.lastVisit;
        
        document.getElementById('love-count').textContent = loveCount;
        document.getElementById('streak-days').textContent = streak;
    } catch (e) {
        console.error('Ошибка парсинга данных', e);
    }
}

// Фоновая синхронизация
let isSyncing = false;
function syncBackground() {
    if (isSyncing || !isCloudSupported) return;
    isSyncing = true;
    
    tg.CloudStorage.getItem(roomId, (err, value) => {
        isSyncing = false;
        if (!err && value) {
            const currentLocal = localStorage.getItem('appData');
            if (value !== currentLocal) {
                try {
                    const data = JSON.parse(value);
                    wishes = data.wishes || [];
                    plans = data.plans || [];
                    ideas = data.ideas || [];
                    startDate = data.startDate || '';
                    loveCount = data.loveCount || 0;
                    streak = data.streak || 0;
                    
                    localStorage.setItem('appData', value);
                    document.getElementById('love-count').textContent = loveCount;
                    document.getElementById('streak-days').textContent = streak;
                    renderAll();
                } catch (e) {}
            }
        }
    });
}

// ===== ОТРИСОВКА И ЛОГИКА =====

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function getCatName(cat) {
    if (cat === 'movie') return '🎬 Кино';
    if (cat === 'food') return '🍕 Еда';
    return '✨ Свидание';
}

function updateStreak() {
    const today = new Date().toDateString();
    if (lastVisit !== today) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        if (lastVisit === yesterday.toDateString()) streak++;
        else streak = 1;
        lastVisit = today;
        save();
    }
    document.getElementById('streak-days').textContent = streak;
}

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
        window.scrollTo({ top: 0, behavior: 'smooth' });
        tg.HapticFeedback?.selectionChanged();
    });
});

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

document.getElementById('cancel-date-btn').addEventListener('click', () => {
    document.getElementById('date-modal').classList.add('hidden');
});

const loveBtn = document.getElementById('love-btn');
document.getElementById('love-count').textContent = loveCount;

loveBtn.addEventListener('click', () => {
    loveCount++;
    document.getElementById('love-count').textContent = loveCount;
    save();
    tg.HapticFeedback?.impactOccurred('medium');

    const rect = loveBtn.getBoundingClientRect();
    for (let i = 0; i < 6; i++) {
        setTimeout(() => {
            const heart = document.createElement('div');
            heart.className = 'floating-heart';
            heart.textContent = ['❤️', '💖', '💕', '💗', '✨'][Math.floor(Math.random() * 5)];
            heart.style.left = (rect.left + Math.random() * rect.width) + 'px';
            heart.style.top = (rect.top - 10) + 'px';
            document.body.appendChild(heart);
            setTimeout(() => heart.remove(), 1400);
        }, i * 80);
    }
});

document.getElementById('note-btn').addEventListener('click', () => {
    const randomNote = notes[Math.floor(Math.random() * notes.length)];
    document.getElementById('note-text').textContent = `«${randomNote}»`;
    document.getElementById('note-modal').classList.remove('hidden');
    tg.HapticFeedback?.notificationOccurred('success');
});

document.getElementById('close-note-btn').addEventListener('click', () => {
    document.getElementById('note-modal').classList.add('hidden');
});

function renderWishes() {
    const list = document.getElementById('wishes-list');
    const done = wishes.filter(i => i.done).length;
    document.getElementById('wishes-stats').textContent = `${done} из ${wishes.length} подарено`;
    const pct = wishes.length ? Math.round((done / wishes.length) * 100) : 0;
    document.getElementById('wishes-progress').style.width = pct + '%';
    document.getElementById('wishes-progress-label').textContent = pct + '%';

    if (!wishes.length) {
        list.innerHTML = `<div class="empty"><div class="empty-icon">🎁</div><div>Вишлист пустой.</div></div>`;
        return;
    }
    
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

    if (!plans.length) {
        list.innerHTML = `<div class="empty"><div class="empty-icon">📅</div><div>Планов пока нет.</div></div>`;
        return;
    }
    
    list.innerHTML = plans.map((item, index) => {
        let timerHtml = '';
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
                <div class="card-text">${escapeHtml(item.text)}</div>
                ${item.extra && item.extra !== 'Без даты' ? `<div class="card-meta">📅 ${item.extra}</div>` : ''}
                ${timerHtml}
                <div class="card-meta">${escapeHtml(item.author)} • ${item.date}</div>
            </div>
            <button class="card-delete" onclick="deleteItem('plans', ${index})">×</button>
        </div>
        `;
    }).join('');
}

function renderIdeas() {
    const list = document.getElementById('ideas-list');
    document.getElementById('ideas-stats').textContent = `Идей: ${ideas.length}`;

    if (!ideas.length) {
        list.innerHTML = `<div class="empty"><div class="empty-icon">🎬</div><div>Добавь фильм или идею.</div></div>`;
        return;
    }
    
    list.innerHTML = ideas.map((item, index) => {
        const catClass = `cat-${item.extra}`;
        return `
        <div class="card ${item.done ? 'done' : ''} ${catClass}">
            <button class="card-check" onclick="toggleItem('ideas', ${index})">${item.done ? '✓' : ''}</button>
            <div class="card-body">
                <div class="card-text">${escapeHtml(item.text)}</div>
                <div class="card-extra">${getCatName(item.extra)}</div>
                <div class="card-meta">${escapeHtml(item.author)} • ${item.date}</div>
            </div>
            <button class="card-delete" onclick="deleteItem('ideas', ${index})">×</button>
        </div>
        `;
    }).join('');
}

function renderAll() {
    renderWishes();
    renderPlans();
    renderIdeas();
    renderTogether();
}

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
        plans.unshift({ text: input.value.trim(), extra: meta.value || 'Без даты', author: userName, done: false, date: today });
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

document.getElementById('random-idea-btn').addEventListener('click', () => {
    const active = ideas.filter(i => !i.done);
    if (!active.length) return tg.showAlert('Добавьте хотя бы одну невыполненную идею!');
    const random = active[Math.floor(Math.random() * active.length)];
    document.getElementById('random-result-text').textContent = random.text;
    document.getElementById('random-result-cat').textContent = getCatName(random.extra);
    document.getElementById('random-modal').classList.remove('hidden');
    tg.HapticFeedback?.notificationOccurred('success');
});

document.getElementById('close-modal-btn').addEventListener('click', () => {
    document.getElementById('random-modal').classList.add('hidden');
});

document.getElementById('add-wish-btn').addEventListener('click', () => addNewItem('wishes'));
document.getElementById('add-plan-btn').addEventListener('click', () => addNewItem('plans'));
document.getElementById('add-idea-btn').addEventListener('click', () => addNewItem('ideas'));

document.getElementById('export-btn').addEventListener('click', () => {
    const data = { wishes, plans, ideas, startDate, loveCount, streak };
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'our_data.json'; a.click();
});

document.getElementById('import-btn').addEventListener('click', () => document.getElementById('import-file').click());
document.getElementById('import-file').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const data = JSON.parse(event.target.result);
            if (data.wishes) wishes = data.wishes;
            if (data.plans) plans = data.plans;
            if (data.ideas) ideas = data.ideas;
            if (data.startDate) startDate = data.startDate;
            if (data.loveCount) loveCount = data.loveCount;
            if (data.streak) streak = data.streak;
            save(); renderAll();
            document.getElementById('love-count').textContent = loveCount;
            document.getElementById('streak-days').textContent = streak;
            tg.showAlert('Данные успешно загружены!');
        } catch (err) {
            tg.showAlert('Ошибка при чтении файла');
        }
    };
    reader.readAsText(file);
});

// ===== ЗАПУСК ПРИЛОЖЕНИЯ =====
loadInitialData(() => {
    updateStreak();
    renderAll();
    document.getElementById('love-count').textContent = loveCount;
    
    // Синхронизация только если облако поддерживается
    if (isCloudSupported) {
        setInterval(syncBackground, 5000);
    } else {
        // Если облако не работает, выводим предупреждение (можно убрать)
        setTimeout(() => {
            tg.showAlert('Внимание! Вы открываете приложение в старой версии Telegram. Синхронизация между устройствами недоступна. Пожалуйста, обновите Telegram до последней версии.');
        }, 1000);
    }
});
