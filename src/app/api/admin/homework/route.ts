import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { getHomework, appendHomework, updateHomework } from "@/lib/data";
import type { Homework, HomeworkLinkItem } from "@/mock/homework";

function isAdmin(session: { user?: { role?: string } } | null): boolean {
  return (session?.user as { role?: string } | undefined)?.role === "admin";
}

function buildLinks(
  url1?: string,
  url2?: string,
  url3?: string,
  icon1?: string,
  icon2?: string,
  icon3?: string
): HomeworkLinkItem[] | string | undefined {
  const items: HomeworkLinkItem[] = [];
  if (url1?.trim()) items.push({ url: url1.trim(), ...(icon1?.trim() ? { icon: icon1.trim() } : {}) });
  if (url2?.trim()) items.push({ url: url2.trim(), ...(icon2?.trim() ? { icon: icon2.trim() } : {}) });
  if (url3?.trim()) items.push({ url: url3.trim(), ...(icon3?.trim() ? { icon: icon3.trim() } : {}) });
  if (items.length === 0) return undefined;
  if (items.length === 1 && !items[0].icon) return items[0].url;
  return items;
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session)) {
    return NextResponse.json({ error: "僅限 admin" }, { status: 403 });
  }
  try {
    const body = (await req.json()) as Record<string, unknown>;
    const {
      courseId,
      topic,
      week,
      date,
      deadline,
      video1, video2, video3, videoIcon1, videoIcon2, videoIcon3,
      slides1, slides2, slides3, slidesIcon1, slidesIcon2, slidesIcon3,
      code1, code2, code3, codeIcon1, codeIcon2, codeIcon3,
      platform1, platform2, platform3, platformIcon1, platformIcon2, platformIcon3,
      ta,
    } = body;
    if (!courseId || !topic || week == null || !date || !deadline) {
      return NextResponse.json({ error: "缺少必填欄位" }, { status: 400 });
    }
    const existing = getHomework().filter((h) => h.courseId === courseId);
    const nextNum = existing.length + 1;
    const newId = `hw-${String(courseId)}-${nextNum}`;
    const hw: Homework = {
      id: newId,
      courseId: String(courseId),
      topic: String(topic),
      week: Number(week),
      date: String(date),
      deadline: String(deadline),
    };
    const video = buildLinks(
      video1 as string, video2 as string, video3 as string,
      videoIcon1 as string, videoIcon2 as string, videoIcon3 as string
    );
    if (video) hw.video = video;
    const slides = buildLinks(
      slides1 as string, slides2 as string, slides3 as string,
      slidesIcon1 as string, slidesIcon2 as string, slidesIcon3 as string
    );
    if (slides) hw.slides = slides;
    const code = buildLinks(
      code1 as string, code2 as string, code3 as string,
      codeIcon1 as string, codeIcon2 as string, codeIcon3 as string
    );
    if (code) hw.code = code;
    const platform = buildLinks(
      platform1 as string, platform2 as string, platform3 as string,
      platformIcon1 as string, platformIcon2 as string, platformIcon3 as string
    );
    if (platform) hw.platform = platform;
    if (ta) hw.ta = String(ta);
    appendHomework(hw);
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
    const id = body.id as string | undefined;
    if (!id?.trim()) {
      return NextResponse.json({ error: "缺少 id" }, { status: 400 });
    }
    const {
      courseId,
      topic,
      week,
      date,
      deadline,
      video1, video2, video3, videoIcon1, videoIcon2, videoIcon3,
      slides1, slides2, slides3, slidesIcon1, slidesIcon2, slidesIcon3,
      code1, code2, code3, codeIcon1, codeIcon2, codeIcon3,
      platform1, platform2, platform3, platformIcon1, platformIcon2, platformIcon3,
      ta,
    } = body;
    if (!courseId || !topic || week == null || !date || !deadline) {
      return NextResponse.json({ error: "缺少必填欄位" }, { status: 400 });
    }
    const hw: Homework = {
      id,
      courseId: String(courseId),
      topic: String(topic),
      week: Number(week),
      date: String(date),
      deadline: String(deadline).replace("T", " ").slice(0, 16),
    };
    const video = buildLinks(
      video1 as string, video2 as string, video3 as string,
      videoIcon1 as string, videoIcon2 as string, videoIcon3 as string
    );
    if (video) hw.video = video;
    const slides = buildLinks(
      slides1 as string, slides2 as string, slides3 as string,
      slidesIcon1 as string, slidesIcon2 as string, slidesIcon3 as string
    );
    if (slides) hw.slides = slides;
    const code = buildLinks(
      code1 as string, code2 as string, code3 as string,
      codeIcon1 as string, codeIcon2 as string, codeIcon3 as string
    );
    if (code) hw.code = code;
    const platform = buildLinks(
      platform1 as string, platform2 as string, platform3 as string,
      platformIcon1 as string, platformIcon2 as string, platformIcon3 as string
    );
    if (platform) hw.platform = platform;
    if (ta) hw.ta = String(ta);
    const updated = updateHomework(id, hw);
    if (!updated) {
      return NextResponse.json({ error: "僅能編輯由 admin 新增的作業，或 id 不存在" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "更新失敗" }, { status: 500 });
  }
}
