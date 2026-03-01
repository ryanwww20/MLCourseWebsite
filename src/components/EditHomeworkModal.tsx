"use client";

import { useState, useEffect } from "react";
import type { Course } from "@/mock/courses";
import type { Homework, HomeworkLink } from "@/mock/homework";

interface EditHomeworkModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  homework: Homework | null;
}

const CODE_PLATFORM_ICONS = [
  { value: "", label: "不選擇" },
  { value: "/icons/colab.png", label: "Google Colab" },
  { value: "/icons/code-k.png", label: "Kaggle" },
  { value: "/icons/gradescope.png", label: "Gradescope" },
  { value: "/icons/judgeboi.png", label: "JudgeBOI" },
] as const;

function toLinkArray(link: HomeworkLink | undefined): { url: string; icon?: string }[] {
  if (link == null) return [];
  if (typeof link === "string") return [{ url: link }];
  return link;
}

function homeworkToForm(hw: Homework): Record<string, string> {
  const v = toLinkArray(hw.video);
  const s = toLinkArray(hw.slides);
  const c = toLinkArray(hw.code);
  const p = toLinkArray(hw.platform);
  const deadlineVal = hw.deadline.includes(" ") ? hw.deadline.replace(" ", "T").slice(0, 16) : `${hw.date}T23:59`;
  return {
    courseId: hw.courseId,
    topic: hw.topic,
    week: String(hw.week),
    date: hw.date,
    deadline: deadlineVal,
    ta: hw.ta ?? "",
    video1: v[0]?.url ?? "", video2: v[1]?.url ?? "", video3: v[2]?.url ?? "",
    slides1: s[0]?.url ?? "", slides2: s[1]?.url ?? "", slides3: s[2]?.url ?? "",
    code1: c[0]?.url ?? "", code2: c[1]?.url ?? "", code3: c[2]?.url ?? "",
    codeIcon1: c[0]?.icon ?? "", codeIcon2: c[1]?.icon ?? "", codeIcon3: c[2]?.icon ?? "",
    platform1: p[0]?.url ?? "", platform2: p[1]?.url ?? "", platform3: p[2]?.url ?? "",
    platformIcon1: p[0]?.icon ?? "", platformIcon2: p[1]?.icon ?? "", platformIcon3: p[2]?.icon ?? "",
  };
}

export default function EditHomeworkModal({ open, onClose, onSuccess, homework }: EditHomeworkModalProps) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [form, setForm] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      fetch("/api/courses")
        .then((r) => r.json())
        .then(setCourses)
        .catch(() => setCourses([]));
      setSubmitError("");
    }
  }, [open]);

  useEffect(() => {
    if (open && homework) {
      setForm(homeworkToForm(homework));
    }
  }, [open, homework]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!homework) return;
    setSubmitError("");
    setLoading(true);
    try {
      const body: Record<string, unknown> = {
        id: homework.id,
        courseId: form.courseId,
        topic: form.topic,
        week: Number(form.week),
        date: form.date,
        deadline: form.deadline.replace("T", " ").slice(0, 16),
        ta: form.ta || undefined,
        video1: form.video1 || undefined, video2: form.video2 || undefined, video3: form.video3 || undefined,
        slides1: form.slides1 || undefined, slides2: form.slides2 || undefined, slides3: form.slides3 || undefined,
        code1: form.code1 || undefined, code2: form.code2 || undefined, code3: form.code3 || undefined,
        codeIcon1: form.codeIcon1 || undefined, codeIcon2: form.codeIcon2 || undefined, codeIcon3: form.codeIcon3 || undefined,
        platform1: form.platform1 || undefined, platform2: form.platform2 || undefined, platform3: form.platform3 || undefined,
        platformIcon1: form.platformIcon1 || undefined, platformIcon2: form.platformIcon2 || undefined, platformIcon3: form.platformIcon3 || undefined,
      };
      const res = await fetch("/api/admin/homework", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
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

  if (!open || !homework) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button type="button" onClick={onClose} className="absolute inset-0 bg-black/50" aria-label="關閉" />
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl border border-border bg-surface shadow-xl p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">編輯 Homework</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-muted mb-1">id</label>
            <p className="text-foreground">{homework.id}</p>
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
            <label className="block text-sm font-medium text-foreground mb-1">topic *</label>
            <input required value={form.topic ?? ""} onChange={(e) => setForm((f) => ({ ...f, topic: e.target.value }))} className="w-full px-3 py-2 border border-border rounded-md text-foreground bg-background" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">week *</label>
              <input required type="number" value={form.week ?? ""} onChange={(e) => setForm((f) => ({ ...f, week: e.target.value }))} className="w-full px-3 py-2 border border-border rounded-md text-foreground bg-background" />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">date *</label>
              <input required type="date" value={form.date ?? ""} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} className="w-full px-3 py-2 border border-border rounded-md text-foreground bg-background" />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">deadline *</label>
              <input required type="datetime-local" value={form.deadline ?? ""} onChange={(e) => setForm((f) => ({ ...f, deadline: e.target.value }))} className="w-full px-3 py-2 border border-border rounded-md text-foreground bg-background" />
            </div>
          </div>
          <div className="border border-border rounded-lg p-3 space-y-2">
            <span className="text-sm font-medium text-foreground">video</span>（最多 3 筆）
            {[1, 2, 3].map((i) => (
              <input key={i} value={form[`video${i}`] ?? ""} onChange={(e) => setForm((f) => ({ ...f, [`video${i}`]: e.target.value }))} className="w-full px-3 py-2 border border-border rounded-md text-foreground bg-background text-sm" placeholder={`video URL ${i}`} type="url" />
            ))}
          </div>
          <div className="border border-border rounded-lg p-3 space-y-2">
            <span className="text-sm font-medium text-foreground">slides</span>（最多 3 筆）
            {[1, 2, 3].map((i) => (
              <input key={i} value={form[`slides${i}`] ?? ""} onChange={(e) => setForm((f) => ({ ...f, [`slides${i}`]: e.target.value }))} className="w-full px-3 py-2 border border-border rounded-md text-foreground bg-background text-sm" placeholder={`slides URL ${i}`} type="url" />
            ))}
          </div>
          <div className="border border-border rounded-lg p-3 space-y-2">
            <span className="text-sm font-medium text-foreground">code</span>（最多 3 筆，可選 icon）
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-2 items-center">
                <input value={form[`code${i}`] ?? ""} onChange={(e) => setForm((f) => ({ ...f, [`code${i}`]: e.target.value }))} className="flex-1 px-3 py-2 border border-border rounded-md text-foreground bg-background text-sm" placeholder={`code URL ${i}`} type="url" />
                <select value={form[`codeIcon${i}`] ?? ""} onChange={(e) => setForm((f) => ({ ...f, [`codeIcon${i}`]: e.target.value }))} className="px-3 py-2 border border-border rounded-md text-foreground bg-background text-sm min-w-[140px]">
                  {CODE_PLATFORM_ICONS.map((opt) => (
                    <option key={opt.value || "none"} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
          <div className="border border-border rounded-lg p-3 space-y-2">
            <span className="text-sm font-medium text-foreground">platform</span>（最多 3 筆，可選 icon）
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-2 items-center">
                <input value={form[`platform${i}`] ?? ""} onChange={(e) => setForm((f) => ({ ...f, [`platform${i}`]: e.target.value }))} className="flex-1 px-3 py-2 border border-border rounded-md text-foreground bg-background text-sm" placeholder={`platform URL ${i}`} type="url" />
                <select value={form[`platformIcon${i}`] ?? ""} onChange={(e) => setForm((f) => ({ ...f, [`platformIcon${i}`]: e.target.value }))} className="px-3 py-2 border border-border rounded-md text-foreground bg-background text-sm min-w-[140px]">
                  {CODE_PLATFORM_ICONS.map((opt) => (
                    <option key={opt.value || "none"} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">TA</label>
            <input value={form.ta ?? ""} onChange={(e) => setForm((f) => ({ ...f, ta: e.target.value }))} className="w-full px-3 py-2 border border-border rounded-md text-foreground bg-background" />
          </div>
          {submitError && <p className="text-sm text-red-600">{submitError}</p>}
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-border rounded-lg text-foreground">取消</button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-foreground text-background rounded-lg disabled:opacity-50">{loading ? "儲存中…" : "儲存"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
