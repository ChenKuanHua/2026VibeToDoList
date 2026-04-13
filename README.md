# Vibe Flow (Let's Stand & Task Pomo)

<div align="center">
  <img src="./logo.svg" alt="Logo" width="150" />
</div>

一款結合了「番茄鐘 (Pomodoro)」與「艾森豪矩陣 (Eisenhower Matrix)」的極簡風辦公工具包。專為追求效率與生活質感的辦公人士設計。除了原有的 **NASM CPT** 伸展提示與 **Google Sheets 雲端同步**外，最新版本更導入了 **SortableJS 拖拽分類**與**智慧排序系統**，讓任務管理變得前所未有的直覺與優雅。

## 🌟 核心特色 (最新進化)

### 1. 拖拽式分類與排序 (SortableJS Integration)
- **直覺操作**：不再需要手動調整標籤。直接將任務從「重要但不緊急」拖入「重要且緊急」，系統會自動在後台更新該任務的權重屬性。
- **跨視圖連動**：在「列表模式」中拖拽可自定義個人順序；在「矩陣模式」中拖拽則可快速切換任務象限。

### 2. 智慧與手動雙規排序
- **智慧模式 (Smart Sort)**：系統根據艾森豪矩陣權重 + 任務新增時間，自動將最新的重要任務推至頂部。
- **手動模式 (Manual Sort)**：一旦您手動拖動過任何一個任務，系統即刻記住您的個人偏好，並將此順序持久化儲存。

### 3. 進階任務過濾系統
- **多維度分頁**：提供「執行中 (Active)」、「全部 (All)」、「已完成 (Completed)」三種分頁模式，幫助您在繁雜的日常中聚焦於當下最核心的目標。
- **動態計分板**：即時回饋目前的任務完成進度 (例如：3 / 10)，激發您的成就感。

### 4. 極致 Premium UI/UX 拋光
- **微動畫效果**：任務新增時的淡入動畫、按鈕 Hover 時的深度陰影，以及切換模式時的平滑轉場。
- **毛玻璃質感 (Glassmorphism)**：優化了背景層級與邊框對比，在深色與淺色模式下皆保持極佳的易讀性與高級感。

---

## 🛠️ 技術架構

- **Core**: Vanilla JavaScript (ES6+), HTML5, CSS3
- **Dragging**: [SortableJS](https://sortablejs.github.io/Sortable/)
- **Icons**: [Lucide Icons](https://lucide.dev/)
- **Data**: Google Sheets API v4 + Google Identity Services (OAuth 2.0)
- **Caching**: LocalStorage + Version-based cache busting

## 🚀 快速開始

1. **Clone 專案**：
   ```bash
   git clone https://github.com/ChenKuanHua/DailyTask12-ToDoList.git
   ```
2. **啟動伺服器**：
   ```bash
   # 使用 Python 快速開啟
   python -m http.server 8080
   ```
3. **瀏覽器訪問**：開啟 `http://localhost:8080` 即可使用。

---

## 📅 版本紀錄
*   **v1.1.0 (Current)**：新增拖拽排序、任務分頁過濾、UI 動畫優化、修復初始化 Race Condition。
*   **v1.0.0**：初始版本，包含番茄鐘、基本列表、Google Sheets 同步。

## 👤 作者
**ChenKuanHua** & **Antigravity AI**
*   GitHub: [@ChenKuanHua](https://github.com/ChenKuanHua)
