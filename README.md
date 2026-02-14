# 課程輔助學習系統

一個基於 Next.js 14 (App Router) + TypeScript + Tailwind CSS 的課程輔助學習系統前端應用。

## 功能特色

- 📚 **課程列表**：瀏覽所有可用課程
- 📖 **課程總覽**：查看課程詳細資訊與章節列表
- 🎥 **影片播放**：HTML5 影片播放器
- 🤖 **AI 助教**：即時聊天功能（目前為 mock 資料）
- 🔗 **相關課程**：推薦相關課程
- 📱 **響應式設計**：支援桌面與行動裝置
- 🎨 **現代化 UI**：乾淨簡潔的設計風格

## 技術棧

- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **React Markdown** (支援 Markdown 顯示)
- **React Resizable Panels** (可調整寬度的面板)

## 開始使用

### 安裝依賴

```bash
npm install
```

### 開發模式

```bash
npm run dev
```

開啟瀏覽器訪問 [http://localhost:3000](http://localhost:3000)

### 建置生產版本

```bash
npm run build
npm start
```

## 專案結構

```
src/
├── app/                    # Next.js App Router 頁面
│   ├── page.tsx           # Landing 頁面
│   ├── courses/           # 課程相關頁面
│   │   ├── page.tsx       # 課程列表
│   │   └── [courseId]/    # 動態課程路由
│   │       ├── page.tsx   # 課程總覽
│   │       └── lessons/
│   │           └── [lessonId]/
│   │               └── page.tsx  # 影片播放頁
│   ├── layout.tsx         # Root layout
│   └── globals.css        # 全域樣式
├── components/             # 可重用元件
│   ├── Navbar.tsx         # 導航列
│   ├── CourseCard.tsx     # 課程卡片
│   ├── LessonList.tsx     # 章節列表
│   ├── VideoPlayer.tsx    # 影片播放器
│   ├── ChatPanel.tsx      # AI 助教聊天面板
│   └── Tabs.tsx           # 標籤頁元件
└── mock/                  # Mock 資料
    ├── courses.ts         # 課程資料
    ├── lessons.ts         # 章節資料
    └── relatedCourses.ts  # 相關課程資料
```

## 頁面說明

### 1. Landing 頁面 (`/`)
- 系統標題與描述
- CTA 按鈕導向課程列表

### 2. 課程列表 (`/courses`)
- 顯示所有課程卡片
- 每張卡片包含：課名、學期、簡介、教師、標籤

### 3. 課程總覽 (`/courses/[courseId]`)
- 左側：課程詳細資訊
- 右側：章節列表
- 點擊章節進入影片播放頁

### 4. 影片播放頁 (`/courses/[courseId]/lessons/[lessonId]`)
- **桌面版**：左右兩欄布局（可調整寬度）
  - 左側 70%：影片播放器
  - 右側 30%：AI 助教聊天面板
- **行動版**：上下堆疊布局
  - 上方：影片播放器
  - 下方：AI 助教聊天面板

#### AI 助教功能
- 聊天訊息列表（支援 Markdown）
- 輸入框與送出按鈕
- 「插入時間戳」按鈕：將當前影片時間插入輸入框
- Mock 回覆（600-1200ms 延遲）
- 訊息自動滾動到底部

#### 相關課程標籤
- 顯示 3-5 個相關課程
- 點擊可跳轉到對應課程頁

## Mock 資料

所有資料目前存放在 `src/mock/` 目錄下：
- `courses.ts`：課程列表
- `lessons.ts`：章節列表
- `relatedCourses.ts`：相關課程對應關係

未來接 API 時，只需將這些 mock 資料的讀取改為 API 呼叫即可。

## 後續整合 API

當需要接後端 API 時，建議：

1. 在 `src/lib/` 或 `src/api/` 建立 API client
2. 將 `src/mock/` 的資料讀取改為 API 呼叫
3. 使用 React Server Components 或 Client Components 的 `useEffect` 來獲取資料
4. 保持現有的元件結構與 props 介面

## 開發注意事項

- 所有元件使用 TypeScript 嚴格模式
- 使用 Tailwind CSS 進行樣式設計
- 遵循 Next.js 14 App Router 最佳實踐
- 元件設計為可重用且易於維護

## License

MIT

