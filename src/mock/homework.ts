/** 單一連結，可選填 icon（路徑如 /icons/xxx.png） */
export interface HomeworkLinkItem {
  url: string;
  icon?: string;
}

/** 支援單一網址（字串）或多個連結（陣列），每個可自訂 icon */
export type HomeworkLink = string | HomeworkLinkItem[];

export interface Homework {
  id: string;
  courseId: string;
  topic: string;
  week: number;
  date: string;
  /** Deadline: YYYY-MM-DD HH:MM */
  deadline: string;
  video?: HomeworkLink;
  slides?: HomeworkLink;
  code?: HomeworkLink;
  platform?: HomeworkLink;
  /** 選填：單一連結時或陣列項目未填 icon 時的預設路徑 */
  videoIcon?: string;
  slidesIcon?: string;
  codeIcon?: string;
  platformIcon?: string;
  ta?: string;
}

export const homework: Homework[] = [
  {
    id: "hw-1",
    courseId: "ml-2026",
    topic: "Linear Regression",
    week: 1,
    date: "2026-02-20",
    deadline: "2026-02-27 23:59",
    video: [
      { url: "https://www.youtube.com/watch?v=example1" },
      { url: "https://www.youtube.com/watch?v=example1-part2", icon: "/icons/icon-youtube.png" },
    ],
    slides: [
      { url: "https://example.com/slides/hw1.pdf" },
      { url: "https://example.com/slides/hw1-extra.pdf", icon: "/icons/icon-pdf.png" },
    ],
    code: [
      { url: "https://github.com/example/hw1", icon: "/icons/code-k.png" },
    ],
    platform: [
      { url: "https://cool.ntu.edu.tw/courses/ml2026", icon: "/icons/gradescope.png" },
      { url: "https://judgeboi.example.com/hw1", icon: "/icons/judgeboi.png" },
    ],
    ta: "王小明 (hw@csie.ntu.edu.tw)",
  },
  {
    id: "hw-2",
    courseId: "ml-2026",
    topic: "Logistic Regression",
    week: 2,
    date: "2026-02-27",
    deadline: "2026-03-06 23:59",
    video: "https://www.youtube.com/watch?v=example2",
    slides: "https://example.com/slides/hw2.pdf",
    code: "https://github.com/example/hw2",
    platform: "https://cool.ntu.edu.tw/courses/ml2026",
    codeIcon: "/icons/code-k.png",
    platformIcon: "/icons/judgeboi.png",
    ta: "李小華 (ta2@csie.ntu.edu.tw)",
  },
  {
    id: "hw-3",
    courseId: "ml-2026",
    topic: "Neural Networks",
    week: 3,
    date: "2026-03-06",
    deadline: "2026-03-13 23:59",
    video: "https://www.youtube.com/watch?v=example3",
    slides: "https://example.com/slides/hw3.pdf",
    code: "https://github.com/example/hw3",
    platform: "https://cool.ntu.edu.tw/courses/ml2026",
    platformIcon: "/icons/gradescope.png",
    ta: "陳小美 (ta3@csie.ntu.edu.tw)",
  },
  {
    id: "hw-1-dl",
    courseId: "dl-2026",
    topic: "Convolutional Neural Networks",
    week: 6,
    date: "2026-02-25",
    deadline: "2026-03-04 23:59",
    video: "https://www.youtube.com/watch?v=example-dl1",
    slides: "https://example.com/slides/dl-hw1.pdf",
    code: "https://github.com/example/dl-hw1",
    platform: "https://cool.ntu.edu.tw/courses/dl2026",
    codeIcon: "/icons/code-k.png",
    platformIcon: "/icons/judgeboi.png",
    ta: "林助教 (dl-ta@csie.ntu.edu.tw)",
  },
];
