import React, { useState } from 'react';
import { useTimer } from '../context/TimerContext';
import { CheckCircle, Circle, Trash2, Play, Square } from 'lucide-react';
import { formatDuration } from '../utils/formatTime';

const TaskItem = ({ task }) => {
  const { toggleTaskComplete, removeTask, toggleTaskTimer, updateTaskTitle } = useTimer();
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);

  const handleBlur = () => {
    setIsEditing(false);
    if(editTitle.trim() !== task.title) {
      updateTaskTitle(task.id, editTitle);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleBlur();
    }
  };

  return (
    <div className={`task-item ${task.completed ? 'completed' : ''} ${task.isRunning ? 'running' : ''}`}>
      <button 
        className="task-check-btn" 
        onClick={() => toggleTaskComplete(task.id)}
      >
        {task.completed ? <CheckCircle size={24} className="icon-check" /> : <Circle size={24} />}
      </button>

      <div className="task-content">
        {isEditing ? (
          <input 
            autoFocus
            type="text" 
            className="task-edit-input"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
          />
        ) : (
          <span 
            className="task-title" 
            onDoubleClick={() => !task.completed && setIsEditing(true)}
          >
            {task.title}
          </span>
        )}
        <span className="task-time">
          時間: {formatDuration(task.timeElapsed)} {task.isRunning && '(計時中...)'}
        </span>
      </div>

      <div className="task-actions">
        {!task.completed && (
          <button 
            className={`task-timer-btn ${task.isRunning ? 'stop' : 'start'}`}
            onClick={() => toggleTaskTimer(task.id)}
            title={task.isRunning ? "停止計時" : "開始計時"}
          >
            {task.isRunning ? <Square size={18} /> : <Play size={18} />}
          </button>
        )}
        <button 
          className="task-delete-btn" 
          onClick={() => removeTask(task.id)}
          title="刪除任務"
        >
          <Trash2 size={18} />
        </button>
      </div>
    </div>
  );
};

export default TaskItem;
