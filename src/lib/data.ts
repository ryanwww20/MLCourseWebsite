import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";
import { courses as mockCourses } from "@/mock/courses";
import { lessons as mockLessons } from "@/mock/lessons";
import { homework as mockHomework } from "@/mock/homework";
import type { Course } from "@/mock/courses";
import type { Lesson } from "@/mock/lessons";
import type { Homework } from "@/mock/homework";

const DATA_DIR = join(process.cwd(), "data");

function ensureDataDir() {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
}

export function getCourses(): Course[] {
  return [...mockCourses];
}

export function getLessons(): Lesson[] {
  const base = [...mockLessons];
  const path = join(DATA_DIR, "lessons.json");
  if (!existsSync(path)) return base;
  try {
    const raw = readFileSync(path, "utf8");
    const extra = JSON.parse(raw) as Lesson[];
    return Array.isArray(extra) ? [...base, ...extra] : base;
  } catch {
    return base;
  }
}

export function getHomework(): Homework[] {
  const base = [...mockHomework];
  const path = join(DATA_DIR, "homework.json");
  if (!existsSync(path)) return base;
  try {
    const raw = readFileSync(path, "utf8");
    const extra = JSON.parse(raw) as Homework[];
    return Array.isArray(extra) ? [...base, ...extra] : base;
  } catch {
    return base;
  }
}

/** 僅回傳 data/homework.json 的內容（供判斷是否可編輯） */
export function getPersistedHomework(): Homework[] {
  const path = join(DATA_DIR, "homework.json");
  if (!existsSync(path)) return [];
  try {
    const raw = readFileSync(path, "utf8");
    const arr = JSON.parse(raw) as Homework[];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function readJsonArray<T>(path: string): T[] {
  if (!existsSync(path)) return [];
  try {
    const raw = readFileSync(path, "utf8").trim();
    if (!raw) return [];
    const arr = JSON.parse(raw) as T[];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export function appendLesson(lesson: Lesson): void {
  ensureDataDir();
  const path = join(DATA_DIR, "lessons.json");
  const existing = readJsonArray<Lesson>(path);
  writeFileSync(path, JSON.stringify([...existing, lesson], null, 2), "utf8");
}

export function appendHomework(hw: Homework): void {
  ensureDataDir();
  const path = join(DATA_DIR, "homework.json");
  const existing = readJsonArray<Homework>(path);
  writeFileSync(path, JSON.stringify([...existing, hw], null, 2), "utf8");
}

/** 更新 data/homework.json 中指定 id 的作業；僅能更新已寫入檔案中的項目。回傳是否找到並更新。 */
export function updateHomework(id: string, updates: Partial<Homework>): boolean {
  const path = join(DATA_DIR, "homework.json");
  const list = readJsonArray<Homework>(path);
  const idx = list.findIndex((h) => h.id === id);
  if (idx === -1) return false;
  list[idx] = { ...list[idx], ...updates, id: list[idx].id };
  ensureDataDir();
  writeFileSync(path, JSON.stringify(list, null, 2), "utf8");
  return true;
}
