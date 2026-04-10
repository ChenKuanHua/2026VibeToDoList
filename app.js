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

// --- State ---
let activePreset = PRESETS[0];
let pomoMode = 'work'; // 'work' | 'break'
let pomoTimeLeft = activePreset.work * 60;
let pomoIsRunning = false;
let currentStretch = null;

let tasks = JSON.parse(localStorage.getItem('vibeTasks'));
if (!tasks || tasks.length === 0) {
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
}
let viewMode = 'list';
let timerInterval = null;
let lastTickTime = Date.now();

// --- Theme Logic ---
const themeToggleBtn = document.getElementById('theme-toggle');
let currentTheme = localStorage.getItem('theme') || 'light';
if (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches) {
  currentTheme = 'dark';
}
document.body.setAttribute('data-theme', currentTheme);

themeToggleBtn.addEventListener('click', () => {
  currentTheme = currentTheme === 'light' ? 'dark' : 'light';
  document.body.setAttribute('data-theme', currentTheme);
  localStorage.setItem('theme', currentTheme);
  themeToggleBtn.innerHTML = `<i data-lucide="${currentTheme === 'light' ? 'moon' : 'sun'}"></i>`;
  lucide.createIcons();
});

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

// --- DOM Elements ---
const pomodoroBar = document.getElementById('pomodoro-bar');
const pomoProgressBg = document.getElementById('pomo-progress-bg');
const pomoTitle = document.getElementById('pomo-title');
const presetSelector = document.getElementById('preset-selector');
const timeText = document.getElementById('time-text');
const pomoToggleBtn = document.getElementById('pomo-toggle-btn');
const stretchBanner = document.getElementById('stretch-banner');
const stretchName = document.getElementById('stretch-name');
const stretchDesc = document.getElementById('stretch-desc');
const breakBanner = document.getElementById('break-banner');

const taskCount = document.getElementById('task-count');
const viewListBtn = document.getElementById('view-list-btn');
const viewMatrixBtn = document.getElementById('view-matrix-btn');
const addTaskForm = document.getElementById('add-task-form');
const newTaskTitle = document.getElementById('new-task-title');
const newTaskDate = document.getElementById('new-task-date');
const newTaskImportant = document.getElementById('new-task-important');
const newTaskUrgent = document.getElementById('new-task-urgent');
const addBtn = document.getElementById('add-btn');

const taskListView = document.getElementById('task-list-view');
const taskMatrixView = document.getElementById('task-matrix-view');
const q1Tasks = document.getElementById('q1-tasks');
const q2Tasks = document.getElementById('q2-tasks');
const q3Tasks = document.getElementById('q3-tasks');
const q4Tasks = document.getElementById('q4-tasks');

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
    if (pomoTimeLeft <= 0) {
      timerEnded = true;
    }
  }

  const isBreakActive = pomoMode === 'break' && pomoIsRunning;
  if (!isBreakActive) {
    tasks.forEach(t => {
      if (t.isRunning) t.timeElapsed += deltaSeconds;
    });
  }

  if (timerEnded) {
    playPing();
    handlePomoComplete();
    render(); // Hard render on state transitions (work to break)
  } else {
    // Only update individual DOM nodes to prevent flickering issues during hover
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
    currentStretch = null;
    pomoIsRunning = false;
  }
  if (typeof saveAndSyncTasks === "function") saveAndSyncTasks();
}

function togglePomo() {
  // First time playback will initialize audio context
  try { new window.AudioContext().resume(); } catch(e){} 
  
  pomoIsRunning = !pomoIsRunning;
  if (pomoIsRunning && !timerInterval) startTimerLoop();
  render();
}

function resetPomo() {
  pomoIsRunning = false;
  pomoMode = 'work';
  pomoTimeLeft = activePreset.work * 60;
  currentStretch = null;
  render();
}

function changePreset(preset) {
  activePreset = preset;
  pomoIsRunning = false;
  pomoMode = 'work';
  pomoTimeLeft = preset.work * 60;
  currentStretch = null;
  render();
}

// --- Task Actions ---
function addTask(e) {
  e.preventDefault();
  const title = newTaskTitle.value.trim();
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
  
  addBtn.disabled = true;
  render();
  if (typeof saveAndSyncTasks === "function") saveAndSyncTasks();
}

newTaskTitle.addEventListener('input', () => {
  addBtn.disabled = !newTaskTitle.value.trim();
});

function removeTask(id) {
  tasks = tasks.filter(t => t.id !== id);
  render();
  if (typeof saveAndSyncTasks === "function") saveAndSyncTasks();
}

function toggleTaskComplete(id) {
  tasks = tasks.map(t => t.id === id ? { ...t, completed: !t.completed, isRunning: !t.completed ? false : t.isRunning } : t);
  render();
  if (typeof saveAndSyncTasks === "function") saveAndSyncTasks();
}

function toggleTaskTimer(id) {
  tasks = tasks.map(t => t.id === id ? { ...t, isRunning: !t.isRunning } : t);
  if (tasks.some(t => t.isRunning) && !timerInterval) startTimerLoop();
  render();
  // Sync to save the final accumulated time when stopped
  if (typeof saveAndSyncTasks === "function") saveAndSyncTasks();
}

let editingTaskId = null;
function renderTaskItem(task, isMatrix = false) {
  const isUrgentComputed = checkIsUrgent(task.isUrgent, task.dueDate);
  const div = document.createElement('div');
  div.className = `task-item  ${isMatrix ? 'matrix-item' : ''} ${task.completed ? 'completed' : ''} ${task.isRunning ? 'running' : ''}`;

  if (editingTaskId === task.id) {
    div.innerHTML = `
      <div class="task-content">
        <div class="task-edit-form">
          <input type="text" class="task-edit-input" id="edit-title-${task.id}" value="${task.title}">
          <div class="task-edit-options">
             <input type="date" class="date-input" id="edit-date-${task.id}" value="${task.dueDate}">
             <label class="custom-checkbox">
               <input type="checkbox" id="edit-important-${task.id}" ${task.isImportant ? 'checked' : ''}>
               <span class="checkmark important-check"></span> 重要
             </label>
             <label class="custom-checkbox">
               <input type="checkbox" id="edit-urgent-${task.id}" ${task.isUrgent ? 'checked' : ''}>
               <span class="checkmark urgent-check"></span> 緊急
             </label>
             <button class="save-btn" onclick="saveTaskEdit('${task.id}')">確定</button>
          </div>
        </div>
      </div>
    `;
    setTimeout(() => {
      const input = document.getElementById(`edit-title-${task.id}`);
      if (input) {
         input.focus();
         input.addEventListener('keydown', (e) => { if (e.key === 'Enter') saveTaskEdit(task.id); });
      }
    }, 0);
  } else {
    // Badges depending on view type
    let badges = `<span id="time-badge-${task.id}" class="badge badge-plain">${formatDuration(task.timeElapsed)} ${task.isRunning ? '<i data-lucide="timer" style="width:12px; height:12px;"></i>' : ''}</span>`;
    if (task.dueDate) badges += `<span class="badge badge-date"><i data-lucide="calendar" style="width:12px; height:12px;"></i> ${task.dueDate}</span>`;
    
    // Omit urgent and important badge if checking Matrix since Matrix already implies priority
    if (!isMatrix) {
      if (task.isImportant) badges += `<span class="badge badge-important"><i data-lucide="alert-circle" style="width:12px; height:12px;"></i> 重要</span>`;
      if (isUrgentComputed) badges += `<span class="badge badge-urgent"><i data-lucide="alert-triangle" style="width:12px; height:12px;"></i> 緊急</span>`;
    }

    div.innerHTML = `
      <button class="task-check-btn" onclick="toggleTaskComplete('${task.id}')">
        <i data-lucide="${task.completed ? 'check-circle' : 'circle'}"></i>
      </button>
      <div class="task-content">
        <span class="task-title" ondblclick="startEditTask('${task.id}', ${task.completed})">${task.title}</span>
        <div class="task-meta">${badges}</div>
      </div>
      <div class="task-actions">
        ${!task.completed ? `
          <button class="task-timer-btn ${task.isRunning ? 'stop' : 'start'}" onclick="toggleTaskTimer('${task.id}')" title="${task.isRunning ? '停止' : '計時'}">
            <i data-lucide="${task.isRunning ? 'square' : 'play'}" style="width:16px; height:16px;"></i>
          </button>
        ` : ''}
        <button class="task-delete-btn" onclick="removeTask('${task.id}')" title="刪除">
          <i data-lucide="trash-2" style="width:16px; height:16px;"></i>
        </button>
      </div>
    `;
  }
  return div;
}

window.toggleTaskComplete = toggleTaskComplete;
window.toggleTaskTimer = toggleTaskTimer;
window.removeTask = removeTask;
window.startEditTask = (id, isCompleted) => {
  if (isCompleted) return;
  editingTaskId = id;
  render();
};
window.saveTaskEdit = (id) => {
  const newTitle = document.getElementById(`edit-title-${id}`).value;
  const newDate = document.getElementById(`edit-date-${id}`).value;
  const isImportant = document.getElementById(`edit-important-${id}`).checked;
  const isUrgent = document.getElementById(`edit-urgent-${id}`).checked;

  tasks = tasks.map(t => t.id === id ? {
    ...t, 
    title: newTitle.trim() || t.title,
    dueDate: newDate,
    isImportant,
    isUrgent
  } : t);
  editingTaskId = null;
  render();
  if (typeof saveAndSyncTasks === "function") saveAndSyncTasks();
};

window.changePresetObj = (label) => {
  const p = PRESETS.find(x => x.label === label);
  if (p) changePreset(p);
}

// --- Light DOM Updates during ticks (prevents flicker) ---
function updateTimesOnly() {
  const isBreak = pomoMode === 'break';
  const totalSeconds = isBreak ? activePreset.break * 60 : activePreset.work * 60;
  const progressPercent = ((totalSeconds - pomoTimeLeft) / totalSeconds) * 100;
  pomoProgressBg.style.width = `${progressPercent}%`;
  timeText.innerText = formatTimeText(pomoTimeLeft);

  tasks.forEach(t => {
      const badge = document.getElementById(`time-badge-${t.id}`);
      if (badge) {
          badge.innerHTML = `${formatDuration(t.timeElapsed)} ${t.isRunning ? '<i data-lucide="timer" style="width:12px; height:12px;"></i>' : ''}`;
      }
  });
}

// --- Deep Full Render ---
function render() {
  const isBreak = pomoMode === 'break';
  pomodoroBar.className = `pomodoro-bar ${isBreak ? 'is-break' : ''}`;
  pomoTitle.innerText = isBreak ? '休息時間' : '專注時間';
  
  presetSelector.innerHTML = PRESETS.map(preset => `
    <button class="preset-btn ${activePreset.label === preset.label ? 'active' : ''}" 
            onclick="window.changePresetObj('${preset.label}')">
      ${preset.label}
    </button>
  `).join('');

  // Apply immediately in full render
  updateTimesOnly();

  if (isBreak && currentStretch) {
    stretchBanner.style.display = 'flex';
    stretchName.innerText = currentStretch.name;
    stretchDesc.innerText = currentStretch.description;
  } else {
    stretchBanner.style.display = 'none';
  }

  const isBreakActive = pomoMode === 'break' && pomoIsRunning;
  breakBanner.style.display = isBreakActive ? 'flex' : 'none';

  pomoToggleBtn.className = `btn-icon play-btn ${pomoIsRunning ? 'is-running' : ''}`;
  pomoToggleBtn.innerHTML = `<i data-lucide="${pomoIsRunning ? 'pause' : 'play'}" style="width:20px;height:20px;"></i>`;
  pomoToggleBtn.title = pomoIsRunning ? '暫停計時' : '開始計時';

  taskCount.innerText = `${tasks.filter(t => t.completed).length} / ${tasks.length}`;
  viewListBtn.className = `toggle-btn ${viewMode === 'list' ? 'active' : ''}`;
  viewMatrixBtn.className = `toggle-btn ${viewMode === 'matrix' ? 'active' : ''}`;

  if (viewMode === 'list') {
    taskListView.style.display = 'flex';
    taskMatrixView.style.display = 'none';
    const sortedTasks = [...tasks].sort((a, b) => ((b.isImportant?2:0)+(b.isUrgent?1:0)) - ((a.isImportant?2:0)+(a.isUrgent?1:0)));
    taskListView.innerHTML = '';
    sortedTasks.forEach(t => taskListView.appendChild(renderTaskItem(t, false)));
  } else {
    taskListView.style.display = 'none';
    taskMatrixView.style.display = 'grid';
    const q1 = tasks.filter(t => t.isImportant && checkIsUrgent(t.isUrgent, t.dueDate));
    const q2 = tasks.filter(t => t.isImportant && !checkIsUrgent(t.isUrgent, t.dueDate));
    const q3 = tasks.filter(t => !t.isImportant && checkIsUrgent(t.isUrgent, t.dueDate));
    const q4 = tasks.filter(t => !t.isImportant && !checkIsUrgent(t.isUrgent, t.dueDate));

    const renderQ = (targetElement, qTasks, emptyMsg) => {
      targetElement.innerHTML = '';
      if (qTasks.length === 0) {
        targetElement.innerHTML = `<p class="empty-msg">${emptyMsg}</p>`;
      } else {
        qTasks.forEach(t => targetElement.appendChild(renderTaskItem(t, true)));
      }
    }
    renderQ(q1Tasks, q1, '任務清空');
    renderQ(q2Tasks, q2, '目前無事項');
    renderQ(q3Tasks, q3, '目前無事項');
    renderQ(q4Tasks, q4, '目前無事項');
  }

  lucide.createIcons();
}

// --- Event Listeners Init ---
pomoToggleBtn.addEventListener('click', togglePomo);
document.getElementById('pomo-reset-btn').addEventListener('click', resetPomo);
addTaskForm.addEventListener('submit', addTask);
viewListBtn.addEventListener('click', () => { viewMode = 'list'; render(); });
viewMatrixBtn.addEventListener('click', () => { viewMode = 'matrix'; render(); });

document.addEventListener("DOMContentLoaded", () => {
    themeToggleBtn.innerHTML = `<i data-lucide="${currentTheme === 'light' ? 'moon' : 'sun'}"></i>`;
    setTimeout(render, 100);
    checkGoogleLibs();
});

// --- Info Modal Logic ---
const infoModalBtn = document.getElementById('info-modal-btn');
const infoModal = document.getElementById('info-modal');
const infoCloseBtn = document.getElementById('info-close-btn');

infoModalBtn.addEventListener('click', () => { infoModal.style.display = 'flex'; });
infoCloseBtn.addEventListener('click', () => { infoModal.style.display = 'none'; });
infoModal.addEventListener('click', (e) => { if (e.target === infoModal) infoModal.style.display = 'none'; });

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
let currentUserName = '';

const authBtn = document.getElementById('auth-btn');
const userGreeting = document.getElementById('user-greeting');
const syncBanner = document.getElementById('sync-status-banner');
const syncText = document.getElementById('sync-status-text');
const syncIcon = document.getElementById('sync-status-icon');
const sheetLinkBtn = document.getElementById('sheet-link');

function saveAndSyncTasks() {
  if (isAuthenticated && typeof syncToGoogleSheets === "function") {
    syncToGoogleSheets();
  } else {
    localStorage.setItem('vibeTasks', JSON.stringify(tasks));
  }
}

function setSyncStatus(status, isLoading = false) {
  if(syncBanner) {
    syncBanner.style.display = status ? 'flex' : 'none';
    if (status) {
      if(syncText) syncText.innerText = status;
      if(syncIcon) syncIcon.style.display = isLoading ? 'inline-block' : 'none';
    }
  }
}

function updateAuthUI() {
  if (isAuthenticated) {
    authBtn.innerHTML = '<i data-lucide="log-out" style="width:16px;height:16px;"></i> 登出';
    authBtn.classList.add('auth-logout');
    userGreeting.innerHTML = `嗨! ${currentUserName}`;
    userGreeting.style.display = 'block';
  } else {
    authBtn.innerHTML = 'Google 登入';
    authBtn.classList.remove('auth-logout');
    userGreeting.style.display = 'none';
    if(syncBanner) syncBanner.style.display = 'none';
    if(sheetLinkBtn) sheetLinkBtn.style.display = 'none';
    userSpreadsheetId = null;
    currentUserName = '';
    // Show placeholder task if logged out? For now leave as is.
  }
  lucide.createIcons();
}

async function initializeGapiClient() {
  try {
    await gapi.client.init({ apiKey: API_KEY, discoveryDocs: DISCOVERY_DOCS });
    gapiInited = true;
    enableAuthBtn();
  } catch (e) {
    console.error('Error init GAPI', e);
  }
}

function gisLoaded() {
  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID,
    scope: SCOPES,
    callback: async (resp) => {
      if (resp.error !== undefined) {
        throw (resp);
      }
      try {
        const userInfo = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
             headers: { Authorization: `Bearer ${resp.access_token}` }
        }).then(r => r.json());
        currentUserName = userInfo.given_name || userInfo.name || 'User';
      } catch(e) { console.log(e); }

      isAuthenticated = true;
      updateAuthUI();
      await initDataSync();
    },
  });
  gisInited = true;
  enableAuthBtn();
}

function enableAuthBtn() {
  if (gapiInited && gisInited) {
    authBtn.disabled = false;
  }
}

authBtn.addEventListener('click', () => {
  if (isAuthenticated) {
    // Logout
    const token = gapi.client.getToken();
    if (token && token.access_token) {
      // Perform logout instantly in UI
      gapi.client.setToken('');
      isAuthenticated = false;
      updateAuthUI();
      handleLogoutAction();
      
      // Revoke in background
      google.accounts.oauth2.revoke(token.access_token, () => {});
    } else {
        isAuthenticated = false;
        updateAuthUI();
        handleLogoutAction();
    }
  } else {
    // Login

    tokenClient.requestAccessToken({prompt: 'consent'});
  }
});

function handleLogoutAction() {
  // Revert back to local storage
  tasks = JSON.parse(localStorage.getItem('vibeTasks'));
  if (!tasks || tasks.length === 0) tasks = [];
  render();
  setTimeout(() => {
    infoModal.style.display = 'flex';
  }, 300);
}

function checkGoogleLibs() {
  if (window.gapi && window.google) {
      window.gapi.load('client', initializeGapiClient);
      gisLoaded();
  } else {
      setTimeout(checkGoogleLibs, 100);
  }
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
    if(sheetLinkBtn) {
      sheetLinkBtn.href = `https://docs.google.com/spreadsheets/d/${userSpreadsheetId}/edit`;
      sheetLinkBtn.style.display = 'inline-flex';
    }
    setTimeout(() => { setSyncStatus(''); }, 5000);
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
    
    // Convert to Tasks array.
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
    } else {
        tasks = [];
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
      setTimeout(() => { if(document.getElementById('sync-status-text') && document.getElementById('sync-status-text').innerText === '已同步') setSyncStatus(''); }, 2000);
    } catch(e) {
      console.error('Update err', e);
      setSyncStatus('同步失敗');
    }
  }, 1000);
}

