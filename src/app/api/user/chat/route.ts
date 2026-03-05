import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { getChat, saveChat, deleteChat } from "@/lib/userData";
import type { Message } from "@/lib/userData";

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
  const tabId = searchParams.get("tabId");
  if (!courseId || !lessonId || !tabId) {
    return NextResponse.json({ error: "缺少 courseId、lessonId 或 tabId" }, { status: 400 });
  }
  const messages = getChat(userId, courseId, lessonId, tabId);
  return NextResponse.json({ messages: messages ?? [] });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = getUserId(session);
  if (!userId) {
    return NextResponse.json({ error: "請先登入" }, { status: 401 });
  }
  try {
    const body = (await req.json()) as { courseId: string; lessonId: string; tabId: string; messages: Message[] };
    const { courseId, lessonId, tabId, messages } = body;
    if (!courseId || !lessonId || !tabId || !Array.isArray(messages)) {
      return NextResponse.json({ error: "缺少 courseId、lessonId、tabId 或 messages" }, { status: 400 });
    }
    saveChat(userId, courseId, lessonId, tabId, messages);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "儲存失敗" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = getUserId(session);
  if (!userId) {
    return NextResponse.json({ error: "請先登入" }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const courseId = searchParams.get("courseId");
  const lessonId = searchParams.get("lessonId");
  const tabId = searchParams.get("tabId");
  if (!courseId || !lessonId || !tabId) {
    return NextResponse.json({ error: "缺少 courseId、lessonId 或 tabId" }, { status: 400 });
  }
  try {
    deleteChat(userId, courseId, lessonId, tabId);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "刪除失敗" }, { status: 500 });
  }
}
