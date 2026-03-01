"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { Homework } from "@/mock/homework";
import EditHomeworkModal from "@/components/EditHomeworkModal";

const MONTH_ABBR = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

interface HomeworkListProps {
  courseId: string;
  homework: Homework[];
  onEditSuccess?: () => void;
}

function formatDate(dateStr: string) {
  const [, m, d] = dateStr.split("-").map(Number);
  return `${MONTH_ABBR[m - 1]} ${d}`;
}

/** Parse "YYYY-MM-DD HH:MM" → "MM/DD HH:MM" */
function formatDeadline(deadlineStr: string) {
  const [datePart, timePart] = deadlineStr.split(" ");
  const [, m, d] = datePart.split("-").map(Number);
  const time = timePart ?? "23:59";
  const mm = String(m).padStart(2, "0");
  const dd = String(d).padStart(2, "0");
  return `${mm}/${dd} ${time}`;
}

export default function HomeworkList({ courseId, homework, onEditSuccess }: HomeworkListProps) {
  const { data: session } = useSession();
  const isAdmin = (session?.user as { role?: string } | undefined)?.role === "admin";
  const [editHomework, setEditHomework] = useState<Homework | null>(null);

  return (
    <div className="space-y-3">
      {homework.map((item) => (
        <div
          key={item.id}
          className="flex items-center gap-4 bg-surface rounded-lg border border-border p-4 hover:border-accent hover:shadow-sm transition-all"
        >
          <Link href={`/courses/${courseId}/homework/${item.id}`} className="flex items-center gap-4 flex-1 min-w-0">
            <div className="flex-shrink-0 text-muted text-sm leading-tight w-16">
              <div>Week {item.week}</div>
              <div className="text-lg text-foreground font-semibold">{formatDate(item.date)}</div>
            </div>
            <h4 className="text-lg font-semibold text-foreground flex-1 min-w-0">
              {item.topic}
            </h4>
            <div className="flex-shrink-0 text-right text-muted text-sm leading-tight">
              <div className="text-[#EE0000] text-lg font-medium">Deadline</div>
              <div className="text-foreground font-semibold">{formatDeadline(item.deadline)}</div>
            </div>
          </Link>
          {isAdmin && (
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); setEditHomework(item); }}
              className="flex-shrink-0 px-3 py-1.5 text-sm border border-border rounded-lg text-foreground hover:bg-foreground/5"
            >
              編輯
            </button>
          )}
        </div>
      ))}
      <EditHomeworkModal
        open={!!editHomework}
        onClose={() => setEditHomework(null)}
        onSuccess={() => { onEditSuccess?.(); setEditHomework(null); }}
        homework={editHomework}
      />
    </div>
  );
}
