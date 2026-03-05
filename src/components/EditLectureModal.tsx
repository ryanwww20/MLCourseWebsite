"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { Course } from "@/mock/courses";
import type { Lesson, RelatedCourseLink, ExtraMaterial } from "@/mock/lessons";

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

interface EditLectureModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  lesson: Lesson | null;
}

function lessonToForm(lesson: Lesson): Record<string, string> {
  return {
    courseId: lesson.courseId,
    title: lesson.title,
    week: String(lesson.week),
    date: lesson.date,
    videoCount: String(lesson.videoCount ?? 0),
    materialLinks: Array.isArray(lesson.materialLinks) ? lesson.materialLinks.join("\n") : "",
    videoLink: lesson.videoLink ?? "",
    youtubeLink: lesson.youtubeLink ?? "",
    pptLink: lesson.pptLink ?? "",
    pdfLink: lesson.pdfLink ?? "",
  };
}

export default function EditLectureModal({ open, onClose, onSuccess, lesson }: EditLectureModalProps) {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [form, setForm] = useState<Record<string, string>>({});
  const [relatedCourseLinks, setRelatedCourseLinks] = useState<RelatedCourseLink[]>([]);
  const [extraMaterials, setExtraMaterials] = useState<ExtraMaterial[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (open) {
      fetch(`${BASE_PATH}/api/courses`)
        .then((r) => r.json())
        .then(setCourses)
        .catch(() => setCourses([]));
      setSubmitError("");
    }
  }, [open]);

  useEffect(() => {
    if (open && lesson) {
      setForm(lessonToForm(lesson));
      setRelatedCourseLinks(Array.isArray(lesson.relatedCourseLinks) ? [...lesson.relatedCourseLinks] : []);
      setExtraMaterials(Array.isArray(lesson.extraMaterials) ? [...lesson.extraMaterials] : []);
    }
  }, [open, lesson]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lesson) return;
    setSubmitError("");
    setLoading(true);
    try {
      const materialLinks = (form.materialLinks ?? "")
        .split(/[\n,]/)
        .map((s) => s.trim())
        .filter(Boolean);
      const res = await fetch(`${BASE_PATH}/api/admin/lessons`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: lesson.id,
          courseId: form.courseId,
          title: form.title,
          week: Number(form.week),
          date: form.date,
          videoCount: Number(form.videoCount) || 0,
          materialLinks,
          videoLink: form.videoLink || undefined,
          youtubeLink: form.youtubeLink || undefined,
          pptLink: form.pptLink || undefined,
          pdfLink: form.pdfLink || undefined,
          relatedCourseLinks: relatedCourseLinks.filter((l) => l.url.trim()),
          extraMaterials: extraMaterials.filter((m) => m.url.trim()),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "更新失敗");
      onSuccess?.();
      onClose();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "更新失敗");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!lesson) return;
    setShowDeleteConfirm(false);
    setSubmitError("");
    setLoading(true);
    try {
      const res = await fetch(`${BASE_PATH}/api/admin/lessons?id=${encodeURIComponent(lesson.id)}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "刪除失敗");
      onClose();
      onSuccess?.();
      router.push(`/courses/${lesson.courseId}`);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "刪除失敗");
    } finally {
      setLoading(false);
    }
  };

  if (!open || !lesson) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button type="button" onClick={onClose} className="absolute inset-0 bg-black/50" aria-label="關閉" />
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl border border-border bg-surface shadow-xl p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">編輯 Lecture</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-muted mb-1">id</label>
            <p className="text-foreground">{lesson.id}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">courseId *</label>
            <select required value={form.courseId ?? ""} onChange={(e) => setForm((f) => ({ ...f, courseId: e.target.value }))} className="w-full px-3 py-2 border border-border rounded-md text-foreground bg-background">
              <option value="">請選擇</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">title *</label>
            <input required value={form.title ?? ""} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} className="w-full px-3 py-2 border border-border rounded-md text-foreground bg-background" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">week *</label>
              <input required type="number" value={form.week ?? ""} onChange={(e) => setForm((f) => ({ ...f, week: e.target.value }))} className="w-full px-3 py-2 border border-border rounded-md text-foreground bg-background" />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">date *</label>
              <input required type="date" value={form.date ?? ""} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} className="w-full px-3 py-2 border border-border rounded-md text-foreground bg-background" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">videoCount</label>
            <input type="number" value={form.videoCount ?? ""} onChange={(e) => setForm((f) => ({ ...f, videoCount: e.target.value }))} className="w-full px-3 py-2 border border-border rounded-md text-foreground bg-background" />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">materialLinks（多個請換行或逗號）</label>
            <textarea value={form.materialLinks ?? ""} onChange={(e) => setForm((f) => ({ ...f, materialLinks: e.target.value }))} rows={2} className="w-full px-3 py-2 border border-border rounded-md text-foreground bg-background resize-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">影片播放連結 (videoLink)</label>
            <input value={form.videoLink ?? ""} onChange={(e) => setForm((f) => ({ ...f, videoLink: e.target.value }))} className="w-full px-3 py-2 border border-border rounded-md text-foreground bg-background" type="url" placeholder="YouTube 或直連影片網址" />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">youtubeLink</label>
            <input value={form.youtubeLink ?? ""} onChange={(e) => setForm((f) => ({ ...f, youtubeLink: e.target.value }))} className="w-full px-3 py-2 border border-border rounded-md text-foreground bg-background" type="url" />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">pptLink</label>
            <input value={form.pptLink ?? ""} onChange={(e) => setForm((f) => ({ ...f, pptLink: e.target.value }))} className="w-full px-3 py-2 border border-border rounded-md text-foreground bg-background" type="url" />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">pdfLink</label>
            <input value={form.pdfLink ?? ""} onChange={(e) => setForm((f) => ({ ...f, pdfLink: e.target.value }))} className="w-full px-3 py-2 border border-border rounded-md text-foreground bg-background" type="url" />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">相關課程連結</label>
            <p className="text-xs text-muted-foreground mb-2">顯示於本講頁「相關課程連結」區塊，可新增多筆（標題 + 連結）</p>
            <div className="space-y-2">
              {relatedCourseLinks.map((link, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <input
                    value={link.label}
                    onChange={(e) => {
                      const next = [...relatedCourseLinks];
                      next[i] = { ...next[i], label: e.target.value };
                      setRelatedCourseLinks(next);
                    }}
                    placeholder="標題"
                    className="flex-1 min-w-0 px-3 py-2 border border-border rounded-md text-foreground bg-background text-sm"
                  />
                  <input
                    value={link.url}
                    onChange={(e) => {
                      const next = [...relatedCourseLinks];
                      next[i] = { ...next[i], url: e.target.value };
                      setRelatedCourseLinks(next);
                    }}
                    placeholder="https://..."
                    type="url"
                    className="flex-1 min-w-0 px-3 py-2 border border-border rounded-md text-foreground bg-background text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setRelatedCourseLinks((prev) => prev.filter((_, j) => j !== i))}
                    className="p-2 text-muted-foreground hover:text-foreground rounded"
                    aria-label="刪除此筆"
                  >
                    ×
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setRelatedCourseLinks((prev) => [...prev, { label: "", url: "" }])}
                className="text-sm px-3 py-1.5 border border-border rounded-lg text-foreground hover:bg-foreground/5"
              >
                ＋ 新增一筆
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Extra Material</label>
            <p className="text-xs text-muted-foreground mb-2">可新增多筆額外教材，選擇類型後填入標題與連結</p>
            <div className="space-y-3">
              {extraMaterials.map((mat, i) => (
                <div key={i} className="flex gap-2 items-start">
                  <select
                    value={mat.type}
                    onChange={(e) => {
                      const next = [...extraMaterials];
                      next[i] = { ...next[i], type: e.target.value as "video" | "slide" };
                      setExtraMaterials(next);
                    }}
                    className="px-3 py-2 border border-border rounded-md text-foreground bg-background text-sm w-24 flex-shrink-0"
                  >
                    <option value="video">Video</option>
                    <option value="slide">Slide</option>
                  </select>
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <input
                      value={mat.title}
                      onChange={(e) => {
                        const next = [...extraMaterials];
                        next[i] = { ...next[i], title: e.target.value };
                        setExtraMaterials(next);
                      }}
                      placeholder="標題（顯示名稱）"
                      type="text"
                      className="w-full px-3 py-2 border border-border rounded-md text-foreground bg-background text-sm"
                    />
                    <input
                      value={mat.url}
                      onChange={(e) => {
                        const next = [...extraMaterials];
                        next[i] = { ...next[i], url: e.target.value };
                        setExtraMaterials(next);
                      }}
                      placeholder="https://..."
                      type="url"
                      className="w-full px-3 py-2 border border-border rounded-md text-foreground bg-background text-sm"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setExtraMaterials((prev) => prev.filter((_, j) => j !== i))}
                    className="p-2 text-muted-foreground hover:text-foreground rounded mt-1"
                    aria-label="刪除此筆"
                  >
                    ×
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setExtraMaterials((prev) => [...prev, { type: "video", title: "", url: "" }])}
                className="text-sm px-3 py-1.5 border border-border rounded-lg text-foreground hover:bg-foreground/5"
              >
                ＋ 新增一筆
              </button>
            </div>
          </div>
          {submitError && <p className="text-sm text-red-600">{submitError}</p>}
          <div className="flex gap-2 pt-2 justify-between">
            <div className="flex gap-2">
              <button type="button" onClick={onClose} className="px-4 py-2 border border-border rounded-lg text-foreground">取消</button>
              <button type="submit" disabled={loading} className="px-4 py-2 bg-foreground text-background rounded-lg disabled:opacity-50">{loading ? "儲存中…" : "儲存"}</button>
            </div>
            <button type="button" onClick={() => setShowDeleteConfirm(true)} disabled={loading} className="px-4 py-2 border border-red-500 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50">刪除</button>
          </div>
        </form>

        {showDeleteConfirm && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40">
            <div className="bg-background border border-border rounded-xl shadow-xl p-6 max-w-sm w-full mx-4">
              <h3 className="text-lg font-semibold text-foreground mb-2">確認刪除</h3>
              <p className="text-sm text-muted-foreground mb-5">
                確定要刪除章節「<span className="font-medium text-foreground">{lesson?.title}</span>」？
                此操作<span className="text-red-600 font-medium">無法復原</span>。
              </p>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 border border-border rounded-lg text-foreground text-sm hover:bg-foreground/5"
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700"
                >
                  確認刪除
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
