"use client";

import { useState, useEffect } from "react";
import type { Course } from "@/mock/courses";

interface AddLectureModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function AddLectureModal({ open, onClose, onSuccess }: AddLectureModalProps) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [form, setForm] = useState({
    id: "",
    courseId: "",
    title: "",
    week: "",
    date: "",
    videoCount: "0",
    materialLinks: "",
    youtubeLink: "",
    pptLink: "",
    pdfLink: "",
  });

  useEffect(() => {
    if (open) {
      fetch("/api/courses")
        .then((r) => r.json())
        .then(setCourses)
        .catch(() => setCourses([]));
      setSubmitError("");
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");
    setLoading(true);
    try {
      const materialLinks = form.materialLinks
        .split(/[\n,]/)
        .map((s) => s.trim())
        .filter(Boolean);
      const res = await fetch("/api/admin/lessons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: form.id,
          courseId: form.courseId,
          title: form.title,
          week: Number(form.week),
          date: form.date,
          videoCount: Number(form.videoCount) || 0,
          materialLinks,
          youtubeLink: form.youtubeLink || undefined,
          pptLink: form.pptLink || undefined,
          pdfLink: form.pdfLink || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "新增失敗");
      onSuccess?.();
      onClose();
      setForm({ id: "", courseId: "", title: "", week: "", date: "", videoCount: "0", materialLinks: "", youtubeLink: "", pptLink: "", pdfLink: "" });
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "新增失敗");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button type="button" onClick={onClose} className="absolute inset-0 bg-black/50" aria-label="關閉" />
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl border border-border bg-surface shadow-xl p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">新增 Lecture</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">id *</label>
            <input required value={form.id} onChange={(e) => setForm((f) => ({ ...f, id: e.target.value }))} className="w-full px-3 py-2 border border-border rounded-md text-foreground bg-background" placeholder="lesson-1" />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">courseId *</label>
            <select required value={form.courseId} onChange={(e) => setForm((f) => ({ ...f, courseId: e.target.value }))} className="w-full px-3 py-2 border border-border rounded-md text-foreground bg-background">
              <option value="">請選擇</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">title *</label>
            <input required value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} className="w-full px-3 py-2 border border-border rounded-md text-foreground bg-background" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">week *</label>
              <input required type="number" value={form.week} onChange={(e) => setForm((f) => ({ ...f, week: e.target.value }))} className="w-full px-3 py-2 border border-border rounded-md text-foreground bg-background" />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">date * (YYYY-MM-DD)</label>
              <input required value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} className="w-full px-3 py-2 border border-border rounded-md text-foreground bg-background" placeholder="2026-02-15" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">videoCount</label>
            <input type="number" value={form.videoCount} onChange={(e) => setForm((f) => ({ ...f, videoCount: e.target.value }))} className="w-full px-3 py-2 border border-border rounded-md text-foreground bg-background" />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">materialLinks（多個請換行或逗號）</label>
            <textarea value={form.materialLinks} onChange={(e) => setForm((f) => ({ ...f, materialLinks: e.target.value }))} rows={2} className="w-full px-3 py-2 border border-border rounded-md text-foreground bg-background resize-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">youtubeLink</label>
            <input value={form.youtubeLink} onChange={(e) => setForm((f) => ({ ...f, youtubeLink: e.target.value }))} className="w-full px-3 py-2 border border-border rounded-md text-foreground bg-background" type="url" />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">pptLink</label>
            <input value={form.pptLink} onChange={(e) => setForm((f) => ({ ...f, pptLink: e.target.value }))} className="w-full px-3 py-2 border border-border rounded-md text-foreground bg-background" type="url" />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">pdfLink</label>
            <input value={form.pdfLink} onChange={(e) => setForm((f) => ({ ...f, pdfLink: e.target.value }))} className="w-full px-3 py-2 border border-border rounded-md text-foreground bg-background" type="url" />
          </div>
          {submitError && <p className="text-sm text-red-600">{submitError}</p>}
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-border rounded-lg text-foreground">取消</button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-foreground text-background rounded-lg disabled:opacity-50">{loading ? "送出中…" : "送出"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
