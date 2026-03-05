import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { getComments, addComment, deleteComment } from "@/lib/comments";

/** 取得某課程／章節的共用留言（不需登入，所有人看到同一份） */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const courseId = searchParams.get("courseId");
  const lessonId = searchParams.get("lessonId");
  if (!courseId || !lessonId) {
    return NextResponse.json({ error: "缺少 courseId 或 lessonId" }, { status: 400 });
  }
  const comments = getComments(courseId, lessonId);
  return NextResponse.json({ comments });
}

/** 新增一則留言（不需登入；未登入時 author 為「訪客」） */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      courseId?: string; lessonId?: string; content?: string;
      replyTo?: { id: string; author: string };
    };
    const { courseId, lessonId, content, replyTo } = body;
    if (!courseId || !lessonId || typeof content !== "string") {
      return NextResponse.json({ error: "缺少 courseId、lessonId 或 content" }, { status: 400 });
    }
    const trimmed = content.trim();
    if (!trimmed) {
      return NextResponse.json({ error: "留言內容不可為空" }, { status: 400 });
    }
    const session = await getServerSession(authOptions);
    const author =
      session?.user?.name ?? session?.user?.email ?? "訪客";
    const comment = addComment(courseId, lessonId, {
      content: trimmed,
      author,
      ...(replyTo?.id && replyTo?.author ? { replyTo } : {}),
    });
    return NextResponse.json({ comment });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "新增失敗" }, { status: 500 });
  }
}

/** 刪除一則留言（僅限 admin） */
export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if ((session?.user as { role?: string } | undefined)?.role !== "admin") {
    return NextResponse.json({ error: "僅限 admin" }, { status: 403 });
  }
  try {
    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get("courseId");
    const lessonId = searchParams.get("lessonId");
    const commentId = searchParams.get("id");
    if (!courseId || !lessonId || !commentId) {
      return NextResponse.json({ error: "缺少 courseId、lessonId 或 id" }, { status: 400 });
    }
    const deleted = deleteComment(courseId, lessonId, commentId);
    if (!deleted) {
      return NextResponse.json({ error: "留言不存在" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "刪除失敗" }, { status: 500 });
  }
}
