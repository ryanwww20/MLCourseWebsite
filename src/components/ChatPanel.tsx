"use client";

import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  videoTimestamp?: string;
}

const CHAT_STORAGE_PREFIX = "chat:";
const DEFAULT_WELCOME: Message = {
  id: "welcome",
  role: "assistant",
  content: "您好！我是 AI 助教，有什麼問題都可以問我。",
  timestamp: "",
};

function getStorageKey(userId: string | null, courseId: string, lessonId: string): string | null {
  if (!userId) return null;
  return `${CHAT_STORAGE_PREFIX}${userId}:${courseId}:${lessonId}`;
}

function loadChatFromStorage(key: string | null): Message[] | null {
  if (!key || typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Message[];
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : null;
  } catch {
    return null;
  }
}

function saveChatToStorage(key: string | null, messages: Message[]) {
  if (!key || typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(messages));
  } catch {
    // ignore quota or parse errors
  }
}

interface ChatPanelProps {
  courseId: string;
  lessonId: string;
  currentVideoTime: number;
  /** 登入使用者的 id，有值時會依使用者＋課程＋章節儲存聊天記錄 */
  userId?: string | null;
}

export default function ChatPanel({ courseId, lessonId, currentVideoTime, userId = null }: ChatPanelProps) {
  const storageKey = getStorageKey(userId ?? null, courseId, lessonId);
  const [messages, setMessages] = useState<Message[]>([DEFAULT_WELCOME]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 載入該使用者在此課程／章節的歷史記錄
  useEffect(() => {
    const stored = loadChatFromStorage(storageKey ?? null);
    if (stored) setMessages(stored);
    setHasLoaded(true);
  }, [storageKey]);

  // 有登入且已載入後，每次 messages 變更就寫入 localStorage
  useEffect(() => {
    if (!hasLoaded || !storageKey) return;
    saveChatToStorage(storageKey, messages);
  }, [messages, hasLoaded, storageKey]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const insertTimestamp = () => {
    const timestamp = `[${formatTime(currentVideoTime)}] `;
    setInput((prev) => timestamp + prev);
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

  return (
    <div className="flex flex-col h-full bg-surface border border-transparent rounded-lg overflow-hidden">
      <div className="border-b border-border px-4 py-3 flex-shrink-0">
        <h3 className="text-lg font-semibold text-foreground">AI 助教</h3>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-6 space-y-4 min-h-0">
        {isLoading && (
          <div className="flex justify-start">
            <div className="text-sm text-muted">AI 助教正在思考…</div>
          </div>
        )}
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
              <div className="max-w-[80%] rounded-lg p-3 bg-accent text-background">
                <p className="whitespace-pre-wrap text-background">{message.content}</p>
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
              className="flex-1 px-3 py-2 border border-border rounded-md text-black focus:outline-none focus:ring-2 focus:ring-accent"
            />
            <button
              onClick={handleSend}
              disabled={isLoading}
              className="px-4 py-2 bg-accent text-background rounded-2xl transition shadow-sm flex items-center justify-center disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-5 h-5"
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
    </div>
  );
}

