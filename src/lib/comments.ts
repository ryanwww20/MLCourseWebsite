import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";

const DATA_DIR = join(process.cwd(), "data");
const COMMENTS_FILE = join(DATA_DIR, "comments.json");

export interface Comment {
  id: string;
  content: string;
  author: string;
  createdAt: string;
  replyTo?: { id: string; author: string };
}

type CommentsByLesson = Record<string, Comment[]>;

function ensureDataDir(): void {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
}

function key(courseId: string, lessonId: string): string {
  return `${courseId}:${lessonId}`;
}

function readAll(): CommentsByLesson {
  if (!existsSync(COMMENTS_FILE)) return {};
  try {
    const raw = readFileSync(COMMENTS_FILE, "utf8").trim();
    if (!raw) return {};
    return JSON.parse(raw) as CommentsByLesson;
  } catch {
    return {};
  }
}

function writeAll(data: CommentsByLesson): void {
  ensureDataDir();
  writeFileSync(COMMENTS_FILE, JSON.stringify(data, null, 2), "utf8");
}

/** 取得某課程／章節的共用留言（所有人可見） */
export function getComments(courseId: string, lessonId: string): Comment[] {
  const data = readAll();
  const list = data[key(courseId, lessonId)];
  return Array.isArray(list) ? list : [];
}

/** 刪除指定留言。回傳是否找到並刪除。 */
export function deleteComment(courseId: string, lessonId: string, commentId: string): boolean {
  const data = readAll();
  const k = key(courseId, lessonId);
  const list = data[k];
  if (!Array.isArray(list)) return false;
  const idx = list.findIndex((c) => c.id === commentId);
  if (idx === -1) return false;
  data[k] = list.filter((c) => c.id !== commentId);
  writeAll(data);
  return true;
}

/** 新增一則留言到共用列表；author 由 API 依 session 填入或「訪客」 */
export function addComment(
  courseId: string,
  lessonId: string,
  payload: { content: string; author: string; replyTo?: { id: string; author: string } }
): Comment {
  const data = readAll();
  const k = key(courseId, lessonId);
  const list = Array.isArray(data[k]) ? data[k] : [];
  const comment: Comment = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    content: payload.content,
    author: payload.author,
    createdAt: new Date().toLocaleString("zh-TW"),
    ...(payload.replyTo ? { replyTo: payload.replyTo } : {}),
  };
  data[k] = [...list, comment];
  writeAll(data);
  return comment;
}
