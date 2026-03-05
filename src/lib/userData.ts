import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";

const DATA_DIR = join(process.cwd(), "data");
const USERS_DIR = join(DATA_DIR, "users");

/** 用於檔案路徑的 userId，避免 / \ 等字元 */
function safeUserId(userId: string): string {
  return userId.replace(/[/\\?*:]/g, "_");
}

/** 依 userId 前兩字元分子目錄，避免單一目錄下檔案過多（上萬用戶時仍可負荷） */
function userSubdir(safeId: string): string {
  const prefix = safeId.slice(0, 2);
  return prefix.length >= 2 ? prefix : `${prefix}_`;
}

export interface ChatTabsData {
  tabIds: string[];
  /** Every session ever created (superset of tabIds); closed tabs remain here. */
  allTabIds?: string[];
  titles: Record<string, string>;
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  videoTimestamp?: string;
}

interface UserDataFile {
  chatTabs?: Record<string, ChatTabsData>;
  chats?: Record<string, Message[]>;
}

function userFilePath(userId: string): string {
  const safe = safeUserId(userId);
  return join(USERS_DIR, userSubdir(safe), `${safe}.json`);
}

function ensureUsersDir(): void {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  if (!existsSync(USERS_DIR)) mkdirSync(USERS_DIR, { recursive: true });
}

function ensureUserFileDir(userId: string): void {
  ensureUsersDir();
  const safe = safeUserId(userId);
  const subdir = join(USERS_DIR, userSubdir(safe));
  if (!existsSync(subdir)) mkdirSync(subdir, { recursive: true });
}

function readUserData(userId: string): UserDataFile {
  const path = userFilePath(userId);
  const legacyPath = join(USERS_DIR, `${safeUserId(userId)}.json`);
  const toRead = existsSync(path) ? path : (existsSync(legacyPath) ? legacyPath : null);
  if (!toRead) return {};
  try {
    const raw = readFileSync(toRead, "utf8").trim();
    if (!raw) return {};
    return JSON.parse(raw) as UserDataFile;
  } catch {
    return {};
  }
}

function writeUserData(userId: string, data: UserDataFile): void {
  ensureUserFileDir(userId);
  writeFileSync(userFilePath(userId), JSON.stringify(data, null, 2), "utf8");
}

function tabsKey(courseId: string, lessonId: string): string {
  return `${courseId}:${lessonId}`;
}

function chatKey(courseId: string, lessonId: string, tabId: string): string {
  return `${courseId}:${lessonId}:${tabId}`;
}

export function getChatTabs(userId: string, courseId: string, lessonId: string): ChatTabsData {
  const data = readUserData(userId);
  const key = tabsKey(courseId, lessonId);
  const stored = data.chatTabs?.[key];
  if (stored && Array.isArray(stored.tabIds) && stored.tabIds.length > 0) {
    const titles = typeof stored.titles === "object" && stored.titles !== null ? stored.titles : {};
    const allTabIds = Array.isArray(stored.allTabIds) && stored.allTabIds.length > 0
      ? stored.allTabIds
      : stored.tabIds;
    return { tabIds: stored.tabIds, allTabIds, titles };
  }
  return { tabIds: [], allTabIds: [], titles: {} };
}

export function saveChatTabs(
  userId: string,
  courseId: string,
  lessonId: string,
  payload: ChatTabsData
): void {
  const data = readUserData(userId);
  if (!data.chatTabs) data.chatTabs = {};
  data.chatTabs[tabsKey(courseId, lessonId)] = payload;
  writeUserData(userId, data);
}

export function getChat(
  userId: string,
  courseId: string,
  lessonId: string,
  tabId: string
): Message[] | null {
  const data = readUserData(userId);
  const key = chatKey(courseId, lessonId, tabId);
  const arr = data.chats?.[key];
  return Array.isArray(arr) && arr.length > 0 ? arr : null;
}

export function saveChat(
  userId: string,
  courseId: string,
  lessonId: string,
  tabId: string,
  messages: Message[]
): void {
  const data = readUserData(userId);
  if (!data.chats) data.chats = {};
  data.chats[chatKey(courseId, lessonId, tabId)] = messages;
  writeUserData(userId, data);
}

export function deleteChat(
  userId: string,
  courseId: string,
  lessonId: string,
  tabId: string
): void {
  const data = readUserData(userId);
  const key = chatKey(courseId, lessonId, tabId);
  if (data.chats?.[key]) {
    delete data.chats[key];
  }
  const tKey = tabsKey(courseId, lessonId);
  const tabs = data.chatTabs?.[tKey];
  if (tabs) {
    tabs.tabIds = (tabs.tabIds ?? []).filter((id) => id !== tabId);
    if (Array.isArray(tabs.allTabIds)) {
      tabs.allTabIds = tabs.allTabIds.filter((id) => id !== tabId);
    }
    if (tabs.titles && tabId in tabs.titles) {
      delete tabs.titles[tabId];
    }
  }
  writeUserData(userId, data);
}
