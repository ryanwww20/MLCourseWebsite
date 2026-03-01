"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import type { Lesson } from "@/mock/lessons";
import EditLectureModal from "@/components/EditLectureModal";

interface EditLectureButtonProps {
  lesson: Lesson;
}

export default function EditLectureButton({ lesson }: EditLectureButtonProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const isAdmin = (session?.user as { role?: string } | undefined)?.role === "admin";

  if (!isAdmin) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="px-3 py-1.5 text-sm border border-border rounded-lg text-foreground hover:bg-foreground/5"
      >
        編輯
      </button>
      <EditLectureModal
        open={open}
        onClose={() => setOpen(false)}
        onSuccess={() => { router.refresh(); setOpen(false); }}
        lesson={lesson}
      />
    </>
  );
}
