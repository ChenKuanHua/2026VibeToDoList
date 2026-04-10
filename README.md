# Vibe Flow (Let's Stand & Task Pomo)

<div align="center">
  <img src="./logo.svg" alt="Logo" width="150" />
</div>

一款結合了「番茄鐘 (Pomodoro)」與「代辦事項 (To-Do List)」的極簡風辦公工具包。專為長時間久坐的辦公人士設計，不僅能在休息時隨機推送符合 **NASM CPT** 標準的伸展提示，更在最新版本中導入了 **純前端介接的 Google Sheets 雲端一條龍同步機制**，為您打造完全屬於您的私密雲端資料庫。

## 🌟 核心特色

- **零伺服器雲端同步 (Google Sheets Sync)**：
  捨棄傳統伺服器與資料庫，透過 Google Identity Services (GIS) 與 OAuth 2.0，直接將使用者的 Google Drive 轉化為專屬資料庫。系統會自動在您的雲端硬碟建立名為 `VibeToDoList` 的單一試算表，實現跨設備無縫存取，所有任務增刪改查皆受到完美同步防護。
- **嚴謹的雙軌儲存隔離系統**：
  若未登入，資料預設將安全保存在瀏覽器的 `Local Storage` 中；一旦登入，不僅啟用防暴衝的自動非同步寫入技術，還會將「雲端」與「本地」的資料做最安全的強制分離，守護您的閱讀隱私。
- **極簡溫暖感介面與 Lucide 質感圖示**：
  融合低飽和色彩、平滑微動畫以及質感滿分的 **Lucide** 向量圖表庫，完全取代傳統的 Emoji。支援深淺色（Dark/Light Mode）主題無縫切換，帶來無壓力的操作體驗。
- **神準的「番茄鐘 x 代辦」計時連動**：
  追蹤特定任務時，一旦番茄鐘進入休息時間，任務的累積計時器會被「自動暫停」，嚴格排除休息時間。
- **艾森豪矩陣 (Eisenhower Matrix) 雙視圖**：
  提供傳統「列表檢視」與「四象限矩陣檢視」，並具備智慧推算功能（例如到期日 3 天內自動判定為具備「緊急」屬性）。
- **NASM CPT 伸展提示**：
  番茄鐘休息時，自動隨機推送「坐姿梨狀肌伸展」、「胸大肌伸展」等預防久坐酸痛的辦公室放鬆動作。

## 🚀 系統架構流 (無伺服器架構)

本專案採用 **Vanilla JavaScript + HTML5 + CSS3** 的原生架構進行極致編譯，並無縫疊加了最新的 Google API 邏輯，徹底實作了「網頁版無後端，卻能永久保存」的新技術哲學。

```mermaid
graph TD
    classDef user fill:#FFDAB9,stroke:#e65c00,stroke-width:2px;
    classDef cloud fill:#ADD8E6,stroke:#00509e,stroke-width:2px;
    classDef local fill:#98FB98,stroke:#006400,stroke-width:2px;
    classDef logic fill:#E6E6FA,stroke:#4b0082,stroke-width:2px;

    User([使用者 User]):::user -->|打開網頁或操作任務| UI[VibeToDoList 原生 JS 前端介面]:::logic
    
    subgraph Authentication [1. Google 權限驗證樞紐]
        GIS[Google Identity Services 快顯登入]
        OAuth[OAuth 2.0 取得存取 Token]
    end

    subgraph DataStorage [2. 雙軌資料儲存與狀態管理]
        LocalStorage[(瀏覽器 Local Storage)]:::local
        RAM([前端 DOM 渲染核心]):::logic
        GoogleSheet[(個人專屬 Google Sheet)]:::cloud
    end

    UI -->|點擊登入授權| GIS
    GIS -->|發放| OAuth
    
    UI -->|每次動作 (新增/完成/計時)| StateCheck{是否已登入?}:::logic
    
    StateCheck -->|否: 存入本地| LocalStorage
    StateCheck -->|是: 啟動防暴衝機制| OAuth

    OAuth -->|驗證最高隱私 scopes| SheetAPI[Google Drive / Sheets API]:::cloud
    
    SheetAPI -.->|尋找或自動建立| GoogleSheet
    
    GoogleSheet -.->|讀取並覆寫| RAM
    LocalStorage -.->|離線加載| RAM
    
    RAM -->|響應式更新| View[艾森豪矩陣 / 列表 雙視圖]
```

### 開發疊代與架構亮點
1. **Google Sheets As A Database**：精確控制 API 的要求範疇 (Scopes)。僅索取 `drive.file` 單一權限，避開了令人不安的全域存取警告，達到極高的信賴感。
2. **防暴衝的 Debounce 背景上傳**：重新自定義了所有 UI 操作的存檔邏輯。為保護 API 額度並提供流暢無卡頓的連線品質，系統會在您持續操作結束的 1 秒鐘後，才自動在背景完成陣列對應並封裝送出給 Google。
3. **原生 JS 的藝術 (No Frameworks)**：完全捨棄 React/Vue 架構。運用模組化思維撰寫 Vanilla JS，透過精準的 DOM 操作，卻實現了同等於前端框架的高效防呆與畫面熱更新。
4. **無伺服器運行 (Zero Build Step)**：為了做到真正的「隨開即用」，專案無需任何 `npm install`。所有外部依賴皆採 CDN 引入形式，直接雙擊 `index.html` 即可在瀏覽器完美運行。

## 🛠️ 如何執行
專案為完全純前端應用程式，您無需安裝任何編譯套件或 Node 環境：
- **方式一：** 使用 VS Code 的 **Live Server** 擴充套件，對 `index.html` 點擊 Go Live。
- **方式二：** 將本資料夾直接 push 到 **GitHub Pages** 等任何靜態網頁託管服務，利用您的網域運行。
- *(註：若要在您的專屬網域運作 Google 登入功能，請務必先至 GCP 後台設定您的「已授權 JavaScript 來源」網址)*
