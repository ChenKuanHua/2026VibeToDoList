// --- Audio Context Settings (Ping Sound) ---
const playPing = () => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.5);
    gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.5);
  } catch (e) {
    console.log('Audio not supported or blocked', e);
  }
};

// --- Constants & Data ---
const STRETCHES = [
  { name: '上斜方肌伸展', description: '右手輕壓左側頭部向右傾斜，感受左側頸部伸展，維持30秒後換邊。能舒緩久坐肩頸僵硬。' },
  { name: '胸大肌伸展', description: '找一面牆或門框，單手呈90度貼住，身體微轉向反方向。感受胸部前方拉展。' },
  { name: '坐姿梨狀肌伸展', description: '坐在椅子上，將右腳踝放在左膝上方，腰挺直並微向前傾。舒緩臀部緊繃。' },
  { name: '背部與闊背肌伸展', description: '雙手交扣向前推，背部向後拱起低頭，感受背部肌肉拉伸。' },
  { name: '頸部輕度活動', description: '下巴微收，頭部緩慢向左右兩側旋轉，不要過度用力，放鬆頸椎壓力。' }
];

const PRESETS = [
  { label: '經典 25/5', work: 25, break: 5 },
  { label: '長時 50/10', work: 50, break: 10 },
  { label: '短衝刺 15/3', work: 15, break: 3 }
];

// --- Global State ---
let activePreset = PRESETS[0];
let pomoMode = 'work';
let pomoTimeLeft = activePreset.work * 60;
let pomoIsRunning = false;
let currentStretch = null;
let tasks = [];
let viewMode = 'list';
let taskFilter = 'active';
let sortMode = 'smart';
let timerInterval = null;
let lastTickTime = Date.now();
let currentUserName = '';

// --- DOM Elements (Placeholder) ---
const safeGet = (id) => document.getElementById(id);
let pomodoroBar, pomoProgressBg, pomoTitle, presetSelector, timeText, pomoToggleBtn, stretchBanner, stretchName, stretchDesc, breakBanner;
let taskCount, viewListBtn, viewMatrixBtn, addTaskForm, newTaskTitle, newTaskDate, newTaskImportant, newTaskUrgent, addBtn;
let taskListView, taskMatrixView, q1Tasks, q2Tasks, q3Tasks, q4Tasks;
let authBtn, userGreeting, syncBanner, syncText, syncIcon, sheetLinkBtn;

// --- Task Initialization ---
(function initTasksData() {
    try {
        const local = localStorage.getItem('vibeTasks');
        if (local) {
            const parsed = JSON.parse(local);
            if (Array.isArray(parsed) && parsed.length > 0) {
                tasks = parsed;
                return;
            }
        }
    } catch (e) { console.error('initTasks error', e); }
    
    tasks = [{ 
        id: Date.now().toString(), 
        title: '規劃今日工作', 
        completed: false, 
        timeElapsed: 0, 
        isRunning: false,
        dueDate: new Date().toISOString().split('T')[0],
        isImportant: true,
        isUrgent: true
    }];
})();

// --- Formatting Utils ---
function formatTimeText(totalSeconds) {
  const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
  const s = (totalSeconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function formatDuration(totalSeconds) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function isWithinThreeDays(dateStr) {
  if (!dateStr) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const targetDate = new Date(dateStr);
  targetDate.setHours(0, 0, 0, 0);
  const diffDays = Math.ceil((targetDate - today) / (1000 * 60 * 60 * 24)); 
  return diffDays <= 3;
}

function checkIsUrgent(isUrgentState, dueDate) {
  if (isUrgentState) return true;
  if (dueDate && isWithinThreeDays(dueDate)) return true;
  return false;
}

// --- Timer Logic ---
function startTimerLoop() {
  if (timerInterval) clearInterval(timerInterval);
  lastTickTime = Date.now();
  timerInterval = setInterval(() => {
    const hasRunningTimer = pomoIsRunning || tasks.some(t => t.isRunning);
    if (!hasRunningTimer) {
      clearInterval(timerInterval);
      timerInterval = null;
      return;
    }
    const now = Date.now();
    const delta = Math.floor((now - lastTickTime) / 1000);
    if (delta > 0) {
      lastTickTime = now;
      tick(delta);
    }
  }, 1000);
}

function tick(deltaSeconds) {
  let timerEnded = false;
  if (pomoIsRunning) {
    pomoTimeLeft -= deltaSeconds;
    if (pomoTimeLeft <= 0) timerEnded = true;
  }
  const isBreakActive = pomoMode === 'break' && pomoIsRunning;
  if (!isBreakActive) {
    tasks.forEach(t => { if (t.isRunning) t.timeElapsed += deltaSeconds; });
  }
  if (timerEnded) {
    playPing();
    handlePomoComplete();
    render();
  } else {
    updateTimesOnly();
  }
}

function handlePomoComplete() {
  if (pomoMode === 'work') {
    pomoMode = 'break';
    pomoTimeLeft = activePreset.break * 60;
    currentStretch = STRETCHES[Math.floor(Math.random() * STRETCHES.length)];
  } else {
    pomoMode = 'work';
    pomoTimeLeft = activePreset.work * 60;
    pomoIsRunning = false;
    currentStretch = null;
  }
  saveAndSyncTasks();
}

const togglePomo = () => {
    try { new (window.AudioContext || window.webkitAudioContext)().resume(); } catch(e){}
    pomoIsRunning = !pomoIsRunning;
    if (pomoIsRunning && !timerInterval) startTimerLoop();
    render();
};

const resetPomo = () => { pomoIsRunning = false; pomoMode = 'work'; pomoTimeLeft = activePreset.work * 60; currentStretch = null; render(); };

// --- Task Actions ---
function addTask() {
    console.log("Adding task...");
    const title = newTaskTitle ? newTaskTitle.value.trim() : '';
    console.log("Title:", title);
    if (!title) return;

    tasks.push({
        id: Date.now().toString(),
        title,
        completed: false,
        timeElapsed: 0,
        isRunning: false,
        dueDate: newTaskDate.value,
        isImportant: newTaskImportant.checked,
        isUrgent: newTaskUrgent.checked
    });

    newTaskTitle.value = '';
    newTaskDate.value = '';
    newTaskImportant.checked = false;
    newTaskUrgent.checked = false;
    
    render();
    saveAndSyncTasks();
}

const removeTask = (id) => { tasks = tasks.filter(t => t.id !== id); render(); saveAndSyncTasks(); };
const toggleTaskComplete = (id) => { tasks = tasks.map(t => t.id === id ? { ...t, completed: !t.completed, isRunning: !t.completed ? false : t.isRunning } : t); render(); saveAndSyncTasks(); };
const toggleTaskTimer = (id) => { tasks = tasks.map(t => t.id === id ? { ...t, isRunning: !t.isRunning } : t); if (tasks.some(t => t.isRunning) && !timerInterval) startTimerLoop(); render(); saveAndSyncTasks(); };

// --- Rendering ---
let editingTaskId = null;

function renderTaskItem(task, isMatrix = false) {
    const isUrgentComputed = checkIsUrgent(task.isUrgent, task.dueDate);
    const div = document.createElement('div');
    div.className = `task-item task-enter ${isMatrix ? 'matrix-item' : ''} ${task.completed ? 'completed' : ''} ${task.isRunning ? 'running' : ''}`;
    div.dataset.id = task.id;

    if (editingTaskId === task.id) {
        div.innerHTML = `
            <div class="task-content">
                <div class="task-edit-form">
                    <input type="text" class="task-edit-input" id="edit-title-${task.id}" value="${task.title}">
                    <div class="task-edit-options">
                        <input type="date" class="date-input" id="edit-date-${task.id}" value="${task.dueDate}">
                        <button class="save-btn" onclick="saveTaskEdit('${task.id}')">確定</button>
                    </div>
                </div>
            </div>`;
    } else {
        let badges = `<span id="time-badge-${task.id}" class="badge badge-plain">${formatDuration(task.timeElapsed)}</span>`;
        if (task.dueDate) badges += `<span class="badge badge-date"><i data-lucide="calendar" style="width:12px;height:12px;"></i> ${task.dueDate}</span>`;
        if (!isMatrix) {
            if (task.isImportant) badges += `<span class="badge badge-important">重要</span>`;
            if (isUrgentComputed) badges += `<span class="badge badge-urgent">緊急</span>`;
        }

        div.innerHTML = `
            <div class="drag-handle"><i data-lucide="grip-vertical" style="width:16px;height:16px;"></i></div>
            <button class="task-check-btn" onclick="toggleTaskComplete('${task.id}')">
                <i data-lucide="${task.completed ? 'check-circle' : 'circle'}"></i>
            </button>
            <div class="task-content">
                <span class="task-title">${task.title}</span>
                <div class="task-meta">${badges}</div>
            </div>
            <div class="task-actions">
                ${!task.completed ? `<button class="task-timer-btn ${task.isRunning ? 'stop' : 'start'}" onclick="toggleTaskTimer('${task.id}')"><i data-lucide="${task.isRunning ? 'square' : 'play'}"></i></button>` : ''}
                <button class="task-delete-btn" onclick="removeTask('${task.id}')"><i data-lucide="trash-2"></i></button>
            </div>`;
    }
    return div;
}

window.toggleTaskComplete = toggleTaskComplete;
window.toggleTaskTimer = toggleTaskTimer;
window.removeTask = removeTask;

function updateTimesOnly() {
    if (!timeText) return;
    const isBreak = pomoMode === 'break';
    const totalSeconds = isBreak ? activePreset.break * 60 : activePreset.work * 60;
    const progressPercent = ((totalSeconds - pomoTimeLeft) / totalSeconds) * 100;
    if (pomoProgressBg) pomoProgressBg.style.width = `${progressPercent}%`;
    timeText.innerText = formatTimeText(pomoTimeLeft);
    tasks.forEach(t => {
        const badge = document.getElementById(`time-badge-${t.id}`);
        if (badge) badge.innerText = formatDuration(t.timeElapsed);
    });
}

function render() {
    if (!pomodoroBar) return;
    const isBreak = pomoMode === 'break';
    pomodoroBar.className = `pomodoro-bar ${isBreak ? 'is-break' : ''}`;
    pomoTitle.innerText = isBreak ? '休息時間' : '專注時間';
    
    presetSelector.innerHTML = PRESETS.map(p => `
        <button class="preset-btn ${activePreset.label === p.label ? 'active' : ''}" onclick="window.changePresetObj('${p.label}')">${p.label}</button>
    `).join('');

    updateTimesOnly();
    stretchBanner.style.display = (isBreak && currentStretch) ? 'flex' : 'none';
    if (isBreak && currentStretch) {
        stretchName.innerText = currentStretch.name;
        stretchDesc.innerText = currentStretch.description;
    }
    breakBanner.style.display = (pomoMode === 'break' && pomoIsRunning) ? 'flex' : 'none';
    pomoToggleBtn.innerHTML = `<i data-lucide="${pomoIsRunning ? 'pause' : 'play'}" style="width:20px;height:20px;"></i>`;

    let filtered = tasks;
    if (taskFilter === 'active') filtered = tasks.filter(t => !t.completed);
    else if (taskFilter === 'completed') filtered = tasks.filter(t => t.completed);

    let displayTasks = [...filtered];
    if (sortMode === 'smart') {
        displayTasks.sort((a, b) => {
            const weightA = (a.isImportant ? 2 : 0) + (checkIsUrgent(a.isUrgent, a.dueDate) ? 1 : 0);
            const weightB = (b.isImportant ? 2 : 0) + (checkIsUrgent(b.isUrgent, b.dueDate) ? 1 : 0);
            return weightB !== weightA ? weightB - weightA : b.id - a.id;
        });
    }

    taskCount.innerText = `${tasks.filter(t => t.completed).length} / ${tasks.length}`;
    viewListBtn.classList.toggle('active', viewMode === 'list');
    viewMatrixBtn.classList.toggle('active', viewMode === 'matrix');

    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.filter === taskFilter));
    safeGet('sort-mode-text').innerText = sortMode === 'smart' ? '智慧排序' : '手動排序';
    safeGet('sort-toggle-btn').classList.toggle('active', sortMode === 'manual');

    if (viewMode === 'list') {
        taskListView.style.display = 'flex';
        taskMatrixView.style.display = 'none';
        taskListView.innerHTML = '';
        displayTasks.forEach(t => taskListView.appendChild(renderTaskItem(t, false)));
        initSortable(taskListView, 'list');
    } else {
        taskListView.style.display = 'none';
        taskMatrixView.style.display = 'grid';
        const qs = [
            displayTasks.filter(t => t.isImportant && checkIsUrgent(t.isUrgent, t.dueDate)),
            displayTasks.filter(t => t.isImportant && !checkIsUrgent(t.isUrgent, t.dueDate)),
            displayTasks.filter(t => !t.isImportant && checkIsUrgent(t.isUrgent, t.dueDate)),
            displayTasks.filter(t => !t.isImportant && !checkIsUrgent(t.isUrgent, t.dueDate))
        ];
        [q1Tasks, q2Tasks, q3Tasks, q4Tasks].forEach((el, i) => {
            el.innerHTML = qs[i].length ? '' : '<p class="empty-msg">目前無事項</p>';
            qs[i].forEach(t => el.appendChild(renderTaskItem(t, true)));
            initSortable(el, 'matrix');
        });
    }
    lucide.createIcons();
}

// --- Sortable ---
function initSortable(el, type) {
    if (!el) return;
    new Sortable(el, {
        group: type === 'matrix' ? 'matrix' : 'list',
        animation: 150,
        handle: '.drag-handle',
        ghostClass: 'sortable-ghost',
        onEnd: (evt) => {
            sortMode = 'manual';
            if (type === 'matrix') {
                const map = { 'q1-tasks': [true, true], 'q2-tasks': [true, false], 'q3-tasks': [false, true], 'q4-tasks': [false, false] };
                const task = tasks.find(t => t.id === evt.item.dataset.id);
                if (task && map[evt.to.id]) [task.isImportant, task.isUrgent] = map[evt.to.id];
            }
            // Reorder the main tasks array based on DOM order
            const ids = Array.from(document.querySelectorAll('.task-item')).map(node => node.dataset.id);
            const newTasks = [];
            ids.forEach(id => { const t = tasks.find(x => x.id === id); if(t && !newTasks.includes(t)) newTasks.push(t); });
            tasks.forEach(t => { if(!newTasks.includes(t)) newTasks.push(t); });
            tasks = newTasks;
            saveAndSyncTasks();
            render();
        }
    });
}

// --- Lifecycle ---
document.addEventListener("DOMContentLoaded", () => {
    try {
        pomodoroBar = safeGet('pomodoro-bar');
        pomoProgressBg = safeGet('pomo-progress-bg');
        pomoTitle = safeGet('pomo-title');
        presetSelector = safeGet('preset-selector');
        timeText = safeGet('time-text');
        pomoToggleBtn = safeGet('pomo-toggle-btn');
        stretchBanner = safeGet('stretch-banner');
        stretchName = safeGet('stretch-name');
        stretchDesc = safeGet('stretch-desc');
        breakBanner = safeGet('break-banner');
        taskCount = safeGet('task-count');
        viewListBtn = safeGet('view-list-btn');
        viewMatrixBtn = safeGet('view-matrix-btn');
        addTaskForm = safeGet('add-task-form');
        newTaskTitle = safeGet('new-task-title');
        newTaskDate = safeGet('new-task-date');
        newTaskImportant = safeGet('new-task-important');
        newTaskUrgent = safeGet('new-task-urgent');
        addBtn = safeGet('add-btn');
        taskListView = safeGet('task-list-view');
        taskMatrixView = safeGet('task-matrix-view');
        q1Tasks = safeGet('q1-tasks');
        q2Tasks = safeGet('q2-tasks');
        q3Tasks = safeGet('q3-tasks');
        q4Tasks = safeGet('q4-tasks');
        authBtn = safeGet('auth-btn');
        userGreeting = safeGet('user-greeting');
        syncBanner = safeGet('sync-status-banner');
        syncText = safeGet('sync-status-text');
        syncIcon = safeGet('sync-status-icon');
        sheetLinkBtn = safeGet('sheet-link');

        // Listeners
        if (pomoToggleBtn) pomoToggleBtn.addEventListener('click', togglePomo);
        if (safeGet('pomo-reset-btn')) safeGet('pomo-reset-btn').addEventListener('click', resetPomo);
        if (addTaskForm) addTaskForm.addEventListener('submit', (e) => { e.preventDefault(); addTask(); });
        if (viewListBtn) viewListBtn.addEventListener('click', () => { viewMode = 'list'; render(); });
        if (viewMatrixBtn) viewMatrixBtn.addEventListener('click', () => { viewMode = 'matrix'; render(); });
        if (safeGet('sort-toggle-btn')) safeGet('sort-toggle-btn').addEventListener('click', () => { sortMode = sortMode === 'smart' ? 'manual' : 'smart'; render(); });
        document.querySelectorAll('.filter-btn').forEach(btn => btn.addEventListener('click', () => { taskFilter = btn.dataset.filter; render(); }));
        
        const infoBtn = safeGet('info-modal-btn');
        const modal = safeGet('info-modal');
        if (infoBtn && modal) {
            infoBtn.addEventListener('click', () => modal.style.display = 'flex');
            safeGet('info-close-btn').addEventListener('click', () => modal.style.display = 'none');
        }

        // Theme
        const themeBtn = safeGet('theme-toggle');
        let theme = localStorage.getItem('theme') || 'light';
        document.body.setAttribute('data-theme', theme);
        if(themeBtn) {
            themeBtn.innerHTML = `<i data-lucide="${theme === 'light' ? 'moon' : 'sun'}"></i>`;
            themeBtn.addEventListener('click', () => {
                theme = theme === 'light' ? 'dark' : 'light';
                document.body.setAttribute('data-theme', theme);
                localStorage.setItem('theme', theme);
                themeBtn.innerHTML = `<i data-lucide="${theme === 'light' ? 'moon' : 'sun'}"></i>`;
                lucide.createIcons();
            });
        }

        // Auth
        if (authBtn) {
            authBtn.addEventListener('click', () => {
                if (isAuthenticated) {
                    const token = gapi.client.getToken();
                    if (token) google.accounts.oauth2.revoke(token.access_token, () => {});
                    isAuthenticated = false;
                    localStorage.removeItem('vibeGoogleLoggedIn');
                    updateAuthUI();
                    location.reload();
                } else {
                    if (tokenClient) tokenClient.requestAccessToken({prompt: 'consent'});
                }
            });
        }

        render();
        checkGoogleLibs(localStorage.getItem('vibeGoogleLoggedIn') === 'true');
        lucide.createIcons();
    } catch(err) { console.error("Init failed:", err); }
});

// --- Google Sheets Integration ---
const CLIENT_ID = '669986671313-2rtplhamuknheg6etvq8iot92s5kkm3k.apps.googleusercontent.com';
const API_KEY = 'AIzaSyCTGJJuUlOY-fCWngXnGTjoqqmPiCCCgfU';
const DISCOVERY_DOCS = [
  'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest',
  'https://sheets.googleapis.com/$discovery/rest?version=v4'
];
const SCOPES = 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.profile';

let tokenClient;
let gapiInited = false;
let gisInited = false;
let isAuthenticated = false;
let userSpreadsheetId = null;

function setSyncStatus(status, isLoading = false) {
    if (syncBanner) {
        syncBanner.style.display = status ? 'flex' : 'none';
        if (status) {
            if (syncText) syncText.innerText = status;
            if (syncIcon) syncIcon.style.display = isLoading ? 'inline-block' : 'none';
        }
    }
}

function updateAuthUI() {
    if (!authBtn) return;
    if (isAuthenticated) {
        authBtn.innerHTML = '<i data-lucide="log-out" style="width:16px;height:16px;"></i> 登出';
        authBtn.classList.add('auth-logout');
        userGreeting.innerHTML = `嗨! ${currentUserName}`;
        userGreeting.style.display = 'block';
    } else {
        authBtn.innerHTML = 'Google 登入';
        authBtn.classList.remove('auth-logout');
        userGreeting.style.display = 'none';
        if (syncBanner) syncBanner.style.display = 'none';
        if (sheetLinkBtn) sheetLinkBtn.style.display = 'none';
        userSpreadsheetId = null;
    }
    lucide.createIcons();
}

async function initDataSync() {
    setSyncStatus('正在為您尋找/建構 Google 試算表...', true);
    try {
        let response = await gapi.client.drive.files.list({
            q: "name='VibeToDoList' and trashed=false",
            fields: 'files(id, name)',
            spaces: 'drive'
        });

        let files = response.result.files;
        if (files && files.length > 0) {
            userSpreadsheetId = files[0].id;
        } else {
            setSyncStatus('建立新的試算表中...', true);
            const createResponse = await gapi.client.sheets.spreadsheets.create({
                resource: {
                    properties: { title: 'VibeToDoList' },
                    sheets: [{ properties: { title: 'Tasks' } }]
                }
            });
            userSpreadsheetId = createResponse.result.spreadsheetId;

            await gapi.client.sheets.spreadsheets.values.update({
                spreadsheetId: userSpreadsheetId,
                range: 'Tasks!A1:G1',
                valueInputOption: 'RAW',
                resource: { values: [['ID', '任務名稱', '完成狀態', '累積專注時間', '截止日期', '重要', '緊急']] }
            });
        }

        setSyncStatus('正在同步您的待辦事項...', true);
        await fetchTasksFromSheet();
        setSyncStatus('已連接至您的 VibeToDoList 試算表囉!');
        if (sheetLinkBtn) {
            sheetLinkBtn.href = `https://docs.google.com/spreadsheets/d/${userSpreadsheetId}/edit`;
            sheetLinkBtn.style.display = 'inline-flex';
        }
        setTimeout(() => { if (syncText && syncText.innerText.includes('已連接')) setSyncStatus(''); }, 5000);
    } catch (err) {
        console.error(err);
        setSyncStatus('同步失敗！請檢查網路。');
        setTimeout(() => { setSyncStatus(''); }, 5000);
    }
}

async function fetchTasksFromSheet() {
    if (!userSpreadsheetId) return;
    try {
        let response = await gapi.client.sheets.spreadsheets.values.get({
            spreadsheetId: userSpreadsheetId,
            range: 'Tasks!A2:G'
        });
        const rows = response.result.values || [];

        if (rows.length > 0) {
            tasks = rows.map(row => ({
                id: row[0] || Date.now().toString() + Math.random(),
                title: row[1] || '未命名任務',
                completed: row[2] === 'TRUE',
                timeElapsed: parseInt(row[3]) || 0,
                dueDate: row[4] || '',
                isImportant: row[5] === 'TRUE',
                isUrgent: row[6] === 'TRUE',
                isRunning: false
            }));
            localStorage.setItem('vibeTasks', JSON.stringify(tasks));
        }
        render();
    } catch (err) {
        console.error('Error fetching tasks', err);
    }
}

let syncTimeout = null;
async function syncToGoogleSheets() {
    if (!userSpreadsheetId || !isAuthenticated) return;
    setSyncStatus('正在同步...', true);

    if (syncTimeout) clearTimeout(syncTimeout);

    syncTimeout = setTimeout(async () => {
        try {
            await gapi.client.sheets.spreadsheets.values.clear({
                spreadsheetId: userSpreadsheetId,
                range: 'Tasks!A2:G'
            });

            const values = tasks.map(t => [
                t.id, t.title, t.completed ? 'TRUE' : 'FALSE', t.timeElapsed.toString(), t.dueDate, t.isImportant ? 'TRUE' : 'FALSE', t.isUrgent ? 'TRUE' : 'FALSE'
            ]);

            if (values.length > 0) {
                await gapi.client.sheets.spreadsheets.values.update({
                    spreadsheetId: userSpreadsheetId,
                    range: 'Tasks!A2:G',
                    valueInputOption: 'RAW',
                    resource: { values }
                });
            }
            setSyncStatus('已同步');
            setTimeout(() => { if (syncText && syncText.innerText === '已同步') setSyncStatus(''); }, 2000);
        } catch (e) {
            console.error('Update err', e);
            if (e.status === 401) {
                // Token expired, try to refresh silently
                tokenClient.requestAccessToken({ prompt: '' });
            }
            setSyncStatus('同步失敗');
        }
    }, 1500);
}

function saveAndSyncTasks() {
    localStorage.setItem('vibeTasks', JSON.stringify(tasks));
    if (isAuthenticated) {
        syncToGoogleSheets();
    }
}

function checkGoogleLibs(autoLogin) {
    if (window.gapi && window.google) {
        gapi.load('client', async () => {
            try {
                await gapi.client.init({ apiKey: API_KEY, discoveryDocs: DISCOVERY_DOCS });
                gapiInited = true;
                
                tokenClient = google.accounts.oauth2.initTokenClient({
                    client_id: CLIENT_ID,
                    scope: SCOPES,
                    callback: async (resp) => {
                        if (resp.error) throw resp;
                        try {
                            const userInfo = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                                headers: { Authorization: `Bearer ${resp.access_token}` }
                            }).then(r => r.json());
                            currentUserName = userInfo.given_name || userInfo.name || 'User';
                        } catch (e) { console.log(e); }

                        isAuthenticated = true;
                        localStorage.setItem('vibeGoogleLoggedIn', 'true');
                        updateAuthUI();
                        await initDataSync();
                    }
                });
                
                if (autoLogin) {
                    tokenClient.requestAccessToken({ prompt: '' });
                }
            } catch (e) {
                console.error('Error init GAPI', e);
            }
        });
    } else setTimeout(() => checkGoogleLibs(autoLogin), 100);
}

window.changePresetObj = (l) => { const p = PRESETS.find(x=>x.label===l); if(p){ activePreset=p; resetPomo(); } };
