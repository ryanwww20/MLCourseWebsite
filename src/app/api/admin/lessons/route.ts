import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { appendLesson } from "@/lib/data";
import type { Lesson } from "@/mock/lessons";

function isAdmin(session: { user?: { role?: string } } | null): boolean {
  return (session?.user as { role?: string } | undefined)?.role === "admin";
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session)) {
    return NextResponse.json({ error: "僅限 admin" }, { status: 403 });
  }
  try {
    const body = (await req.json()) as Lesson;
    const { id, courseId, title, week, date, videoCount, materialLinks, youtubeLink, pptLink, pdfLink } = body;
    if (!id || !courseId || !title || week == null || !date) {
      return NextResponse.json({ error: "缺少必填欄位" }, { status: 400 });
    }
    const lesson: Lesson = {
      id,
      courseId,
      title,
      week: Number(week),
      date,
      videoCount: Number(videoCount) || 0,
      materialLinks: Array.isArray(materialLinks) ? materialLinks : [],
      youtubeLink: youtubeLink || undefined,
      pptLink: pptLink || undefined,
      pdfLink: pdfLink || undefined,
    };
    appendLesson(lesson);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "新增失敗" }, { status: 500 });
  }
}
