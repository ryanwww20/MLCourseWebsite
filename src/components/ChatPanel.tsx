"use client";

import { useState, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
import ReactMarkdown from "react-markdown";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  videoTimestamp?: string;
}

const CHAT_STORAGE_PREFIX = "chat:";
const COMMENT_STORAGE_PREFIX = "comments:";

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

/** 僅用課程+章節當 key，避免刷新時 useSession 尚未回傳導致 key 不一致、讀不到已存的對話 */
function getChatStorageKey(courseId: string, lessonId: string): string {
  return `${CHAT_STORAGE_PREFIX}${courseId}:${lessonId}`;
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
  currentVideoTime: number;
  /** 登入使用者的 id，有值時會依使用者＋課程＋章節儲存聊天記錄 */
  userId?: string | null;
  /** 僅顯示單一區塊時使用；未傳則顯示分頁（AI 助教 / 留言區） */
  mode?: "chat" | "comments";
}

export default function ChatPanel({ courseId, lessonId, currentVideoTime, userId = null, mode }: ChatPanelProps) {
  const storageKey = getChatStorageKey(courseId, lessonId);
  const [messages, setMessages] = useState<Message[]>([DEFAULT_WELCOME]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState<"chat" | "comments">(mode ?? "chat");
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentInput, setCommentInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const commentsEndRef = useRef<HTMLDivElement>(null);

  const showChat = mode ? mode === "chat" : activeTab === "chat";
  const showComments = mode ? mode === "comments" : activeTab === "comments";

  // 載入此課程／章節的 AI 助教對話（key 固定為課程+章節，刷新或回訪都會還原）
  useEffect(() => {
    const stored = loadChatFromStorage(storageKey);
    if (stored && stored.length > 0) setMessages(stored);
    setHasLoaded(true);
  }, [storageKey]);

  // 已載入後，每次 messages 變更就寫入 localStorage，離開或刷新都不會消失
  useEffect(() => {
    if (!hasLoaded) return;
    saveChatToStorage(storageKey, messages);
  }, [messages, hasLoaded, storageKey]);

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
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId,
          lessonId,
          message: cleanContent,
          videoTimestamp,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        // 未設定 API key 或服務錯誤時改用 mock 回覆
        throw new Error(data.error || data.details || "Request failed");
      }

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
      {!mode && (
        <div className="border-b border-border flex-shrink-0">
          <div className="flex">
            <button
              type="button"
              onClick={() => setActiveTab("chat")}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${activeTab === "chat" ? "text-foreground border-b-2 border-accent bg-transparent" : "text-muted hover:text-foreground"}`}
            >
              AI 助教
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("comments")}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${activeTab === "comments" ? "text-foreground border-b-2 border-accent bg-transparent" : "text-muted hover:text-foreground"}`}
            >
              留言區
            </button>
          </div>
        </div>
      )}

      {showChat && (
        <>
      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-6 space-y-4 min-h-0">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {message.role === "assistant" ? (
              <div className="max-w-[80%]">
                <div className="prose prose-sm max-w-none">
                  <ReactMarkdown>{message.content}</ReactMarkdown>
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

