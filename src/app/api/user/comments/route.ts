import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { getComments, saveComments } from "@/lib/userData";
import type { Comment } from "@/lib/userData";

function getUserId(session: { user?: { id?: string; email?: string | null } } | null): string | null {
  if (!session?.user) return null;
  return session.user.id ?? session.user.email ?? null;
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = getUserId(session);
  if (!userId) {
    return NextResponse.json({ error: "請先登入" }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const courseId = searchParams.get("courseId");
  const lessonId = searchParams.get("lessonId");
  if (!courseId || !lessonId) {
    return NextResponse.json({ error: "缺少 courseId 或 lessonId" }, { status: 400 });
  }
  const comments = getComments(userId, courseId, lessonId);
  return NextResponse.json({ comments });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = getUserId(session);
  if (!userId) {
    return NextResponse.json({ error: "請先登入" }, { status: 401 });
  }
  try {
    const body = (await req.json()) as { courseId: string; lessonId: string; comments: Comment[] };
    const { courseId, lessonId, comments } = body;
    if (!courseId || !lessonId || !Array.isArray(comments)) {
      return NextResponse.json({ error: "缺少 courseId、lessonId 或 comments" }, { status: 400 });
    }
    saveComments(userId, courseId, lessonId, comments);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "儲存失敗" }, { status: 500 });
  }
}
