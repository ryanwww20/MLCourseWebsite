import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";
import type { Course } from "@/mock/courses";
import type { Lesson } from "@/mock/lessons";
import type { Homework } from "@/mock/homework";

const DATA_DIR = join(process.cwd(), "data");

function ensureDataDir() {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
}

export function getCourses(): Course[] {
  return readJsonArray<Course>(join(DATA_DIR, "courses.json"));
}

/** 僅回傳 data/courses.json 的內容（供產生新 id 或判斷是否可編輯） */
export function getPersistedCourses(): Course[] {
  return readJsonArray<Course>(join(DATA_DIR, "courses.json"));
}

export function appendCourse(course: Course): void {
  ensureDataDir();
  const path = join(DATA_DIR, "courses.json");
  const existing = readJsonArray<Course>(path);
  writeFileSync(path, JSON.stringify([...existing, course], null, 2), "utf8");
}

/** 刪除課程（並一併刪除該課程的 lessons 與 homework）。回傳是否找到並刪除。 */
export function deleteCourse(id: string): boolean {
  const path = join(DATA_DIR, "courses.json");
  const list = readJsonArray<Course>(path);
  const idx = list.findIndex((c) => c.id === id);
  if (idx === -1) return false;
  const next = list.filter((c) => c.id !== id);
  ensureDataDir();
  writeFileSync(path, JSON.stringify(next, null, 2), "utf8");
  const lessonPath = join(DATA_DIR, "lessons.json");
  const lessons = readJsonArray<Lesson>(lessonPath);
  if (lessons.length > 0) {
    const remainingLessons = lessons.filter((l) => l.courseId !== id);
    writeFileSync(lessonPath, JSON.stringify(remainingLessons, null, 2), "utf8");
  }
  const hwPath = join(DATA_DIR, "homework.json");
  const hwList = readJsonArray<Homework>(hwPath);
  if (hwList.length > 0) {
    const remainingHw = hwList.filter((h) => h.courseId !== id);
    writeFileSync(hwPath, JSON.stringify(remainingHw, null, 2), "utf8");
  }
  return true;
}

export function getLessons(): Lesson[] {
  return readJsonArray<Lesson>(join(DATA_DIR, "lessons.json"));
}

export function getHomework(): Homework[] {
  return readJsonArray<Homework>(join(DATA_DIR, "homework.json"));
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

/** 僅回傳 data/lessons.json 的內容（供產生新 id 或判斷是否可編輯） */
export function getPersistedLessons(): Lesson[] {
  return readJsonArray<Lesson>(join(DATA_DIR, "lessons.json"));
}

export function appendLesson(lesson: Lesson): void {
  ensureDataDir();
  const path = join(DATA_DIR, "lessons.json");
  const existing = readJsonArray<Lesson>(path);
  writeFileSync(path, JSON.stringify([...existing, lesson], null, 2), "utf8");
}

/** 更新 data/lessons.json 中指定 id 的 lecture；僅能更新已寫入檔案中的項目。回傳是否找到並更新。 */
export function updateLesson(id: string, updates: Partial<Lesson>): boolean {
  const path = join(DATA_DIR, "lessons.json");
  const list = readJsonArray<Lesson>(path);
  const idx = list.findIndex((l) => l.id === id);
  if (idx === -1) return false;
  list[idx] = { ...list[idx], ...updates, id: list[idx].id };
  ensureDataDir();
  writeFileSync(path, JSON.stringify(list, null, 2), "utf8");
  return true;
}

/** 刪除指定 id 的 lesson。回傳是否找到並刪除。 */
export function deleteLesson(id: string): boolean {
  const path = join(DATA_DIR, "lessons.json");
  const list = readJsonArray<Lesson>(path);
  const idx = list.findIndex((l) => l.id === id);
  if (idx === -1) return false;
  const next = list.filter((l) => l.id !== id);
  ensureDataDir();
  writeFileSync(path, JSON.stringify(next, null, 2), "utf8");
  return true;
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

/** 刪除指定 id 的 homework。回傳是否找到並刪除。 */
export function deleteHomework(id: string): boolean {
  const path = join(DATA_DIR, "homework.json");
  const list = readJsonArray<Homework>(path);
  const idx = list.findIndex((h) => h.id === id);
  if (idx === -1) return false;
  const next = list.filter((h) => h.id !== id);
  ensureDataDir();
  writeFileSync(path, JSON.stringify(next, null, 2), "utf8");
  return true;
}
