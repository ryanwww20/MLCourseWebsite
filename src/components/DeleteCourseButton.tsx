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
  const isAdmin = (session?.user as { role?: string } | undefined)?.role === "admin";

  if (!isAdmin) return null;

  const handleDelete = async () => {
    if (!confirm(`確定要刪除課程「${courseName}」？此操作將一併刪除該課程的所有章節與作業，且無法復原。`)) return;
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
    <button
      type="button"
      onClick={handleDelete}
      disabled={loading}
      className="px-3 py-1.5 text-sm border border-red-500 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50"
    >
      {loading ? "刪除中…" : "刪除課程"}
    </button>
  );
}
