import React from 'react';
import { useTimer } from '../context/TimerContext';
import TaskItem from './TaskItem';
import { checkIsUrgent } from '../utils/dateUtils';
import './EisenhowerMatrix.css';

const EisenhowerMatrix = () => {
  const { tasks } = useTimer();

  const q1 = tasks.filter(t => t.isImportant && checkIsUrgent(t.isUrgent, t.dueDate)); // Important & Urgent
  const q2 = tasks.filter(t => t.isImportant && !checkIsUrgent(t.isUrgent, t.dueDate)); // Important & Not Urgent
  const q3 = tasks.filter(t => !t.isImportant && checkIsUrgent(t.isUrgent, t.dueDate)); // Not Important & Urgent
  const q4 = tasks.filter(t => !t.isImportant && !checkIsUrgent(t.isUrgent, t.dueDate)); // Not Important & Not Urgent

  return (
    <div className="matrix-container">
      <div className="matrix-quadrant q1">
        <h3 className="quadrant-title alert-red">🔥 重要且緊急</h3>
        <div className="quadrant-tasks">
          {q1.map(task => <TaskItem key={task.id} task={task} />)}
          {q1.length === 0 && <p className="empty-msg">無事項，太棒了！</p>}
        </div>
      </div>
      <div className="matrix-quadrant q2">
        <h3 className="quadrant-title alert-blue">⭐ 重要但不緊急</h3>
        <div className="quadrant-tasks">
          {q2.map(task => <TaskItem key={task.id} task={task} />)}
          {q2.length === 0 && <p className="empty-msg">沒有相關任務</p>}
        </div>
      </div>
      <div className="matrix-quadrant q3">
        <h3 className="quadrant-title alert-orange">⏰ 不重要但緊急</h3>
        <div className="quadrant-tasks">
          {q3.map(task => <TaskItem key={task.id} task={task} />)}
          {q3.length === 0 && <p className="empty-msg">沒有相關任務</p>}
        </div>
      </div>
      <div className="matrix-quadrant q4">
        <h3 className="quadrant-title alert-gray">🍵 不重要且不緊急</h3>
        <div className="quadrant-tasks">
          {q4.map(task => <TaskItem key={task.id} task={task} />)}
          {q4.length === 0 && <p className="empty-msg">沒有相關任務</p>}
        </div>
      </div>
    </div>
  );
};

export default EisenhowerMatrix;
