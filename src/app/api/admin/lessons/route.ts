import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { appendLesson, getPersistedLessons, updateLesson, deleteLesson } from "@/lib/data";
import type { Lesson, RelatedCourseLink, ExtraMaterial } from "@/mock/lessons";

function parseRelatedCourseLinks(v: unknown): RelatedCourseLink[] {
  if (!Array.isArray(v)) return [];
  return v
    .map((item) => {
      if (item && typeof item === "object" && "label" in item && "url" in item) {
        const label = String((item as { label: unknown }).label).trim();
        const url = String((item as { url: unknown }).url).trim();
        return url ? { label: label || url, url } : null;
      }
      return null;
    })
    .filter((x): x is RelatedCourseLink => x !== null);
}

function parseExtraMaterials(v: unknown): ExtraMaterial[] {
  if (!Array.isArray(v)) return [];
  return v
    .map((item) => {
      if (item && typeof item === "object" && "type" in item && "url" in item) {
        const type = String((item as { type: unknown }).type).trim();
        const title = "title" in item ? String((item as { title: unknown }).title).trim() : "";
        const url = String((item as { url: unknown }).url).trim();
        if ((type === "video" || type === "slide") && url) return { type, title, url };
      }
      return null;
    })
    .filter((x): x is ExtraMaterial => x !== null);
}

function isAdmin(session: { user?: { role?: string } } | null): boolean {
  return session?.user?.role === "admin";
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session)) {
    return NextResponse.json({ error: "僅限 admin" }, { status: 403 });
  }
  try {
    const body = (await req.json()) as Record<string, unknown>;
    const { id, courseId, title, week, date, videoCount, materialLinks, videoLink, youtubeLink, pptLink, pdfLink, relatedCourseLinks, extraMaterials } = body;
    if (!courseId || !title || week == null || !date) {
      return NextResponse.json({ error: "缺少必填欄位" }, { status: 400 });
    }
    const persistedForCourse = getPersistedLessons().filter((l) => l.courseId === courseId);
    const newId = (id as string)?.trim() || `lesson-${String(courseId)}-${persistedForCourse.length + 1}`;
    const lesson: Lesson = {
      id: newId,
      courseId: String(courseId),
      title: String(title),
      week: Number(week),
      date: String(date),
      videoCount: Number(videoCount) || 0,
      materialLinks: Array.isArray(materialLinks) ? materialLinks : (typeof materialLinks === "string" ? materialLinks.split(/[\n,]/).map((s) => s.trim()).filter(Boolean) : []),
      videoLink: (videoLink as string) || undefined,
      youtubeLink: (youtubeLink as string) || undefined,
      pptLink: (pptLink as string) || undefined,
      pdfLink: (pdfLink as string) || undefined,
      relatedCourseLinks: parseRelatedCourseLinks(relatedCourseLinks),
      extraMaterials: parseExtraMaterials(extraMaterials),
    };
    appendLesson(lesson);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "新增失敗" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session)) {
    return NextResponse.json({ error: "僅限 admin" }, { status: 403 });
  }
  try {
    const body = (await req.json()) as Record<string, unknown>;
    const { id, courseId, title, week, date, videoCount, materialLinks, videoLink, youtubeLink, pptLink, pdfLink, relatedCourseLinks, extraMaterials } = body;
    if (!id || !courseId || !title || week == null || !date) {
      return NextResponse.json({ error: "缺少必填欄位" }, { status: 400 });
    }
    const lesson: Lesson = {
      id: String(id),
      courseId: String(courseId),
      title: String(title),
      week: Number(week),
      date: String(date),
      videoCount: Number(videoCount) || 0,
      materialLinks: Array.isArray(materialLinks) ? materialLinks : (typeof materialLinks === "string" ? materialLinks.split(/[\n,]/).map((s) => s.trim()).filter(Boolean) : []),
      videoLink: (videoLink as string) || undefined,
      youtubeLink: (youtubeLink as string) || undefined,
      pptLink: (pptLink as string) || undefined,
      pdfLink: (pdfLink as string) || undefined,
      relatedCourseLinks: parseRelatedCourseLinks(relatedCourseLinks),
      extraMaterials: parseExtraMaterials(extraMaterials),
    };
    const updated = updateLesson(String(id), lesson);
    if (!updated) {
      return NextResponse.json({ error: "僅能編輯由 admin 新增的 lecture，或 id 不存在" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "更新失敗" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session)) {
    return NextResponse.json({ error: "僅限 admin" }, { status: 403 });
  }
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id?.trim()) {
      return NextResponse.json({ error: "缺少 id" }, { status: 400 });
    }
    const deleted = deleteLesson(id.trim());
    if (!deleted) {
      return NextResponse.json({ error: "章節不存在或無法刪除" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "刪除失敗" }, { status: 500 });
  }
}
