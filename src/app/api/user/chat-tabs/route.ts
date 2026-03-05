import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { getChatTabs, saveChatTabs } from "@/lib/userData";

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
  const data = getChatTabs(userId, courseId, lessonId);
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = getUserId(session);
  if (!userId) {
    return NextResponse.json({ error: "請先登入" }, { status: 401 });
  }
  try {
    const body = (await req.json()) as { courseId: string; lessonId: string; tabIds: string[]; allTabIds?: string[]; titles: Record<string, string> };
    const { courseId, lessonId, tabIds, allTabIds, titles } = body;
    if (!courseId || !lessonId || !Array.isArray(tabIds)) {
      return NextResponse.json({ error: "缺少 courseId、lessonId 或 tabIds" }, { status: 400 });
    }
    saveChatTabs(userId, courseId, lessonId, {
      tabIds,
      allTabIds: Array.isArray(allTabIds) ? allTabIds : tabIds,
      titles: titles ?? {},
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "儲存失敗" }, { status: 500 });
  }
}
