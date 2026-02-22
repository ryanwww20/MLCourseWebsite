export interface Homework {
  id: string;
  courseId: string;
  title: string;
  week: number;
  date: string;
  /** Deadline: MM/DD/YYYY HH:MM */
  deadline: string;
}

export const homework: Homework[] = [
  {
    id: "hw-1",
    courseId: "ml-2026",
    title: "作業一：線性回歸",
    week: 1,
    date: "2026-02-20",
    deadline: "2026-02-27 23:59",
  },
  {
    id: "hw-2",
    courseId: "ml-2026",
    title: "作業二：邏輯回歸",
    week: 2,
    date: "2026-02-27",
    deadline: "2026-03-06 23:59",
  },
  {
    id: "hw-3",
    courseId: "ml-2026",
    title: "作業三：神經網路",
    week: 3,
    date: "2026-03-06",
    deadline: "2026-03-13 23:59",
  },
  {
    id: "hw-1-dl",
    courseId: "dl-2026",
    title: "作業一：CNN 實作",
    week: 6,
    date: "2026-02-25",
    deadline: "2026-03-04 23:59",
  },
];
