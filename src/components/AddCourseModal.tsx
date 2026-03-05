"use client";

import { useState, useEffect } from "react";

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

interface AddCourseModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function AddCourseModal({ open, onClose, onSuccess }: AddCourseModalProps) {
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [form, setForm] = useState({
    id: "",
    name: "",
    semester: "",
    description: "",
    instructor: "",
    tags: "",
    status: "ongoing" as "ongoing" | "previous",
  });

  useEffect(() => {
    if (open) {
      setSubmitError("");
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");
    setLoading(true);
    try {
      const tagsArr = form.tags
        .split(/[\n,]/)
        .map((s) => s.trim())
        .filter(Boolean);
      const res = await fetch(`${BASE_PATH}/api/admin/courses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: form.id.trim() || undefined,
          name: form.name,
          semester: form.semester,
          description: form.description,
          instructor: form.instructor,
          tags: tagsArr,
          status: form.status,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "新增失敗");
      onSuccess?.();
      onClose();
      setForm({
        id: "",
        name: "",
        semester: "",
        description: "",
        instructor: "",
        tags: "",
        status: "ongoing",
      });
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
        <h2 className="text-lg font-semibold text-foreground mb-4">新增 Course</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">課程 ID（選填，不填則自動產生）</label>
            <input
              value={form.id}
              onChange={(e) => setForm((f) => ({ ...f, id: e.target.value }))}
              className="w-full px-3 py-2 border border-border rounded-md text-foreground bg-background"
              placeholder="例如：ml-2026"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">課程名稱 *</label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full px-3 py-2 border border-border rounded-md text-foreground bg-background"
              placeholder="例如：機器學習 (Machine Learning)"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">學期 *</label>
            <input
              required
              value={form.semester}
              onChange={(e) => setForm((f) => ({ ...f, semester: e.target.value }))}
              className="w-full px-3 py-2 border border-border rounded-md text-foreground bg-background"
              placeholder="例如：2026 Spring"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">課程簡介 *</label>
            <textarea
              required
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-border rounded-md text-foreground bg-background resize-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">授課教師 *</label>
            <input
              required
              value={form.instructor}
              onChange={(e) => setForm((f) => ({ ...f, instructor: e.target.value }))}
              className="w-full px-3 py-2 border border-border rounded-md text-foreground bg-background"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">標籤（多個請換行或逗號）</label>
            <textarea
              value={form.tags}
              onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
              rows={2}
              className="w-full px-3 py-2 border border-border rounded-md text-foreground bg-background resize-none"
              placeholder="ML, DL, Optimization"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">狀態</label>
            <select
              value={form.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as "ongoing" | "previous" }))}
              className="w-full px-3 py-2 border border-border rounded-md text-foreground bg-background"
            >
              <option value="ongoing">Ongoing</option>
              <option value="previous">Previous</option>
            </select>
          </div>
          {submitError && <p className="text-sm text-red-600">{submitError}</p>}
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-border rounded-lg text-foreground">
              取消
            </button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-foreground text-background rounded-lg disabled:opacity-50">
              {loading ? "送出中…" : "送出"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
