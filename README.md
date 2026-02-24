# 課程輔助學習系統

一個基於 Next.js 14 (App Router) + TypeScript + Tailwind CSS 的課程輔助學習系統前端應用。

## 功能特色

- 📚 **課程列表**：瀏覽所有可用課程
- 📖 **課程總覽**：查看課程詳細資訊與章節列表
- 🎥 **影片播放**：HTML5 影片播放器
- 🔐 **OAuth 登入**：支援 Google、GitHub 登入（NextAuth.js）
- 🤖 **AI 助教（RAG）**：即時聊天，可依課程／章節檢索知識庫並由 LLM 回答；未設定 API key 時自動 fallback 至 mock
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

### OAuth 登入（Google / GitHub）

1. 複製環境變數範例：`cp .env.example .env.local`
2. 產生 `NEXTAUTH_SECRET`：`openssl rand -base64 32`，填入 `.env.local`
3. **Google**：到 [Google Cloud Console](https://console.cloud.google.com/apis/credentials) 建立 OAuth 2.0 用戶端 ID，授權重新導向 URI 設為 `http://localhost:3000/api/auth/callback/google`
4. **GitHub**：到 [GitHub Developer settings](https://github.com/settings/developers) → OAuth Apps 新增應用，Authorization callback URL 設為 `http://localhost:3000/api/auth/callback/github`
5. 將取得的 Client ID、Client Secret 填入 `.env.local` 對應欄位

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
├── data/                   # RAG 知識庫
│   └── ragContent.ts      # 課程／章節內容片段與檢索
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

#### AI 助教功能（RAG）
- 聊天訊息列表（支援 Markdown）
- 輸入框與送出按鈕
- 「插入時間戳」按鈕：將當前影片時間插入輸入框
- **RAG 串接**：依目前課程／章節從知識庫檢索相關內容，再交由 OpenAI 產生回覆；若未設定 `OPENAI_API_KEY` 或 API 失敗則使用 mock 回覆
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

## AI 助教 RAG 設定

AI 助教使用 **RAG（Retrieval-Augmented Generation）**：先從課程知識庫檢索與問題相關的片段，再將這些內容與使用者問題一併送給 LLM 產生回答。

### 方式一：Hugging Face（推薦，使用現成模型如 Llama 3.2）

1. 在 [Hugging Face](https://huggingface.co/settings/tokens) 建立 Access Token，並開啟 **Inference** 權限。
2. 在專案根目錄建立 `.env.local`：
   ```env
   HUGGINGFACE_API_KEY=hf_xxxx
   # 可選，預設為 meta-llama/Llama-3.2-3B-Instruct
   HF_MODEL=meta-llama/Llama-3.2-3B-Instruct
   ```
3. 重新啟動 `npm run dev`。若同時設定了 `HUGGINGFACE_API_KEY` 與 `OPENAI_API_KEY`，會優先使用 Hugging Face。  
   **注意**：部分模型（如 `meta-llama/Llama-3.2-3B-Instruct`）需在 Hugging Face 上同意授權並取得存取權限後才能透過 Inference API 使用。

### 方式二：OpenAI

1. 在專案根目錄建立 `.env.local`，加入：
   ```env
   OPENAI_API_KEY=sk-your-openai-api-key
   ```
2. 重新啟動 `npm run dev`。

### 知識庫與檢索

- 知識庫來源：`src/data/ragContent.ts`，內含課程／章節對應的內容片段（title、content、keywords）。
- 檢索方式：依 `courseId`、`lessonId` 篩選後，以關鍵字重疊做簡單檢索，取前 5 個片段作為 LLM 的 context。
- 擴充方式：在 `ragChunks` 中新增片段，或改寫 `retrieveChunks` 改接向量資料庫（如 Pinecone、Supabase pgvector）。

### 未設定 API key 時

若未設定 `HUGGINGFACE_API_KEY` 與 `OPENAI_API_KEY`，`/api/chat` 會回傳 503，前端會自動改為使用內建 mock 回覆，不影響一般操作。

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

