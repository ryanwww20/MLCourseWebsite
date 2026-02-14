import { Course } from "./courses";

export interface RelatedCourse extends Course {
  relation: string;
}

export const getRelatedCourses = (courseId: string): RelatedCourse[] => {
  const courseMap: Record<string, RelatedCourse[]> = {
    "ml-2026": [
      {
        id: "dl-2026",
        name: "深度學習 (Deep Learning)",
        semester: "2026 Spring",
        description: "深入探討深度神經網路、卷積神經網路、循環神經網路等深度學習模型與應用。",
        instructor: "王教授",
        tags: ["DL", "Neural Networks", "CNN"],
        relation: "進階課程",
      },
      {
        id: "cv-2026",
        name: "電腦視覺 (Computer Vision)",
        semester: "2026 Spring",
        description: "學習影像處理、物體偵測、影像分割等電腦視覺技術與最新研究成果。",
        instructor: "張教授",
        tags: ["CV", "Image Processing", "DL"],
        relation: "應用領域",
      },
      {
        id: "nlp-2026",
        name: "自然語言處理 (NLP)",
        semester: "2026 Spring",
        description: "介紹自然語言處理的核心技術，包括詞嵌入、語言模型、Transformer 等。",
        instructor: "陳教授",
        tags: ["NLP", "Transformer", "LLM"],
        relation: "應用領域",
      },
      {
        id: "rl-2026",
        name: "強化學習 (Reinforcement Learning)",
        semester: "2026 Spring",
        description: "學習強化學習的基本概念、Q-learning、Policy Gradient 等演算法。",
        instructor: "劉教授",
        tags: ["RL", "Q-Learning", "Optimization"],
        relation: "相關主題",
      },
    ],
    "dl-2026": [
      {
        id: "ml-2026",
        name: "機器學習 (Machine Learning)",
        semester: "2026 Spring",
        description: "本課程涵蓋機器學習的基礎理論與實務應用，包括監督式學習、非監督式學習、深度學習等主題。",
        instructor: "李教授",
        tags: ["ML", "DL", "Optimization"],
        relation: "基礎課程",
      },
      {
        id: "cv-2026",
        name: "電腦視覺 (Computer Vision)",
        semester: "2026 Spring",
        description: "學習影像處理、物體偵測、影像分割等電腦視覺技術與最新研究成果。",
        instructor: "張教授",
        tags: ["CV", "Image Processing", "DL"],
        relation: "應用領域",
      },
      {
        id: "nlp-2026",
        name: "自然語言處理 (NLP)",
        semester: "2026 Spring",
        description: "介紹自然語言處理的核心技術，包括詞嵌入、語言模型、Transformer 等。",
        instructor: "陳教授",
        tags: ["NLP", "Transformer", "LLM"],
        relation: "應用領域",
      },
    ],
  };

  return courseMap[courseId] || [];
};

