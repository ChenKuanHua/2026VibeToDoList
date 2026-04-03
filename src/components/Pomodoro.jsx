import React from 'react';
import { useTimer } from '../context/TimerContext';
import { formatTime } from '../utils/formatTime';
import { Play, Pause, RefreshCw } from 'lucide-react';
import './Pomodoro.css';

const Pomodoro = () => {
  const { 
    pomoMode, 
    pomoTimeLeft, 
    pomoIsRunning, 
    togglePomo, 
    resetPomo,
    currentStretch,
    activePreset,
    presets,
    changePreset
  } = useTimer();

  const isBreak = pomoMode === 'break';
  const totalSeconds = isBreak ? activePreset.break * 60 : activePreset.work * 60;
  const progressPercent = ((totalSeconds - pomoTimeLeft) / totalSeconds) * 100;

  return (
    <div className={`pomodoro-card ${isBreak ? 'is-break' : ''}`}>
      <div className="pomo-header">
        <h2>{isBreak ? '休息時間' : '專注時間'}</h2>
        <div className="preset-selector">
          {presets.map(preset => (
            <button 
              key={preset.label}
              className={`preset-btn ${activePreset.label === preset.label ? 'active' : ''}`}
              onClick={() => changePreset(preset)}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      <div className="timer-display">
        <svg className="progress-ring" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="54" className="ring-bg" />
          <circle 
            cx="60" cy="60" r="54" 
            className="ring-progress" 
            style={{ strokeDashoffset: 339.292 * (1 - progressPercent / 100) }}
          />
        </svg>
        <div className="time-text">
          {formatTime(pomoTimeLeft)}
        </div>
      </div>

      {isBreak && currentStretch && (
        <div className="stretch-card">
          <span className="stretch-label">NASM CPT 建議伸展</span>
          <h3 className="stretch-name">{currentStretch.name}</h3>
          <p className="stretch-desc">{currentStretch.description}</p>
        </div>
      )}

      <div className="controls">
        <button className={`control-btn main-btn ${pomoIsRunning ? 'pause' : 'play'}`} onClick={togglePomo}>
          {pomoIsRunning ? <Pause size={24} /> : <Play size={24} />}
        </button>
        <button className="control-btn reset-btn" onClick={resetPomo}>
          <RefreshCw size={20} />
        </button>
      </div>
    </div>
  );
};

export default Pomodoro;
