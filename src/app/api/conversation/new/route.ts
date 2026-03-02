import { NextRequest, NextResponse } from "next/server";

const RAG_BACKEND_URL = process.env.RAG_BACKEND_URL?.replace(/\/$/, "");

/**
 * 清除 RAG 後端的對話紀錄。僅在 RAG_BACKEND_URL 有設定時有效。
 * 前端「新對話」時呼叫，之後同一 conversation_id 的下一則訊息會視為新對話。
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { conversation_id?: string | null };
    const conversation_id = body.conversation_id ?? null;

    console.log("[POST /api/conversation/new] Request body:", JSON.stringify({ conversation_id }));

    if (!RAG_BACKEND_URL) {
      return NextResponse.json({ status: "ok" });
    }

    if (!conversation_id) {
      return NextResponse.json({ status: "ok" });
    }

    const res = await fetch(`${RAG_BACKEND_URL}/api/conversation/new`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversation_id }),
    });

    if (!res.ok) {
      const err = (await res.json()) as { error?: string };
      console.warn("RAG conversation/new proxy error:", res.status, err);
    }

    return NextResponse.json({ status: "ok" });
  } catch (e) {
    console.error("Conversation new proxy error:", e);
    return NextResponse.json({ status: "ok" });
  }
}
