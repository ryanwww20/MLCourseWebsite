"use client";

import { useState, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  videoTimestamp?: string;
}

const CHAT_STORAGE_PREFIX = "chat:";
const CHAT_TABS_PREFIX = "chat-tabs:";
const COMMENT_STORAGE_PREFIX = "comments:";

function generateTabId(): string {
  return `t${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export interface Comment {
  id: string;
  content: string;
  author: string;
  createdAt: string;
}

const DEFAULT_WELCOME: Message = {
  id: "welcome",
  role: "assistant",
  content: "您好！我是 AI 助教，有什麼問題都可以問我。",
  timestamp: "",
};

/** 每個 tab 的對話用 courseId:lessonId:tabId 儲存 */
function getChatStorageKey(courseId: string, lessonId: string, tabId: string): string {
  return `${CHAT_STORAGE_PREFIX}${courseId}:${lessonId}:${tabId}`;
}

function getChatTabsStorageKey(courseId: string, lessonId: string): string {
  return `${CHAT_TABS_PREFIX}${courseId}:${lessonId}`;
}

const TAB_TITLE_MAX_LEN = 14;

/** 從對話中擷取第一則使用者訊息的摘要作為 tab 標題 */
function getSummaryFromMessages(messages: Message[]): string | null {
  const firstUser = messages.find((m) => m.role === "user");
  if (!firstUser?.content) return null;
  const stripped = firstUser.content.replace(/\[\d{2}:\d{2}\]\s*/, "").trim();
  if (!stripped) return null;
  if (stripped.length <= TAB_TITLE_MAX_LEN) return stripped;
  return stripped.slice(0, TAB_TITLE_MAX_LEN) + "…";
}

interface ChatTabsData {
  tabIds: string[];
  titles: Record<string, string>;
}

function loadChatTabsFromStorage(courseId: string, lessonId: string): ChatTabsData {
  if (typeof window === "undefined") return { tabIds: [], titles: {} };
  try {
    const raw = localStorage.getItem(getChatTabsStorageKey(courseId, lessonId));
    if (!raw) return { tabIds: [], titles: {} };
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return { tabIds: parsed, titles: {} };
    }
    if (parsed && Array.isArray(parsed.tabIds) && parsed.tabIds.length > 0) {
      return {
        tabIds: parsed.tabIds,
        titles: typeof parsed.titles === "object" && parsed.titles !== null ? parsed.titles : {},
      };
    }
    return { tabIds: [], titles: {} };
  } catch {
    return { tabIds: [], titles: {} };
  }
}

function saveChatTabsToStorage(courseId: string, lessonId: string, data: ChatTabsData) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(getChatTabsStorageKey(courseId, lessonId), JSON.stringify(data));
  } catch {
    // ignore
  }
}

function loadChatFromStorage(key: string): Message[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Message[];
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : null;
  } catch {
    return null;
  }
}

function saveChatToStorage(key: string, messages: Message[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(messages));
  } catch {
    // ignore quota or parse errors
  }
}

function getCommentStorageKey(courseId: string, lessonId: string): string {
  return `${COMMENT_STORAGE_PREFIX}${courseId}:${lessonId}`;
}

function loadCommentsFromStorage(courseId: string, lessonId: string): Comment[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(getCommentStorageKey(courseId, lessonId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Comment[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveCommentsToStorage(courseId: string, lessonId: string, comments: Comment[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(getCommentStorageKey(courseId, lessonId), JSON.stringify(comments));
  } catch {
    // ignore
  }
}

interface ChatPanelProps {
  courseId: string;
  lessonId: string;
  /** 目前課程／影片標題，傳給 RAG 後端做 video_context */
  lessonTitle?: string | null;
  currentVideoTime: number;
  /** 登入使用者的 id，有值時會依使用者＋課程＋章節儲存聊天記錄 */
  userId?: string | null;
  /** 僅顯示單一區塊時使用；未傳則顯示分頁（AI 助教 / 留言區） */
  mode?: "chat" | "comments";
}

/** 將秒數轉成 RAG 接受的時間格式：MM:SS 或 H:MM:SS */
function formatVideoTimestamp(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export default function ChatPanel({ courseId, lessonId, lessonTitle = null, currentVideoTime, userId = null, mode }: ChatPanelProps) {
  const [tabIds, setTabIds] = useState<string[]>([]);
  const [titlesByTab, setTitlesByTab] = useState<Record<string, string>>({});
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [messagesByTab, setMessagesByTab] = useState<Record<string, Message[]>>({});
  const [hasLoadedTabs, setHasLoadedTabs] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentInput, setCommentInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const commentsEndRef = useRef<HTMLDivElement>(null);

  /** 目前選中 tab 的對話（供顯示與送訊） */
  const messages = activeTabId ? (messagesByTab[activeTabId] ?? [DEFAULT_WELCOME]) : [];
  const setMessages = (updater: Message[] | ((prev: Message[]) => Message[])) => {
    if (!activeTabId) return;
    setMessagesByTab((prev) => {
      const next = { ...prev };
      const nextList = typeof updater === "function" ? updater(next[activeTabId] ?? [DEFAULT_WELCOME]) : updater;
      next[activeTabId] = nextList;
      return next;
    });
  };

  /** 未傳 mode 時同時顯示 AI 助教與留言區（上下排列）；傳 mode 時只顯示該區塊 */
  const showChat = !mode || mode === "chat";
  const showComments = !mode || mode === "comments";

  // 載入此課程／章節的 tab 列表、標題與各 tab 對話
  useEffect(() => {
    const { tabIds: ids, titles } = loadChatTabsFromStorage(courseId, lessonId);
    if (ids.length === 0) {
      const firstId = generateTabId();
      setTabIds([firstId]);
      setTitlesByTab({});
      setActiveTabId(firstId);
      setMessagesByTab({ [firstId]: [DEFAULT_WELCOME] });
      saveChatTabsToStorage(courseId, lessonId, { tabIds: [firstId], titles: {} });
    } else {
      setTabIds(ids);
      setTitlesByTab(titles);
      setActiveTabId(ids[0]);
      const byTab: Record<string, Message[]> = {};
      ids.forEach((id) => {
        const stored = loadChatFromStorage(getChatStorageKey(courseId, lessonId, id));
        byTab[id] = stored && stored.length > 0 ? stored : [DEFAULT_WELCOME];
      });
      setMessagesByTab(byTab);
    }
    setHasLoadedTabs(true);
  }, [courseId, lessonId]);

  // tab 列表與標題變更時寫回
  useEffect(() => {
    if (!hasLoadedTabs || tabIds.length === 0) return;
    saveChatTabsToStorage(courseId, lessonId, { tabIds, titles: titlesByTab });
  }, [tabIds, titlesByTab, hasLoadedTabs, courseId, lessonId]);

  // 當某 tab 有新的使用者訊息時，依第一則使用者訊息更新該 tab 標題
  useEffect(() => {
    if (!hasLoadedTabs) return;
    let updated = false;
    const nextTitles = { ...titlesByTab };
    tabIds.forEach((tabId) => {
      const list = messagesByTab[tabId];
      if (!list) return;
      const summary = getSummaryFromMessages(list);
      if (summary != null && nextTitles[tabId] !== summary) {
        nextTitles[tabId] = summary;
        updated = true;
      }
    });
    if (updated) setTitlesByTab(nextTitles);
  }, [messagesByTab, hasLoadedTabs, tabIds]);

  // 當前 tab 的對話變更時寫入 localStorage
  useEffect(() => {
    if (!hasLoadedTabs || !activeTabId) return;
    const list = messagesByTab[activeTabId];
    if (list) saveChatToStorage(getChatStorageKey(courseId, lessonId, activeTabId), list);
  }, [messagesByTab, activeTabId, hasLoadedTabs, courseId, lessonId]);

  const getTabTitle = (tabId: string, index: number): string => {
    return titlesByTab[tabId] ?? `對話 ${index + 1}`;
  };

  const addChatTab = () => {
    const newId = generateTabId();
    setTabIds((prev) => [...prev, newId]);
    setActiveTabId(newId);
    setMessagesByTab((prev) => ({ ...prev, [newId]: [DEFAULT_WELCOME] }));
  };

  const removeChatTab = (tabId: string) => {
    if (tabIds.length <= 1) return;
    const newIds = tabIds.filter((id) => id !== tabId);
    setTabIds(newIds);
    setTitlesByTab((prev) => {
      const next = { ...prev };
      delete next[tabId];
      return next;
    });
    setMessagesByTab((prev) => {
      const next = { ...prev };
      delete next[tabId];
      return next;
    });
    if (activeTabId === tabId && newIds.length > 0) {
      const oldIdx = tabIds.indexOf(tabId);
      setActiveTabId(newIds[Math.min(oldIdx, newIds.length - 1)] ?? newIds[0]);
    }
  };

  // 切換課程／章節時清掉 RAG 對話 id，視為新對話
  useEffect(() => {
    setConversationId(null);
  }, [courseId, lessonId]);

  // 載入此課程／章節的留言
  useEffect(() => {
    setComments(loadCommentsFromStorage(courseId, lessonId));
  }, [courseId, lessonId]);

  // 留言變更時寫入 localStorage
  useEffect(() => {
    saveCommentsToStorage(courseId, lessonId, comments);
  }, [courseId, lessonId, comments]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 切換 tab 時清空輸入框，避免誤送到別的分頁
  useEffect(() => {
    setInput("");
  }, [activeTabId]);

  const scrollCommentsToBottom = () => {
    commentsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (showComments) scrollCommentsToBottom();
  }, [showComments, comments]);

  const handleSubmitComment = () => {
    const content = commentInput.trim();
    if (!content) return;
    const author = session?.user?.name ?? session?.user?.email ?? "訪客";
    const newComment: Comment = {
      id: Date.now().toString(),
      content,
      author,
      createdAt: new Date().toLocaleString("zh-TW"),
    };
    setComments((prev) => [...prev, newComment]);
    setCommentInput("");
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const startNewChat = async () => {
    if (conversationId) {
      try {
        await fetch("/api/conversation/new", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ conversation_id: conversationId }),
        });
      } catch {
        // ignore
      }
      setConversationId(null);
    }
    setMessages([DEFAULT_WELCOME]);
  };

  const insertTimestamp = () => {
    const timestamp = `[${formatTime(currentVideoTime)}] `;
    setInput((prev) => timestamp + prev);
  };

  const insertCommentTimestamp = () => {
    const timestamp = `[${formatTime(currentVideoTime)}] `;
    setCommentInput((prev) => timestamp + prev);
  };

  const generateMockResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();
    if (lowerMessage.includes("梯度") || lowerMessage.includes("gradient")) {
      return "梯度下降是一種優化演算法，用於尋找函數的最小值。它通過計算損失函數對參數的梯度，然後沿著梯度的反方向更新參數。";
    }
    if (lowerMessage.includes("神經網路") || lowerMessage.includes("neural")) {
      return "神經網路是由多個層級組成的計算模型，每一層包含多個神經元。通過前向傳播和反向傳播，神經網路可以學習複雜的模式。";
    }
    if (lowerMessage.includes("過擬合") || lowerMessage.includes("overfitting")) {
      return "過擬合是指模型在訓練資料上表現很好，但在測試資料上表現較差的現象。可以通過正則化、dropout、增加資料量等方法來緩解。";
    }
    if (lowerMessage.includes("損失函數") || lowerMessage.includes("loss")) {
      return "損失函數用來衡量模型預測值與真實值之間的差異。常見的損失函數包括均方誤差（MSE）和交叉熵（Cross-Entropy）。";
    }
    return "這是一個很好的問題！根據您提到的內容，我建議您可以參考課程教材中的相關章節，或者查看相關的補充資料。如果還有其他問題，歡迎繼續提問！";
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const videoTimestamp = input.match(/\[(\d{2}:\d{2})\]/)?.[1];
    const cleanContent = input.replace(/\[\d{2}:\d{2}\]\s*/, "");

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date().toLocaleTimeString("zh-TW"),
      videoTimestamp: videoTimestamp,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const payload: Record<string, unknown> = {
        courseId,
        lessonId,
        message: cleanContent,
        videoTimestamp: videoTimestamp ?? formatVideoTimestamp(currentVideoTime),
        conversation_id: conversationId ?? undefined,
      };
      if (lessonTitle) payload.video_name = lessonTitle;

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json() as { content?: string; conversation_id?: string; error?: string; details?: string };

      if (!res.ok) {
        throw new Error(data.error || data.details || "Request failed");
      }

      if (data.conversation_id) setConversationId(data.conversation_id);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.content ?? "抱歉，我暫時無法產生回覆。",
        timestamp: new Date().toLocaleTimeString("zh-TW"),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch {
      // RAG API 不可用時 fallback 到 mock
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: generateMockResponse(cleanContent),
        timestamp: new Date().toLocaleTimeString("zh-TW"),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const { data: session } = useSession();

  return (
    <div className="flex flex-col h-full bg-surface border border-transparent rounded-lg overflow-hidden">
      {showChat && (
        <>
      {/* 可橫向滑動的 tab 列，右側為新增 tab 按鈕；關閉鈕 hover 時顯示並覆蓋標題右側 */}
      <div className="flex items-center border-b border-border flex-shrink-0 min-h-0">
        <div className="flex-1 min-w-0 overflow-x-auto overflow-y-hidden">
          <div className="flex items-center gap-1 py-1.5 px-2">
            {tabIds.map((tabId, index) => (
              <div
                key={tabId}
                className={`group relative flex-shrink-0 rounded-t-md ${activeTabId === tabId ? "bg-surface border border-b-0 border-border -mb-px" : ""}`}
              >
                <button
                  type="button"
                  onClick={() => setActiveTabId(tabId)}
                  className={`w-full pl-3 pr-7 py-1.5 text-sm text-left rounded-t-md whitespace-nowrap transition-colors ${activeTabId === tabId ? "text-foreground font-medium" : "text-muted hover:text-foreground hover:bg-foreground/5"}`}
                >
                  <span className="block truncate max-w-[8rem]" title={getTabTitle(tabId, index)}>
                    {getTabTitle(tabId, index)}
                  </span>
                </button>
                {tabIds.length > 1 && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); removeChatTab(tabId); }}
                    className="absolute right-0.5 top-1/2 -translate-y-1/2 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity text-muted hover:text-foreground hover:bg-foreground/10 bg-surface border border-transparent"
                    aria-label="關閉分頁"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
                      <path d="M3.72 3.72a.75.75 0 0 1 1.06 0L8 6.94l3.22-3.22a.75.75 0 1 1 1.06 1.06L9.06 8l3.22 3.22a.75.75 0 1 1-1.06 1.06L8 9.06l-3.22 3.22a.75.75 0 0 1-1.06-1.06L6.94 8 3.72 4.78a.75.75 0 0 1 0-1.06Z" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
        <button
          type="button"
          onClick={startNewChat}
          className="flex-shrink-0 px-2 py-1.5 text-xs text-muted hover:text-foreground hover:bg-foreground/10 rounded transition-colors"
        >
          新對話
        </button>
        <button
          type="button"
          onClick={addChatTab}
          className="flex-shrink-0 p-2 m-1 rounded-md text-muted hover:text-foreground hover:bg-foreground/10 transition-colors"
          aria-label="新增對話"
          title="新增對話"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
            <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-6 space-y-4 min-h-0">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {message.role === "assistant" ? (
              <div className="max-w-[80%]">
                <div className="prose prose-sm max-w-none">
                  <ReactMarkdown
                    remarkPlugins={[remarkMath]}
                    rehypePlugins={[[rehypeKatex, { throwOnError: false, strict: false }]]}
                  >
                    {message.content}
                  </ReactMarkdown>
                </div>
                {message.videoTimestamp && (
                  <div className="mt-2">
                    <span className="text-xs px-1.5 py-0.5 bg-foreground/10 text-muted rounded">
                      {message.videoTimestamp}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="max-w-[80%] rounded-lg p-3 bg-accent">
                <p className="whitespace-pre-wrap text-black">{message.content}</p>
                {message.videoTimestamp && (
                  <div className="mt-2">
                    <span className="text-xs px-1.5 py-0.5 bg-background/20 rounded">
                      {message.videoTimestamp}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="max-w-[80%] rounded-2xl rounded-tl-sm px-4 py-3 bg-foreground/10">
              <div className="flex items-center gap-1.5">
                <span className="typing-dot w-2 h-2 rounded-full bg-muted shrink-0" />
                <span className="typing-dot w-2 h-2 rounded-full bg-muted shrink-0" />
                <span className="typing-dot w-2 h-2 rounded-full bg-muted shrink-0" />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="px-4 pb-4 flex-shrink-0">
        <div className="border border-border rounded-xl p-3 space-y-2">
          <div className="flex items-center space-x-2">
            <button
              onClick={insertTimestamp}
              className="px-3 py-1.5 text-sm bg-foreground/10 hover:bg-foreground/20 rounded-md transition-colors text-foreground"
            >
              插入時間戳
            </button>
            <span className="text-xs text-muted">
              目前時間: {formatTime(currentVideoTime)}
            </span>
          </div>
          <div className="flex space-x-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSend()}
              placeholder="輸入問題..."
              className="flex-1 min-h-10 px-3 py-2 border border-border rounded-md text-black focus:outline-none focus:ring-2 focus:ring-accent"
            />
            <button
              onClick={handleSend}
              disabled={isLoading}
              className={`relative px-4 py-2 bg-accent text-white rounded-2xl transition flex items-center justify-center disabled:opacity-60 disabled:cursor-not-allowed overflow-hidden ${!isLoading && input.trim() ? "shadow-md before:content-[''] before:absolute before:inset-0 before:bg-black/25 before:rounded-2xl" : "shadow-sm"}`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="relative w-5 h-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
        </>
      )}

      {showComments && (
        <>
      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-6 space-y-3 min-h-0">
        {comments.length === 0 ? (
          <p className="text-sm text-muted">尚無留言，來留一句吧～</p>
        ) : (
          comments.map((c) => (
            <div key={c.id} className="rounded-lg p-3 bg-foreground/5 border border-border">
              <p className="text-sm text-foreground whitespace-pre-wrap">{c.content}</p>
              <p className="text-xs text-muted mt-1">{c.author} · {c.createdAt}</p>
            </div>
          ))
        )}
        <div ref={commentsEndRef} />
      </div>
      <div className="px-4 pb-4 flex-shrink-0">
        <div className="border border-border rounded-xl p-3 space-y-2">
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={insertCommentTimestamp}
              className="px-3 py-1.5 text-sm bg-foreground/10 hover:bg-foreground/20 rounded-md transition-colors text-foreground"
            >
              插入時間戳
            </button>
            <span className="text-xs text-muted">
              目前時間: {formatTime(currentVideoTime)}
            </span>
          </div>
          <div className="flex space-x-2">
            <textarea
              value={commentInput}
              onChange={(e) => setCommentInput(e.target.value)}
              placeholder="輸入留言..."
              rows={1}
              className="flex-1 min-h-10 px-3 py-2 border border-border rounded-md text-black resize-none focus:outline-none focus:ring-2 focus:ring-accent"
            />
            <button
              type="button"
              onClick={handleSubmitComment}
              disabled={!commentInput.trim()}
              className={`relative px-4 py-2 bg-accent text-white rounded-2xl transition flex items-center justify-center disabled:opacity-60 disabled:cursor-not-allowed overflow-hidden ${commentInput.trim() ? "shadow-md before:content-[''] before:absolute before:inset-0 before:bg-black/25 before:rounded-2xl" : "shadow-sm"}`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="relative w-5 h-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
        </>
      )}
    </div>
  );
}

