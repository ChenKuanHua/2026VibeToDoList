import React, { useState } from 'react';
import { useTimer } from '../context/TimerContext';
import TaskItem from './TaskItem';
import { Plus } from 'lucide-react';
import './Task.css';

const TaskList = () => {
  const { tasks, addTask } = useTimer();
  const [newTaskTitle, setNewTaskTitle] = useState('');

  const handleAdd = (e) => {
    e.preventDefault();
    if (newTaskTitle.trim()) {
      addTask(newTaskTitle);
      setNewTaskTitle('');
    }
  };

  return (
    <div className="task-list-section">
      <div className="task-header">
        <h2>代辦事項</h2>
        <span className="task-count">
          {tasks.filter(t => t.completed).length} / {tasks.length}
        </span>
      </div>

      <form className="add-task-form" onSubmit={handleAdd}>
        <input 
          type="text" 
          placeholder="新增任務..." 
          value={newTaskTitle}
          onChange={(e) => setNewTaskTitle(e.target.value)}
        />
        <button type="submit" className="add-btn" disabled={!newTaskTitle.trim()}>
          <Plus size={20} />
        </button>
      </form>

      <div className="task-list">
        {tasks.map(task => (
          <TaskItem key={task.id} task={task} />
        ))}
      </div>
    </div>
  );
};

export default TaskList;
