"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

interface DeleteCourseButtonProps {
  courseId: string;
  courseName: string;
}

export default function DeleteCourseButton({ courseId, courseName }: DeleteCourseButtonProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const isAdmin = (session?.user as { role?: string } | undefined)?.role === "admin";

  if (!isAdmin) return null;

  const handleDelete = async () => {
    setShowConfirm(false);
    setLoading(true);
    try {
      const res = await fetch(`${BASE_PATH}/api/admin/courses?id=${encodeURIComponent(courseId)}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "刪除失敗");
      router.push("/courses");
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "刪除失敗");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setShowConfirm(true)}
        disabled={loading}
        className="px-3 py-1.5 text-sm border border-red-500 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50"
      >
        {loading ? "刪除中…" : "刪除課程"}
      </button>

      {showConfirm && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40">
          <div className="bg-background border border-border rounded-xl shadow-xl p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-semibold text-foreground mb-2">確認刪除</h3>
            <p className="text-sm text-muted-foreground mb-5">
              確定要刪除課程「<span className="font-medium text-foreground">{courseName}</span>」？
              此操作將一併刪除該課程的所有章節與作業，且<span className="text-red-600 font-medium">無法復原</span>。
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
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
    </>
  );
}
