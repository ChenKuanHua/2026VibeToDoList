import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

const TimerContext = createContext();

const STRETCHES = [
  { name: '上斜方肌伸展', description: '右手輕壓左側頭部向右傾斜，感受左側頸部伸展，維持30秒後換邊。能舒緩久坐肩頸僵硬。' },
  { name: '胸大肌伸展', description: '找一面牆或門框，單手呈90度貼住，身體微轉向反方向。感受胸部前方拉展。' },
  { name: '坐姿梨狀肌伸展', description: '坐在椅子上，將右腳踝放在左膝上方，腰挺直並微向前傾。舒緩臀部緊繃。' },
  { name: '背部與闊背肌伸展', description: '雙手交扣向前推，背部向後拱起低頭，感受背部肌肉拉伸。' },
  { name: '頸部輕度活動', description: '下巴微收，頭部緩慢向左右兩側旋轉，不要過度用力，放鬆頸椎壓力。' }
];

export const PRESETS = [
  { label: '經典 25/5', work: 25, break: 5 },
  { label: '長時 50/10', work: 50, break: 10 },
  { label: '短衝刺 15/3', work: 15, break: 3 }
];

export const TimerProvider = ({ children }) => {
  // --- Presets & configuration ---
  const [activePreset, setActivePreset] = useState(PRESETS[0]);
  
  // --- Pomodoro State ---
  const [pomoMode, setPomoMode] = useState('work'); // 'work' | 'break'
  const [pomoTimeLeft, setPomoTimeLeft] = useState(activePreset.work * 60);
  const [pomoIsRunning, setPomoIsRunning] = useState(false);
  const [currentStretch, setCurrentStretch] = useState(null);

  // --- Task State ---
  const [tasks, setTasks] = useState([
    { id: '1', title: '規劃今日工作', completed: false, timeElapsed: 0, isRunning: false }
  ]);

  const timerRef = useRef(null);
  const lastTickRef = useRef(Date.now());

  // --- Core Timer Logic ---
  useEffect(() => {
    if (pomoIsRunning || tasks.some(t => t.isRunning)) {
      lastTickRef.current = Date.now();
      timerRef.current = setInterval(() => {
        const now = Date.now();
        const delta = Math.floor((now - lastTickRef.current) / 1000);
        
        if (delta > 0) {
          lastTickRef.current = now;
          tick(delta);
        }
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }

    return () => clearInterval(timerRef.current);
  }, [pomoIsRunning, tasks, pomoMode]);

  const tick = (deltaSeconds) => {
    // 1. Update Pomodoro
    if (pomoIsRunning) {
      setPomoTimeLeft(prev => {
        if (prev - deltaSeconds <= 0) {
          handlePomoComplete();
          return 0;
        }
        return prev - deltaSeconds;
      });
    }

    // 2. Update Tasks
    // 只有當「非」番茄鐘休息時間時，任務才允許累計時間。
    // 如果想要確保：只有在番茄鐘是 work 模式且有在跑，或者雖然番茄鐘沒在跑但任務有開啟，才能累加。
    // 但規格說：「自動扣掉番茄鐘起身休息運動的時間」。意思是只要 pomoMode === 'break' 且在執行中，任務計時就該暫停。
    const isBreakActive = pomoMode === 'break' && pomoIsRunning;
    
    if (!isBreakActive) {
      setTasks(prevTasks => 
        prevTasks.map(task => 
          task.isRunning 
            ? { ...task, timeElapsed: task.timeElapsed + deltaSeconds }
            : task
        )
      );
    }
  };

  const handlePomoComplete = () => {
    if (pomoMode === 'work') {
      setPomoMode('break');
      setPomoTimeLeft(activePreset.break * 60);
      setCurrentStretch(STRETCHES[Math.floor(Math.random() * STRETCHES.length)]);
    } else {
      setPomoMode('work');
      setPomoTimeLeft(activePreset.work * 60);
      setCurrentStretch(null);
      setPomoIsRunning(false); // 休息結束後自動暫停，等待使用者再次開始
    }
  };

  // --- Pomodoro Actions ---
  const togglePomo = () => setPomoIsRunning(!pomoIsRunning);
  const resetPomo = () => {
    setPomoIsRunning(false);
    setPomoMode('work');
    setPomoTimeLeft(activePreset.work * 60);
    setCurrentStretch(null);
  };
  const changePreset = (preset) => {
    setActivePreset(preset);
    setPomoIsRunning(false);
    setPomoMode('work');
    setPomoTimeLeft(preset.work * 60);
    setCurrentStretch(null);
  };

  // --- Task Actions ---
  const addTask = (title) => {
    if(!title.trim()) return;
    setTasks([...tasks, { id: Date.now().toString(), title, completed: false, timeElapsed: 0, isRunning: false }]);
  };

  const removeTask = (id) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

  const toggleTaskComplete = (id) => {
    setTasks(tasks.map(t => {
      if (t.id === id) {
        // 完成任務時自動停止計時
        return { ...t, completed: !t.completed, isRunning: !t.completed ? false : t.isRunning };
      }
      return t;
    }));
  };

  const toggleTaskTimer = (id) => {
    setTasks(tasks.map(t => {
      if (t.id === id) {
        return { ...t, isRunning: !t.isRunning };
      }
      return t;
    }));
  };

  const updateTaskTitle = (id, newTitle) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, title: newTitle } : t));
  };

  return (
    <TimerContext.Provider value={{
      presets: PRESETS,
      activePreset, changePreset,
      pomoMode, pomoTimeLeft, pomoIsRunning, togglePomo, resetPomo, currentStretch,
      tasks, addTask, removeTask, toggleTaskComplete, toggleTaskTimer, updateTaskTitle
    }}>
      {children}
    </TimerContext.Provider>
  );
};

export const useTimer = () => useContext(TimerContext);
