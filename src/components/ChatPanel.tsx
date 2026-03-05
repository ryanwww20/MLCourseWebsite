"use client";

import { useState, useRef, useEffect, Component, type ReactNode } from "react";
import { useSession } from "next-auth/react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";

/** README §4: Error Boundary 防止 malformed LaTeX 導致整棵 component tree 崩潰 */
class MarkdownErrorBoundary extends Component<{ children: ReactNode; fallback?: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? <p className="text-sm text-muted">內容無法正確渲染（可能含不合法的 LaTeX）。</p>;
    }
    return this.props.children;
  }
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  videoTimestamp?: string;
  /** 使用者訊息附加的圖片（base64 純字串），顯示縮圖在文字上方 */
  imageBase64?: string;
  imageMimeType?: string;
}

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const CHAT_STORAGE_PREFIX = "chat:";
const CHAT_TABS_PREFIX = "chat-tabs:";

function generateTabId(): string {
  return `t${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export interface Comment {
  id: string;
  content: string;
  author: string;
  createdAt: string;
  replyTo?: { id: string; author: string };
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
  allTabIds?: string[];
  titles: Record<string, string>;
}

function loadChatTabsFromStorage(courseId: string, lessonId: string): ChatTabsData {
  if (typeof window === "undefined") return { tabIds: [], allTabIds: [], titles: {} };
  try {
    const raw = localStorage.getItem(getChatTabsStorageKey(courseId, lessonId));
    if (!raw) return { tabIds: [], allTabIds: [], titles: {} };
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return { tabIds: parsed, allTabIds: parsed, titles: {} };
    }
    if (parsed && Array.isArray(parsed.tabIds) && parsed.tabIds.length > 0) {
      const titles = typeof parsed.titles === "object" && parsed.titles !== null ? parsed.titles : {};
      const allTabIds = Array.isArray(parsed.allTabIds) && parsed.allTabIds.length > 0
        ? parsed.allTabIds
        : parsed.tabIds;
      return { tabIds: parsed.tabIds, allTabIds, titles };
    }
    return { tabIds: [], allTabIds: [], titles: {} };
  } catch {
    return { tabIds: [], allTabIds: [], titles: {} };
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
  const [allTabIds, setAllTabIds] = useState<string[]>([]);
  const [titlesByTab, setTitlesByTab] = useState<Record<string, string>>({});
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [messagesByTab, setMessagesByTab] = useState<Record<string, Message[]>>({});
  const [hasLoadedTabs, setHasLoadedTabs] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [deleteConfirmTabId, setDeleteConfirmTabId] = useState<string | null>(null);
  const historyRef = useRef<HTMLDivElement>(null);
  const [conversationIdByTab, setConversationIdByTab] = useState<Record<string, string | null>>({});
  const [input, setInput] = useState("");
  const [loadingByTab, setLoadingByTab] = useState<Record<string, boolean>>({});
  const [attachedImageBase64, setAttachedImageBase64] = useState<string | null>(null);
  const [attachedImageMimeType, setAttachedImageMimeType] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  /** README §5: steps 陣列（thinking, rag_retrieval, tool_call, tool_result），可摺疊顯示 */
  const [lastSteps, setLastSteps] = useState<Array<{ type: string; content?: string; function?: string; arguments?: unknown }>>([]);
  const [lastMessageIdWithSteps, setLastMessageIdWithSteps] = useState<string | null>(null);
  const [stepsOpen, setStepsOpen] = useState(false);
  /** README §6: 錯誤訊息（400/500/network），顯示後可重試 */
  const [sendErrorByTab, setSendErrorByTab] = useState<Record<string, string | null>>({});
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentInput, setCommentInput] = useState("");
  const [replyTarget, setReplyTarget] = useState<{ id: string; author: string } | null>(null);
  const commentInputRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const commentsEndRef = useRef<HTMLDivElement>(null);
  const activeTabIdRef = useRef(activeTabId);
  activeTabIdRef.current = activeTabId;

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

  const isLoading = activeTabId ? (loadingByTab[activeTabId] ?? false) : false;
  const conversationId = activeTabId ? (conversationIdByTab[activeTabId] ?? null) : null;
  const sendError = activeTabId ? (sendErrorByTab[activeTabId] ?? null) : null;

  /** 未傳 mode 時同時顯示 AI 助教與留言區（上下排列）；傳 mode 時只顯示該區塊 */
  const showChat = !mode || mode === "chat";
  const showComments = !mode || mode === "comments";

  // 載入此課程／章節的 tab 列表、標題與各 tab 對話（登入用 API，未登入用 localStorage）
  useEffect(() => {
    let cancelled = false;

    if (userId) {
      const params = new URLSearchParams({ courseId, lessonId });
      fetch(`${BASE_PATH}/api/user/chat-tabs?${params}`, { credentials: "include" })
        .then((res) => (res.ok ? res.json() : Promise.resolve({ tabIds: [], titles: {} })))
        .then((data: { tabIds?: string[]; allTabIds?: string[]; titles?: Record<string, string> }) => {
          if (cancelled) return;
          const ids = Array.isArray(data.tabIds) && data.tabIds.length > 0 ? data.tabIds : [];
          const all = Array.isArray(data.allTabIds) && data.allTabIds.length > 0 ? data.allTabIds : ids;
          const titles = data.titles && typeof data.titles === "object" ? data.titles : {};
          if (ids.length === 0) {
            const firstId = generateTabId();
            setTabIds([firstId]);
            setAllTabIds(all.length > 0 ? all : [firstId]);
            setTitlesByTab(titles);
            setActiveTabId(firstId);
            setMessagesByTab({ [firstId]: [DEFAULT_WELCOME] });
            setHasLoadedTabs(true);
            return;
          }
          setTabIds(ids);
          setAllTabIds(all);
          setTitlesByTab(titles);
          setActiveTabId(ids[0]);
          const byTab: Record<string, Message[]> = {};
          Promise.all(
            ids.map((id) =>
              fetch(`${BASE_PATH}/api/user/chat?${new URLSearchParams({ courseId, lessonId, tabId: id })}`, { credentials: "include" })
                .then((r) => (r.ok ? r.json() : Promise.resolve({ messages: [] })))
                .then((body: { messages?: Message[] }) => ({ id, messages: body.messages ?? [] }))
            )
          ).then((results) => {
            if (cancelled) return;
            results.forEach(({ id, messages }) => {
              byTab[id] = messages.length > 0 ? messages : [DEFAULT_WELCOME];
            });
            setMessagesByTab(byTab);
            setHasLoadedTabs(true);
          });
        })
        .catch(() => {
          if (!cancelled) {
            const firstId = generateTabId();
            setTabIds([firstId]);
            setAllTabIds([firstId]);
            setTitlesByTab({});
            setActiveTabId(firstId);
            setMessagesByTab({ [firstId]: [DEFAULT_WELCOME] });
            setHasLoadedTabs(true);
          }
        });
      return () => { cancelled = true; };
    }

    const { tabIds: ids, allTabIds: all, titles } = loadChatTabsFromStorage(courseId, lessonId);
    if (ids.length === 0) {
      const firstId = generateTabId();
      setTabIds([firstId]);
      setAllTabIds(all && all.length > 0 ? all : [firstId]);
      setTitlesByTab(titles);
      setActiveTabId(firstId);
      setMessagesByTab({ [firstId]: [DEFAULT_WELCOME] });
      saveChatTabsToStorage(courseId, lessonId, { tabIds: [firstId], allTabIds: all && all.length > 0 ? all : [firstId], titles });
    } else {
      setTabIds(ids);
      setAllTabIds(all && all.length > 0 ? all : ids);
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
  }, [courseId, lessonId, userId]);

  // tab 列表與標題變更時寫回（登入用 API，未登入用 localStorage）
  useEffect(() => {
    if (!hasLoadedTabs || tabIds.length === 0) return;
    if (userId) {
      fetch(`${BASE_PATH}/api/user/chat-tabs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ courseId, lessonId, tabIds, allTabIds, titles: titlesByTab }),
      }).catch(() => {});
    } else {
      saveChatTabsToStorage(courseId, lessonId, { tabIds, allTabIds, titles: titlesByTab });
    }
  }, [tabIds, allTabIds, titlesByTab, hasLoadedTabs, courseId, lessonId, userId]);

  // 當某 tab 有新的使用者訊息時，依第一則使用者訊息更新該 tab 標題（涵蓋 open + all tabs）
  useEffect(() => {
    if (!hasLoadedTabs) return;
    let updated = false;
    const nextTitles = { ...titlesByTab };
    const idsToCheck = new Set([...tabIds, ...allTabIds]);
    idsToCheck.forEach((tabId) => {
      const list = messagesByTab[tabId];
      if (!list) return;
      const summary = getSummaryFromMessages(list);
      if (summary != null && nextTitles[tabId] !== summary) {
        nextTitles[tabId] = summary;
        updated = true;
      }
    });
    if (updated) setTitlesByTab(nextTitles);
  }, [messagesByTab, hasLoadedTabs, tabIds, allTabIds]);

  // 當前 tab 的對話變更時寫入（登入用 API，未登入用 localStorage）
  useEffect(() => {
    if (!hasLoadedTabs || !activeTabId) return;
    const list = messagesByTab[activeTabId];
    if (!list) return;
    if (userId) {
      fetch(`${BASE_PATH}/api/user/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ courseId, lessonId, tabId: activeTabId, messages: list }),
      }).catch(() => {});
    } else {
      saveChatToStorage(getChatStorageKey(courseId, lessonId, activeTabId), list);
    }
  }, [messagesByTab, activeTabId, hasLoadedTabs, courseId, lessonId, userId]);

  const getTabTitle = (tabId: string, index: number): string => {
    return titlesByTab[tabId] ?? `對話 ${index + 1}`;
  };

  const addChatTab = () => {
    const newId = generateTabId();
    setTabIds((prev) => [...prev, newId]);
    setAllTabIds((prev) => [...prev, newId]);
    setActiveTabId(newId);
    setMessagesByTab((prev) => ({ ...prev, [newId]: [DEFAULT_WELCOME] }));
  };

  const removeChatTab = (tabId: string) => {
    if (tabIds.length <= 1) return;
    const newIds = tabIds.filter((id) => id !== tabId);
    setTabIds(newIds);
    if (activeTabId === tabId && newIds.length > 0) {
      const oldIdx = tabIds.indexOf(tabId);
      setActiveTabId(newIds[Math.min(oldIdx, newIds.length - 1)] ?? newIds[0]);
    }
  };

  const permanentlyDeleteTab = (tabId: string) => {
    setTabIds((prev) => prev.filter((id) => id !== tabId));
    setAllTabIds((prev) => prev.filter((id) => id !== tabId));
    setMessagesByTab((prev) => {
      const next = { ...prev };
      delete next[tabId];
      return next;
    });
    setTitlesByTab((prev) => {
      const next = { ...prev };
      delete next[tabId];
      return next;
    });
    setLoadingByTab((prev) => {
      const next = { ...prev };
      delete next[tabId];
      return next;
    });
    setConversationIdByTab((prev) => {
      const next = { ...prev };
      delete next[tabId];
      return next;
    });
    setSendErrorByTab((prev) => {
      const next = { ...prev };
      delete next[tabId];
      return next;
    });
    if (activeTabId === tabId) {
      const remaining = tabIds.filter((id) => id !== tabId);
      setActiveTabId(remaining.length > 0 ? remaining[0] : null);
    }
    if (userId) {
      fetch(
        `${BASE_PATH}/api/user/chat?${new URLSearchParams({ courseId, lessonId, tabId })}`,
        { method: "DELETE", credentials: "include" }
      ).catch(() => {});
    } else {
      try { localStorage.removeItem(getChatStorageKey(courseId, lessonId, tabId)); } catch {}
    }
  };

  const openFromHistory = (tabId: string) => {
    if (tabIds.includes(tabId)) {
      setActiveTabId(tabId);
      setHistoryOpen(false);
      return;
    }
    if (messagesByTab[tabId]) {
      setTabIds((prev) => [...prev, tabId]);
      setActiveTabId(tabId);
      setHistoryOpen(false);
      return;
    }
    if (userId) {
      fetch(`${BASE_PATH}/api/user/chat?${new URLSearchParams({ courseId, lessonId, tabId })}`, { credentials: "include" })
        .then((r) => (r.ok ? r.json() : Promise.resolve({ messages: [] })))
        .then((body: { messages?: Message[] }) => {
          const msgs = Array.isArray(body.messages) && body.messages.length > 0 ? body.messages : [DEFAULT_WELCOME];
          setMessagesByTab((prev) => ({ ...prev, [tabId]: msgs }));
          setTabIds((prev) => (prev.includes(tabId) ? prev : [...prev, tabId]));
          setActiveTabId(tabId);
          setHistoryOpen(false);
        });
    } else {
      const stored = loadChatFromStorage(getChatStorageKey(courseId, lessonId, tabId));
      const msgs = stored && stored.length > 0 ? stored : [DEFAULT_WELCOME];
      setMessagesByTab((prev) => ({ ...prev, [tabId]: msgs }));
      setTabIds((prev) => [...prev, tabId]);
      setActiveTabId(tabId);
      setHistoryOpen(false);
    }
  };

  // Close history dropdown when clicking outside
  useEffect(() => {
    if (!historyOpen) return;
    const handler = (e: MouseEvent) => {
      if (historyRef.current && !historyRef.current.contains(e.target as Node)) {
        setHistoryOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [historyOpen]);

  // 切換課程／章節時清掉所有 RAG 對話 id，視為新對話
  useEffect(() => {
    setConversationIdByTab({});
  }, [courseId, lessonId]);

  // 載入此課程／章節的共用留言（所有人看到同一份，不需登入）
  useEffect(() => {
    const params = new URLSearchParams({ courseId, lessonId });
    fetch(`${BASE_PATH}/api/comments?${params}`)
      .then((res) => (res.ok ? res.json() : Promise.resolve({ comments: [] })))
      .then((body: { comments?: Comment[] }) => setComments(Array.isArray(body.comments) ? body.comments : []));
  }, [courseId, lessonId]);

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

  const handleSubmitComment = async () => {
    const content = commentInput.trim();
    if (!content) return;
    const currentReply = replyTarget;
    setCommentInput("");
    setReplyTarget(null);
    try {
      const payload: Record<string, unknown> = { courseId, lessonId, content };
      if (currentReply) {
        payload.replyTo = currentReply;
      }
      const res = await fetch(`${BASE_PATH}/api/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as { comment?: Comment; error?: string };
      if (res.ok && data.comment) {
        setComments((prev) => [...prev, data.comment!]);
      }
    } catch {
      // 失敗時可選擇把 content 塞回 input 或提示錯誤
    }
  };

  const handleReply = (comment: Comment) => {
    setReplyTarget({ id: comment.id, author: comment.author });
    setCommentInput((prev) => {
      const mentionPrefix = `@${comment.author} `;
      const stripped = prev.replace(/^@\S+\s*/, "");
      return mentionPrefix + stripped;
    });
    commentInputRef.current?.focus();
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const startNewChat = async () => {
    if (!activeTabId) return;
    const tabConvId = conversationIdByTab[activeTabId];
    if (tabConvId) {
      try {
        await fetch(`${BASE_PATH}/api/conversation/new`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ conversation_id: tabConvId }),
        });
      } catch {
        // ignore
      }
      setConversationIdByTab((prev) => ({ ...prev, [activeTabId]: null }));
    }
    setMessages([DEFAULT_WELCOME]);
    setLastSteps([]);
    setLastMessageIdWithSteps(null);
    setSendErrorByTab((prev) => ({ ...prev, [activeTabId]: null }));
  };

  const insertTimestamp = () => {
    const timestamp = `[${formatTime(currentVideoTime)}] `;
    setInput((prev) => timestamp + prev);
  };

  const ALLOWED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];
  const MAX_IMAGE_LONGEST_SIDE = 1024; // README: resize client-side to reduce payload and token cost

  /** README: strip "data:image/png;base64," prefix → 純 base64 */
  const toPureBase64 = (dataUrl: string): string => {
    if (dataUrl.startsWith("data:") && dataUrl.includes(",")) {
      return dataUrl.split(",")[1] ?? dataUrl;
    }
    return dataUrl;
  };

  /** README flow: 1) select file 2) resize (max 1024px longest) 3) convert to base64, strip prefix */
  const fileToBase64 = (file: File): Promise<{ base64: string; mimeType: string }> => {
    return new Promise((resolve, reject) => {
      const img = document.createElement("img");
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        let { width, height } = img;
        if (width > MAX_IMAGE_LONGEST_SIDE || height > MAX_IMAGE_LONGEST_SIDE) {
          if (width >= height) {
            height = Math.round((height * MAX_IMAGE_LONGEST_SIDE) / width);
            width = MAX_IMAGE_LONGEST_SIDE;
          } else {
            width = Math.round((width * MAX_IMAGE_LONGEST_SIDE) / height);
            height = MAX_IMAGE_LONGEST_SIDE;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Canvas 2d not available"));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const mimeType = file.type || "image/jpeg";
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("toBlob failed"));
              return;
            }
            const reader = new FileReader();
            reader.onload = () => {
              const dataUrl = reader.result as string;
              resolve({ base64: toPureBase64(dataUrl), mimeType });
            };
            reader.onerror = () => reject(new Error("FileReader error"));
            reader.readAsDataURL(blob);
          },
          mimeType,
          0.9
        );
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("Image load failed"));
      };
      img.src = url;
    });
  };

  const handleAttachImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !ALLOWED_IMAGE_TYPES.includes(file.type)) return;
    e.target.value = "";
    fileToBase64(file)
      .then(({ base64, mimeType }) => {
        setAttachedImageBase64(base64);
        setAttachedImageMimeType(mimeType);
      })
      .catch(() => {
        setAttachedImageBase64(null);
        setAttachedImageMimeType(null);
      });
  };

  const insertCommentTimestamp = () => {
    const timestamp = `[${formatTime(currentVideoTime)}] `;
    setCommentInput((prev) => timestamp + prev);
  };

  const FETCH_TIMEOUT_MS = 5 * 60 * 1000; // README §6: 至少 5 分鐘

  const handleSend = async () => {
    const sendingTabId = activeTabId;
    if (!sendingTabId || !input.trim() || loadingByTab[sendingTabId]) return;

    const videoTimestamp = input.match(/\[(\d{2}:\d{2})\]/)?.[1];
    const cleanContent = input.replace(/\[\d{2}:\d{2}\]\s*/, "");

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date().toLocaleTimeString("zh-TW"),
      videoTimestamp: videoTimestamp,
      ...(attachedImageBase64 && attachedImageMimeType
        ? { imageBase64: attachedImageBase64, imageMimeType: attachedImageMimeType }
        : {}),
    };

    const appendToTab = (msg: Message) => {
      setMessagesByTab((prev) => ({
        ...prev,
        [sendingTabId]: [...(prev[sendingTabId] ?? [DEFAULT_WELCOME]), msg],
      }));
    };

    const rollbackUserMessage = () => {
      setMessagesByTab((prev) => ({
        ...prev,
        [sendingTabId]: (prev[sendingTabId] ?? []).filter((m) => m.id !== userMessage.id),
      }));
      if (activeTabIdRef.current === sendingTabId) {
        setInput(userMessage.content);
      }
    };

    appendToTab(userMessage);
    setInput("");
    setLoadingByTab((prev) => ({ ...prev, [sendingTabId]: true }));
    setSendErrorByTab((prev) => ({ ...prev, [sendingTabId]: null }));

    try {
      const payload: Record<string, unknown> = {
        query: cleanContent,
        conversation_id: conversationIdByTab[sendingTabId] ?? null,
      };
      if (lessonTitle != null && lessonTitle !== "") {
        const timestamp = videoTimestamp ?? "";
        payload.video_context = { video_name: lessonTitle, timestamp };
      }
      if (attachedImageBase64 && attachedImageMimeType) {
        payload.image = attachedImageBase64;
        payload.image_mime_type = attachedImageMimeType;
      }
      setAttachedImageBase64(null);
      setAttachedImageMimeType(null);
      payload.courseId = courseId;
      payload.lessonId = lessonId;

      const res = await fetch(`${BASE_PATH}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      });

      if (!res.ok) {
        let msg = `HTTP ${res.status}`;
        try {
          const errData = await res.json();
          msg = errData.error || errData.details || msg;
        } catch {
          if (res.status === 504) {
            msg = "後端處理時間過長（504 Gateway Timeout），請再試一次";
          }
        }
        rollbackUserMessage();
        if (res.status === 400) {
          setSendErrorByTab((prev) => ({ ...prev, [sendingTabId]: msg }));
        } else {
          setSendErrorByTab((prev) => ({ ...prev, [sendingTabId]: msg }));
        }
        setLoadingByTab((prev) => ({ ...prev, [sendingTabId]: false }));
        return;
      }

      const data = (await res.json()) as {
        response?: string | null;
        content?: string | null;
        conversation_id?: string;
        steps?: Array<{ type: string; content?: string; function?: string; arguments?: unknown }>;
        error?: string;
        details?: string;
      };

      if (data.conversation_id) {
        setConversationIdByTab((prev) => ({ ...prev, [sendingTabId]: data.conversation_id! }));
      }

      const responseText = data.response ?? data.content ?? "(No response)";
      const assistantId = (Date.now() + 1).toString();
      const assistantMessage: Message = {
        id: assistantId,
        role: "assistant",
        content: responseText,
        timestamp: new Date().toLocaleTimeString("zh-TW"),
      };
      appendToTab(assistantMessage);
      setLastSteps(Array.isArray(data.steps) ? data.steps : []);
      setLastMessageIdWithSteps(assistantId);
      setStepsOpen(false);
    } catch (err) {
      console.error("[ChatPanel] send error:", err);
      rollbackUserMessage();
      const isTimeout =
        err instanceof Error && (err.name === "TimeoutError" || err.name === "AbortError");
      const isNetwork =
        err instanceof TypeError && (err.message === "Failed to fetch" || err.message.includes("network"));
      if (isTimeout) {
        setSendErrorByTab((prev) => ({ ...prev, [sendingTabId]: "請求逾時（最長 5 分鐘），請再試一次。" }));
      } else if (isNetwork) {
        setSendErrorByTab((prev) => ({ ...prev, [sendingTabId]: "無法連線，請檢查網路後重試。" }));
      } else {
        const detail = err instanceof Error ? err.message : String(err);
        setSendErrorByTab((prev) => ({ ...prev, [sendingTabId]: `送出失敗：${detail}` }));
      }
    } finally {
      setLoadingByTab((prev) => ({ ...prev, [sendingTabId]: false }));
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
        <div className="relative flex-shrink-0" ref={historyRef}>
          <button
            type="button"
            onClick={() => setHistoryOpen((o) => !o)}
            className="flex items-center gap-1 px-2 py-1.5 m-1 rounded-md text-xs text-muted hover:text-foreground hover:bg-foreground/10 transition-colors"
            aria-label="對話紀錄"
            title="對話紀錄"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm.75-13a.75.75 0 0 0-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 0 0 0-1.5h-3.25V5Z" clipRule="evenodd" />
            </svg>
          </button>
          {historyOpen && (() => {
            const closedIds = allTabIds.filter((id) => !tabIds.includes(id));
            return (
              <div className="absolute right-0 top-full mt-1 z-50 w-56 max-h-60 overflow-y-auto rounded-lg border border-border bg-surface shadow-lg">
                {closedIds.length === 0 ? (
                  <p className="px-3 py-4 text-xs text-muted text-center">沒有已關閉的對話</p>
                ) : (
                  closedIds.map((tabId, idx) => {
                    const title = titlesByTab[tabId] || `對話 (${idx + 1})`;
                    return (
                      <div key={tabId} className="flex items-center border-b border-border last:border-b-0">
                        <button
                          type="button"
                          onClick={() => openFromHistory(tabId)}
                          className="flex-1 min-w-0 px-3 py-2 text-left text-sm text-foreground hover:bg-foreground/5 transition-colors truncate"
                          title={title}
                        >
                          {title}
                        </button>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setDeleteConfirmTabId(tabId); }}
                          className="flex-shrink-0 p-1.5 mr-1 text-muted-foreground hover:text-red-500 rounded transition-colors"
                          aria-label="永久刪除"
                          title="永久刪除"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                            <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.519.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            );
          })()}
        </div>
        <button
          type="button"
          onClick={addChatTab}
          className="flex-shrink-0 flex items-center gap-1 px-2 py-1.5 m-1 rounded-md text-xs text-muted hover:text-foreground hover:bg-foreground/10 transition-colors"
          aria-label="新對話"
          title="新對話"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
          </svg>
          <span>新對話</span>
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
                <MarkdownErrorBoundary>
                  <div className="prose prose-sm max-w-none">
                    <ReactMarkdown
                      remarkPlugins={[remarkMath]}
                      rehypePlugins={[[rehypeKatex, { throwOnError: false, strict: false }]]}
                    >
                      {message.content ?? ""}
                    </ReactMarkdown>
                  </div>
                </MarkdownErrorBoundary>
                {message.videoTimestamp && (
                  <div className="mt-2">
                    <span className="text-xs px-1.5 py-0.5 bg-foreground/10 text-muted rounded">
                      {message.videoTimestamp}
                    </span>
                  </div>
                )}
                {lastMessageIdWithSteps === message.id && lastSteps.length > 0 && (
                  <div className="mt-3 border border-border rounded-lg overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setStepsOpen((o) => !o)}
                      className="w-full px-3 py-2 text-left text-sm text-muted hover:text-foreground hover:bg-foreground/5 flex items-center justify-between"
                    >
                      <span>{lastSteps.length} steps（thinking & tool use）</span>
                      <span className="text-xs">{stepsOpen ? "▲" : "▼"}</span>
                    </button>
                    {stepsOpen && (
                      <div className="px-3 pb-3 pt-0 space-y-2 max-h-48 overflow-y-auto text-xs font-mono bg-foreground/5">
                        {lastSteps.map((step, i) => (
                          <div key={i} className="rounded p-2 bg-background border border-border">
                            <span className="font-semibold text-foreground">{step.type}</span>
                            {step.function != null && <span className="ml-1 text-muted">→ {step.function}</span>}
                            {step.content != null && <pre className="mt-1 whitespace-pre-wrap break-words text-muted">{step.content}</pre>}
                            {step.arguments != null && <pre className="mt-1 whitespace-pre-wrap break-words text-muted">{JSON.stringify(step.arguments)}</pre>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="max-w-[80%] rounded-lg p-3 bg-accent space-y-2">
                {message.imageBase64 && message.imageMimeType && (
                  <div className="rounded-md overflow-hidden border border-black/10 bg-black/5 inline-block max-w-[160px]">
                    <img
                      src={`data:${message.imageMimeType};base64,${message.imageBase64}`}
                      alt="附加圖片"
                      className="block max-h-32 w-auto object-contain"
                    />
                  </div>
                )}
                {message.content ? (
                  <p className="whitespace-pre-wrap text-black">{message.content}</p>
                ) : null}
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

      {sendError && (
        <div className="mx-4 mb-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-700 dark:text-red-300 flex items-center justify-between gap-2">
          <span>{sendError}</span>
          <button
            type="button"
            onClick={() => activeTabId && setSendErrorByTab((prev) => ({ ...prev, [activeTabId]: null }))}
            className="flex-shrink-0 px-2 py-1 rounded bg-red-500/20 hover:bg-red-500/30 text-red-700 dark:text-red-300"
          >
            關閉
          </button>
        </div>
      )}

      <div className="px-4 pb-4 flex-shrink-0">
        <div className="border border-border rounded-xl p-3 space-y-2">
          <div className="flex items-center space-x-2 flex-wrap gap-1">
            <button
              type="button"
              onClick={insertTimestamp}
              className="px-3 py-1.5 text-sm bg-foreground/10 hover:bg-foreground/20 rounded-md transition-colors text-foreground"
            >
              插入時間戳
            </button>
            <input
              ref={imageInputRef}
              id="chat-image-input"
              name="chat-image"
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              className="hidden"
              onChange={handleAttachImage}
            />
            <button
              type="button"
              onClick={() => imageInputRef.current?.click()}
              className="px-3 py-1.5 text-sm bg-foreground/10 hover:bg-foreground/20 rounded-md transition-colors text-foreground"
            >
              附加圖片
            </button>
            {attachedImageBase64 && (
              <span className="text-xs text-muted flex items-center gap-1">
                已附加 1 張圖片
                <button
                  type="button"
                  onClick={() => { setAttachedImageBase64(null); setAttachedImageMimeType(null); }}
                  className="text-foreground hover:underline"
                >
                  移除
                </button>
              </span>
            )}
            <span className="text-xs text-muted">
              目前時間: {formatTime(currentVideoTime)}
            </span>
          </div>
          <div className="flex space-x-2">
            <input
              id="chat-message-input"
              name="chat-message"
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
              {c.replyTo && (
                <div className="flex items-center gap-1 mb-1.5 text-xs text-muted">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3 flex-shrink-0 opacity-60">
                    <path fillRule="evenodd" d="M1.5 8a.75.75 0 0 1 .75-.75h8.94L8.22 4.28a.75.75 0 0 1 1.06-1.06l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06l2.97-2.97H2.25A.75.75 0 0 1 1.5 8Z" clipRule="evenodd" />
                  </svg>
                  <span>回覆 <span className="font-medium text-foreground/70">@{c.replyTo.author}</span></span>
                </div>
              )}
              <p className="text-sm text-foreground whitespace-pre-wrap">{c.content}</p>
              <div className="flex items-center justify-between mt-1">
                <p className="text-xs text-muted">{c.author} · {c.createdAt}</p>
                <button
                  type="button"
                  onClick={() => handleReply(c)}
                  className="text-xs text-muted hover:text-foreground transition-colors px-1.5 py-0.5 rounded hover:bg-foreground/5"
                >
                  回覆
                </button>
              </div>
            </div>
          ))
        )}
        <div ref={commentsEndRef} />
      </div>
      <div className="px-4 pb-4 flex-shrink-0">
        {replyTarget && (
          <div className="mx-0 mb-2 px-3 py-1.5 rounded-lg bg-accent/10 border border-accent/30 text-xs text-foreground flex items-center justify-between gap-2">
            <span>回覆 <span className="font-medium">@{replyTarget.author}</span></span>
            <button
              type="button"
              onClick={() => { setReplyTarget(null); setCommentInput((prev) => prev.replace(/^@\S+\s*/, "")); }}
              className="text-muted hover:text-foreground transition-colors"
              aria-label="取消回覆"
            >
              ✕
            </button>
          </div>
        )}
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
              ref={commentInputRef}
              id="chat-comment-input"
              name="chat-comment"
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

      {deleteConfirmTabId && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <button
            type="button"
            onClick={() => setDeleteConfirmTabId(null)}
            className="absolute inset-0 bg-black/50"
            aria-label="取消"
          />
          <div className="relative w-full max-w-xs rounded-xl border border-border bg-surface shadow-xl p-5">
            <h3 className="text-base font-semibold text-foreground mb-2">確認刪除</h3>
            <p className="text-sm text-muted-foreground mb-4">
              確定要永久刪除「{titlesByTab[deleteConfirmTabId] || "此對話"}」嗎？刪除後將無法復原。
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmTabId(null)}
                className="px-4 py-2 text-sm border border-border rounded-lg text-foreground hover:bg-foreground/5"
              >
                取消
              </button>
              <button
                type="button"
                onClick={() => {
                  permanentlyDeleteTab(deleteConfirmTabId);
                  setDeleteConfirmTabId(null);
                }}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                刪除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

