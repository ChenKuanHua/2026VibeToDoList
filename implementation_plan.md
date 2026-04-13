# Google 登入持久化與極致拖曳排序實作計畫

本計畫將為您的待辦事項加入高互動性的拖曳功能、自動登入狀態，以及更合理的介面配置。

## User Review Required

> [!IMPORTANT]
> **拖曳與智慧排序的整合**：
> 1. **手動排序模式**：當使用者開始拖曳時，系統會自動將該檢視鎖定在「手動排序」，並記錄每個項目的 `order`。
> 2. **艾森豪矩陣拖曳**：我將實作「跨象限拖曳」。例如：將任務從「重要但不緊急」拖到「重要且緊急」時，系統會自動幫您勾選「緊急」標籤。這符合直覺的操作邏輯。
> 3. **持久化**：所有的排序與過濾偏好都會儲存在雲端（Google Sheets）或 LocalStorage。

## Proposed Changes

### [Component] 基礎與驗證 (index.html, app.js)

#### [MODIFY] [index.html](file:///d:/Dropbox/%25E5%2585%25AD%25E8%25A7%25AB%25E5%25AD%25B8%25E9%2599%25A2%25E8%25AA%25B2%25E7%25A8%258B/2026VibeCoding/DailyTask12-ToDoList/index.html)
- 在 `<head>` 加入 `SortableJS` CDN。
- 在 `add-task-form` 之後、`task-view-container` 之前，插入 `<div class="filter-bar">`。

#### [MODIFY] [app.js](file:///d:/Dropbox/%25E5%2585%25AD%25E8%25A7%25AB%25E5%25AD%25B8%25E9%2599%25A2%25E8%25AA%25B2%25E7%25A8%258B/2026VibeCoding/DailyTask12-ToDoList/app.js)
- 實作持久化登入邏輯：儲存 `googleUserEmail` 或 `googleLoggedIn` 標記。
- 頁面載入時自動執行 `checkGoogleRefresh()`。

### [Component] 高階拖曳排序系統 (app.js, app.css)

#### [MODIFY] [app.js](file:///d:/Dropbox/%25E5%2585%25AD%25E8%25A7%25AB%25E5%25AD%25B8%25E9%2599%25A2%25E8%25AA%25B2%25E7%25A8%258B/2026VibeCoding/DailyTask12-ToDoList/app.js)
- **SortableJS 初始化**：
    - 為列表檢視初始化 `Sortable`。
    - 為四個象限 (Q1~Q4) 初始化具備 `group: 'nested'` 屬性的 `Sortable`。
- **資料邏輯更新**：
    - 當拖曳發生時，更新任務的排序權重或屬性（如：跨象限移動時更新 `isImportant` / `isUrgent`）。
- **排序切換**：新增一個切換按鈕來在「智慧排序 (優先權)」與「手動排序」間切換。

#### [MODIFY] [app.css](file:///d:/Dropbox/%25E5%2585%25AD%25E8%25A7%25AB%25E5%25AD%25B8%25E9%2599%25A2%25E8%25AA%25B2%25E7%25A8%258B/2026VibeCoding/DailyTask12-ToDoList/app.css)
- 新增 `filter-bar` 樣式。
- 新增拖曳時的影子效果 (`.sortable-ghost`, `.sortable-drag`)，提升「Premium」感。
- 為任務項目增加可視的「拖曳手柄 (Drag Handle)」圖示，提示使用者可以拖曳。

## Verification Plan

### Automated/Manual Tests
- **持久化驗證**：登入 -> 重整 -> 確認依然是登入狀態。
- **過濾驗證**：點擊「執行中」-> 確保「已完成」的任務消失。
- **拖曳驗證**：
    - 在列表中拖曳 -> 確認重新整理後順序不變。
    - 在矩陣中將任務從 Q2 拖到 Q1 -> 確認任務屬性自動更新為「重要且緊急」。

## Open Questions
- 目前計畫在「智慧排序」模式下，手動排序會失效以維持邏輯一致性。當使用者開始拖曳時，系統會跳出小提示「已自動切換為手動排序模式」，這樣可以嗎？
