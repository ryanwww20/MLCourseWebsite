"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import type { Homework } from "@/mock/homework";
import EditHomeworkModal from "@/components/EditHomeworkModal";

interface EditHomeworkButtonProps {
  homework: Homework;
}

export default function EditHomeworkButton({ homework }: EditHomeworkButtonProps) {
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
      <EditHomeworkModal
        open={open}
        onClose={() => setOpen(false)}
        onSuccess={() => { router.refresh(); setOpen(false); }}
        homework={homework}
      />
    </>
  );
}
