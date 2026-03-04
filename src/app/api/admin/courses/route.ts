import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { appendCourse, getCourses, getPersistedCourses } from "@/lib/data";
import type { Course } from "@/mock/courses";

function isAdmin(session: { user?: { role?: string } } | null): boolean {
  return (session?.user as { role?: string } | undefined)?.role === "admin";
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session)) {
    return NextResponse.json({ error: "僅限 admin" }, { status: 403 });
  }
  try {
    const body = (await req.json()) as Record<string, unknown>;
    const { id, name, semester, description, instructor, tags, status } = body;
    if (!name || !semester || !description || !instructor) {
      return NextResponse.json({ error: "缺少必填欄位：name, semester, description, instructor" }, { status: 400 });
    }
    const allCourses = getCourses();
    const persisted = getPersistedCourses();
    const rawId = (id as string)?.trim();
    const newId = rawId || `course-${persisted.length + 1}`;
    if (allCourses.some((c) => c.id === newId)) {
      return NextResponse.json({ error: "課程 id 已存在" }, { status: 400 });
    }
    const tagsArr = Array.isArray(tags)
      ? tags.map((t) => String(t).trim()).filter(Boolean)
      : typeof tags === "string"
        ? tags.split(/[\n,]/).map((s) => s.trim()).filter(Boolean)
        : [];
    const course: Course = {
      id: newId,
      name: String(name),
      semester: String(semester),
      description: String(description),
      instructor: String(instructor),
      tags: tagsArr,
      status: status === "previous" ? "previous" : "ongoing",
    };
    appendCourse(course);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "新增失敗" }, { status: 500 });
  }
}
