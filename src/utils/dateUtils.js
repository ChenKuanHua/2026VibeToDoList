/**
 * 檢查給定的日期（'YYYY-MM-DD'）是否在今天算起的 3 天以內
 */
export const isWithinThreeDays = (dateStr) => {
  if (!dateStr) return false;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0); // 歸零今天的時分秒，取得純日期
  
  const targetDate = new Date(dateStr);
  targetDate.setHours(0, 0, 0, 0);

  const diffTime = targetDate - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

  // diffDays >= 0 確保不是已經過期非常久的（如果是負數，也可以當作緊急，因為已經過期）
  // 我們一併把過期 (diffDays <= 0) 及 3天內 (diffDays <= 3) 的都視為緊急
  return diffDays <= 3;
};

/**
 * 取得計算後的緊急狀態（若符合三日條件則自動變成緊急）
 */
export const checkIsUrgent = (isUrgentState, dueDate) => {
  if (isUrgentState) return true; // 使用者勾選了緊急，那就是緊急
  if (dueDate && isWithinThreeDays(dueDate)) return true; // 有日期且在三日內
  return false;
};
