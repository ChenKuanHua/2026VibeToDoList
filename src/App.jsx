import React from 'react';
import Pomodoro from './components/Pomodoro';
import TaskList from './components/TaskList';
import { useTimer } from './context/TimerContext';

function App() {
  const { tasks, pomoMode, pomoIsRunning } = useTimer();
  // Is Break Active
  const isBreakActive = pomoMode === 'break' && pomoIsRunning;

  return (
    <div className="container">
      <header className="app-header">
        <h1>Vibe Flow</h1>
        <p className="app-subtitle">極簡辦公工具包</p>
        {isBreakActive && (
          <div className="break-banner">
            現正休息中，所有任務已自動暫停計時
          </div>
        )}
      </header>

      <main className="app-main">
        <div className="sidebar">
          <Pomodoro />
        </div>
        <div className="content">
          <TaskList />
        </div>
      </main>
    </div>
  );
}

export default App;

