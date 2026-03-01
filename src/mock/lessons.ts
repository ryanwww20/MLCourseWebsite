export interface Lesson {
  id: string;
  courseId: string;
  title: string;
  week: number;
  date: string;
  videoCount: number;
  materialLinks: string[];
  /** 影片播放連結（YouTube 或直連影片，用於課程頁內嵌播放） */
  videoLink?: string;
  /** YouTube 影片連結（列表等處可另用） */
  youtubeLink?: string;
  /** 投影片（PPT）連結 */
  pptLink?: string;
  /** PDF 連結 */
  pdfLink?: string;
}

export const lessons: Lesson[] = [
  {
    id: "lesson-1",
    courseId: "ml-2026",
    title: "機器學習導論",
    week: 1,
    date: "2026-02-15",
    videoCount: 2,
    materialLinks: ["https://example.com/slides/week1.pdf", "https://example.com/homework/week1.pdf"],
    youtubeLink: "https://www.youtube.com/watch?v=example1",
    pptLink: "https://example.com/slides/week1.pptx",
    pdfLink: "https://example.com/slides/week1.pdf",
  },
  {
    id: "lesson-2",
    courseId: "ml-2026",
    title: "線性回歸與梯度下降",
    week: 2,
    date: "2026-02-22",
    videoCount: 3,
    materialLinks: ["https://example.com/slides/week2.pdf"],
    youtubeLink: "https://www.youtube.com/watch?v=example2",
    pptLink: "https://example.com/slides/week2.pptx",
    pdfLink: "https://example.com/slides/week2.pdf",
  },
  {
    id: "lesson-3",
    courseId: "ml-2026",
    title: "邏輯回歸與分類",
    week: 3,
    date: "2026-03-01",
    videoCount: 2,
    materialLinks: ["https://example.com/slides/week3.pdf", "https://example.com/code/week3.zip"],
    youtubeLink: "https://www.youtube.com/watch?v=example3",
    pptLink: "https://example.com/slides/week3.pptx",
    pdfLink: "https://example.com/slides/week3.pdf",
  },
  {
    id: "lesson-4",
    courseId: "ml-2026",
    title: "神經網路基礎",
    week: 4,
    date: "2026-03-08",
    videoCount: 4,
    materialLinks: ["https://example.com/slides/week4.pdf"],
    youtubeLink: "https://www.youtube.com/watch?v=example4",
    pptLink: "https://example.com/slides/week4.pptx",
    pdfLink: "https://example.com/slides/week4.pdf",
  },
  {
    id: "lesson-5",
    courseId: "ml-2026",
    title: "深度學習入門",
    week: 5,
    date: "2026-03-15",
    videoCount: 3,
    materialLinks: ["https://example.com/slides/week5.pdf", "https://example.com/notebook/week5.ipynb"],
    youtubeLink: "https://www.youtube.com/watch?v=example5",
    pptLink: "https://example.com/slides/week5.pptx",
    pdfLink: "https://example.com/slides/week5.pdf",
  },
  {
    id: "lesson-1-dl",
    courseId: "dl-2026",
    title: "深度學習基礎",
    week: 6,
    date: "2026-02-16",
    videoCount: 2,
    materialLinks: ["https://example.com/slides/dl-week1.pdf"],
    youtubeLink: "https://www.youtube.com/watch?v=example-dl1",
    pptLink: "https://example.com/slides/dl-week1.pptx",
    pdfLink: "https://example.com/slides/dl-week1.pdf",
  },
  {
    id: "lesson-2-dl",
    courseId: "dl-2026",
    title: "卷積神經網路",
    week: 7,
    date: "2026-02-23",
    videoCount: 3,
    materialLinks: ["https://example.com/slides/dl-week2.pdf"],
    youtubeLink: "https://www.youtube.com/watch?v=example-dl2",
    pptLink: "https://example.com/slides/dl-week2.pptx",
    pdfLink: "https://example.com/slides/dl-week2.pdf",
  },
];

