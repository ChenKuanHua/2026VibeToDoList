import React, { useState } from 'react';
import { useTimer } from '../context/TimerContext';
import TaskItem from './TaskItem';
import EisenhowerMatrix from './EisenhowerMatrix';
import { Plus, LayoutList, Grid } from 'lucide-react';
import './Task.css';

const TaskList = () => {
  const { tasks, addTask } = useTimer();
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newDueDate, setNewDueDate] = useState('');
  const [newIsImportant, setNewIsImportant] = useState(false);
  const [newIsUrgent, setNewIsUrgent] = useState(false);
  
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'matrix'

  const handleAdd = (e) => {
    e.preventDefault();
    if (newTaskTitle.trim()) {
      addTask(newTaskTitle, newDueDate, newIsImportant, newIsUrgent);
      setNewTaskTitle('');
      setNewDueDate('');
      setNewIsImportant(false);
      setNewIsUrgent(false);
    }
  };

  // 排序：緊急且重要的排前面
  const sortedTasks = [...tasks].sort((a, b) => {
    if (viewMode !== 'list') return 0;
    const scoreA = (a.isImportant ? 2 : 0) + (a.isUrgent ? 1 : 0);
    const scoreB = (b.isImportant ? 2 : 0) + (b.isUrgent ? 1 : 0);
    return scoreB - scoreA;
  });

  return (
    <div className="task-list-section">
      <div className="task-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <h2>代辦事項</h2>
          <div className="view-toggles">
            <button className={`toggle-btn ${viewMode === 'list' ? 'active' : ''}`} onClick={() => setViewMode('list')} title="列表檢視">
              <LayoutList size={20} />
            </button>
            <button className={`toggle-btn ${viewMode === 'matrix' ? 'active' : ''}`} onClick={() => setViewMode('matrix')} title="艾森豪矩陣檢視">
              <Grid size={20} />
            </button>
          </div>
        </div>
        <span className="task-count">
          {tasks.filter(t => t.completed).length} / {tasks.length}
        </span>
      </div>

      <form className="add-task-form" onSubmit={handleAdd}>
        <div className="add-task-inputs">
          <input 
            type="text" 
            placeholder="新增任務..." 
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            className="main-input"
          />
          <div className="add-task-extras">
            <input 
              type="date" 
              value={newDueDate}
              onChange={(e) => setNewDueDate(e.target.value)}
              className="date-input"
            />
            <div className="checkbox-group">
              <label className="custom-checkbox important-checkbox">
                <input type="checkbox" checked={newIsImportant} onChange={(e) => setNewIsImportant(e.target.checked)} />
                <span className="checkmark important-check"></span>
                重要
              </label>
              <label className="custom-checkbox urgent-checkbox">
                <input type="checkbox" checked={newIsUrgent} onChange={(e) => setNewIsUrgent(e.target.checked)} />
                <span className="checkmark urgent-check"></span>
                緊急
              </label>
            </div>
          </div>
        </div>
        <button type="submit" className="add-btn" disabled={!newTaskTitle.trim()}>
          <Plus size={20} />
        </button>
      </form>

      <div className="task-view-container">
        {viewMode === 'list' ? (
          <div className="task-list">
            {sortedTasks.map(task => (
              <TaskItem key={task.id} task={task} />
            ))}
          </div>
        ) : (
          <EisenhowerMatrix />
        )}
      </div>
    </div>
  );
};

export default TaskList;
