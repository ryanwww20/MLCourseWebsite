import { NextRequest, NextResponse } from "next/server";
import { retrieveChunks } from "@/data/ragContent";

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
const HF_MODEL_DEFAULT = "meta-llama/Llama-3.2-3B-Instruct";

const RAG_BACKEND_URL = process.env.RAG_BACKEND_URL?.replace(/\/$/, ""); // e.g. http://localhost:5010

export interface ChatRequestBody {
  courseId: string;
  lessonId?: string;
  message: string;
  videoTimestamp?: string;
  /** 多輪對話：第一次不傳，之後帶上後端回傳的 conversation_id */
  conversation_id?: string | null;
  /** 目前觀看的課程／影片名稱，供 ML2026 RAG 後端做 video_context */
  video_name?: string | null;
  /** base64 圖片（不含 data URI 前綴），選填 */
  image?: string | null;
  image_mime_type?: string | null;
}

function buildRAGContext(chunks: { title: string; content: string }[]): string {
  if (chunks.length === 0) return "（目前沒有檢索到與課程相關的內容，請依一般知識回答。）";
  return chunks
    .map((c, i) => `【${i + 1}】${c.title}\n${c.content}`)
    .join("\n\n");
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ChatRequestBody;
    const {
      courseId,
      lessonId,
      message,
      videoTimestamp,
      conversation_id,
      video_name,
      image,
      image_mime_type,
    } = body;

    if (!courseId || !message?.trim()) {
      return NextResponse.json(
        { error: "缺少 courseId 或 message" },
        { status: 400 }
      );
    }

    // 若已設定 ML2026 RAG 後端，直接轉發到該 API
    if (RAG_BACKEND_URL) {
      const ragPayload: Record<string, unknown> = {
        query: message.trim(),
        conversation_id: conversation_id || null,
      };
      if (video_name) {
        ragPayload.video_context = {
          video_name,
          timestamp: videoTimestamp || null,
        };
      }
      if (image && image_mime_type) {
        ragPayload.image = image;
        ragPayload.image_mime_type = image_mime_type;
      }

      const ragRes = await fetch(`${RAG_BACKEND_URL}/api/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ragPayload),
        signal: AbortSignal.timeout(5 * 60 * 1000), // 5 min
      });

      const ragData = (await ragRes.json()) as {
        response?: string | null;
        conversation_id?: string;
        steps?: unknown[];
        error?: string;
      };

      if (!ragRes.ok) {
        return NextResponse.json(
          { error: ragData.error ?? "RAG 後端錯誤", details: String(ragRes.status) },
          { status: ragRes.status >= 500 ? 502 : ragRes.status }
        );
      }

      return NextResponse.json({
        content: ragData.response ?? "(No response)",
        conversation_id: ragData.conversation_id ?? undefined,
        steps: ragData.steps,
      });
    }

    const hfKey = process.env.HUGGINGFACE_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;

    if (!hfKey && !openaiKey) {
      return NextResponse.json(
        {
          error: "未設定 LLM API Key",
          hint: "請在 .env.local 設定 HUGGINGFACE_API_KEY（推薦）或 OPENAI_API_KEY 以啟用 RAG 助教；或設定 RAG_BACKEND_URL 使用 ML2026 RAG 後端",
        },
        { status: 503 }
      );
    }

    // RAG：從知識庫檢索相關片段
    const chunks = retrieveChunks(message.trim(), courseId, lessonId, 5);
    const context = buildRAGContext(chunks);

    const timeHint = videoTimestamp
      ? `使用者目前影片時間戳：${videoTimestamp}，若問題與影片內容有關可一併參考。`
      : "";

    const systemPrompt = `你是這門課的 AI 助教，用繁體中文回答。請根據以下「課程相關內容」優先回答學生的問題；若內容不足以回答，可簡要補充並建議查閱教材或課堂錄影。

課程相關內容：
${context}
${timeHint}

回答時簡潔、友善，必要時可列點或使用 Markdown。`;

    const userContent = message.trim();

    if (hfKey) {
      // 使用 Hugging Face Router（OpenAI 相容 API）：https://router.huggingface.co
      const model = process.env.HF_MODEL ?? HF_MODEL_DEFAULT;
      const url = "https://router.huggingface.co/v1/chat/completions";

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${hfKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userContent },
          ],
          max_tokens: 1024,
          temperature: 0.6,
        }),
      });

      if (!response.ok) {
        const err = await response.text();
        console.error("Hugging Face API error:", response.status, err);
        return NextResponse.json(
          { error: "LLM 服務暫時無法回應", details: err.slice(0, 300) },
          { status: 502 }
        );
      }

      const data = (await response.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const content =
        data.choices?.[0]?.message?.content?.trim() ||
        "抱歉，我暫時無法產生回覆，請再試一次。";

      return NextResponse.json({ content });
    }

    // 使用 OpenAI API
    const response = await fetch(OPENAI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent },
        ],
        max_tokens: 1024,
        temperature: 0.6,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("OpenAI API error:", response.status, err);
      return NextResponse.json(
        { error: "LLM 服務暫時無法回應", details: err.slice(0, 200) },
        { status: 502 }
      );
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content =
      data.choices?.[0]?.message?.content?.trim() ||
      "抱歉，我暫時無法產生回覆，請再試一次。";

    return NextResponse.json({ content });
  } catch (e) {
    console.error("Chat API error:", e);
    return NextResponse.json(
      { error: "伺服器錯誤", details: String(e) },
      { status: 500 }
    );
  }
}
