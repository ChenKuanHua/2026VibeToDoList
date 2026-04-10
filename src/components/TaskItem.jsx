import React, { useState } from 'react';
import { useTimer } from '../context/TimerContext';
import { CheckCircle, Circle, Trash2, Play, Square, Calendar, AlertCircle, AlertTriangle } from 'lucide-react';
import { formatDuration } from '../utils/formatTime';
import { checkIsUrgent } from '../utils/dateUtils';

const TaskItem = ({ task }) => {
  const { toggleTaskComplete, removeTask, toggleTaskTimer, updateTaskTitle, updateTaskProperties } = useTimer();
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [editDate, setEditDate] = useState(task.dueDate || '');
  const [editImportant, setEditImportant] = useState(task.isImportant || false);
  const [editUrgent, setEditUrgent] = useState(task.isUrgent || false);

  const handleBlur = () => {
    setIsEditing(false);
    updateTaskProperties(task.id, { 
      title: editTitle.trim() || task.title, 
      dueDate: editDate, 
      isImportant: editImportant,
      isUrgent: editUrgent
    });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleBlur();
    }
  };

  const computedUrgent = checkIsUrgent(task.isUrgent, task.dueDate);

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
          <div className="task-edit-form">
            <input 
              autoFocus
              type="text" 
              className="task-edit-input"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <div className="task-edit-options">
               <input 
                 type="date" 
                 value={editDate} 
                 onChange={(e) => setEditDate(e.target.value)} 
                 className="date-input-small"
               />
               <label className="custom-checkbox">
                 <input type="checkbox" checked={editImportant} onChange={(e) => setEditImportant(e.target.checked)} />
                 <span className="checkmark important-check"></span> 重要
               </label>
               <label className="custom-checkbox">
                 <input type="checkbox" checked={editUrgent} onChange={(e) => setEditUrgent(e.target.checked)} />
                 <span className="checkmark urgent-check"></span> 緊急
               </label>
               <button onClick={handleBlur} className="save-btn">確定</button>
            </div>
          </div>
        ) : (
          <div className="task-display">
            <span 
              className="task-title" 
              onDoubleClick={() => !task.completed && setIsEditing(true)}
            >
              {task.title}
            </span>
            <div className="task-meta">
              <span className="task-time badge-plain">
                {formatDuration(task.timeElapsed)} {task.isRunning && '⏳計時中'}
              </span>
              {task.dueDate && (
                <span className="badge badge-date">
                  <Calendar size={12}/> {task.dueDate}
                </span>
              )}
              {task.isImportant && (
                <span className="badge badge-important">
                  <AlertCircle size={12}/> 重要
                </span>
              )}
              {computedUrgent && (
                <span className="badge badge-urgent">
                  <AlertTriangle size={12}/> 緊急
                </span>
              )}
            </div>
          </div>
        )}
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
