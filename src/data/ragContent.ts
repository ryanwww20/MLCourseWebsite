/**
 * RAG 知識庫：課程／章節相關文字片段，供檢索與上下文注入
 * 可依課程、章節擴充，或改為從 DB / 向量庫讀取
 */

export interface RAGChunk {
  id: string;
  courseId: string;
  lessonId?: string;
  title: string;
  content: string;
  /** 用於簡單關鍵字檢索的詞（可選） */
  keywords: string[];
}

export const ragChunks: RAGChunk[] = [
  // 機器學習課程
  {
    id: "ml-intro",
    courseId: "ml-2026",
    lessonId: "lesson-1",
    title: "機器學習導論",
    content:
      "機器學習是讓電腦從資料中學習的技術，大致分為監督式學習（有標籤）、非監督式學習（無標籤）與強化學習。本課程會涵蓋監督式與非監督式學習的基礎。",
    keywords: ["機器學習", "導論", "監督式", "非監督式", "ML", "introduction"],
  },
  {
    id: "ml-gradient",
    courseId: "ml-2026",
    lessonId: "lesson-2",
    title: "梯度下降",
    content:
      "梯度下降是一種優化演算法，用於尋找函數的最小值。透過計算損失函數對參數的梯度，沿梯度的反方向更新參數。可搭配學習率、SGD、Mini-batch 等變體。",
    keywords: ["梯度", "gradient", "下降", "優化", "optimization", "損失函數", "學習率"],
  },
  {
    id: "ml-linear",
    courseId: "ml-2026",
    lessonId: "lesson-2",
    title: "線性回歸",
    content:
      "線性回歸假設目標與特徵呈線性關係，以最小化均方誤差（MSE）來擬合參數。可用解析解（正規方程）或梯度下降求解。",
    keywords: ["線性回歸", "linear regression", "MSE", "均方誤差"],
  },
  {
    id: "ml-logistic",
    courseId: "ml-2026",
    lessonId: "lesson-3",
    title: "邏輯回歸與分類",
    content:
      "邏輯回歸用於二分類，以 sigmoid 函數輸出機率。損失函數常用交叉熵（Cross-Entropy）。可推廣到多分類（softmax）。",
    keywords: ["邏輯回歸", "logistic", "分類", "classification", "sigmoid", "交叉熵", "cross-entropy"],
  },
  {
    id: "ml-neural",
    courseId: "ml-2026",
    lessonId: "lesson-4",
    title: "神經網路基礎",
    content:
      "神經網路由多層神經元組成，透過前向傳播計算輸出，反向傳播計算梯度。常見激勵函數有 ReLU、sigmoid。可透過正則化、dropout 減緩過擬合。",
    keywords: ["神經網路", "neural network", "前向傳播", "反向傳播", "ReLU", "過擬合", "overfitting", "dropout"],
  },
  {
    id: "ml-overfitting",
    courseId: "ml-2026",
    title: "過擬合與正則化",
    content:
      "過擬合指模型在訓練集表現好、在測試集表現差。緩解方式：增加資料、正則化（L1/L2）、dropout、early stopping、資料增強等。",
    keywords: ["過擬合", "overfitting", "正則化", "regularization", "L1", "L2", "early stopping"],
  },
  {
    id: "ml-loss",
    courseId: "ml-2026",
    title: "損失函數",
    content:
      "損失函數衡量預測與真實的差異。回歸常用均方誤差（MSE）；分類常用交叉熵（Cross-Entropy）。選擇需與任務與輸出層配合。",
    keywords: ["損失函數", "loss", "MSE", "交叉熵", "cross-entropy", "均方誤差"],
  },
  {
    id: "ml-dl-intro",
    courseId: "ml-2026",
    lessonId: "lesson-5",
    title: "深度學習入門",
    content:
      "深度學習指多層神經網路，可學習階層特徵。實務上需注意初始化、激勵函數、優化器（如 Adam）與超參數調校。",
    keywords: ["深度學習", "deep learning", "Adam", "優化器", "超參數"],
  },
  // 深度學習課程
  {
    id: "dl-basics",
    courseId: "dl-2026",
    lessonId: "lesson-1-dl",
    title: "深度學習基礎",
    content:
      "深度學習基礎包含多層感知器（MLP）、反向傳播、常見激勵函數與權重初始化方式。實作上多用 GPU 與框架（如 PyTorch、TensorFlow）。",
    keywords: ["深度學習", "MLP", "PyTorch", "TensorFlow", "GPU"],
  },
  {
    id: "dl-cnn",
    courseId: "dl-2026",
    lessonId: "lesson-2-dl",
    title: "卷積神經網路",
    content:
      "卷積神經網路（CNN）透過卷積層提取局部特徵，常用於影像分類、物體偵測。經典架構包括 LeNet、AlexNet、VGG、ResNet。",
    keywords: ["CNN", "卷積", "convolution", "ResNet", "VGG", "影像", "image"],
  },
  // 課程描述（無 lessonId）
  {
    id: "course-ml",
    courseId: "ml-2026",
    title: "課程簡介：機器學習",
    content:
      "本課程涵蓋機器學習的基礎理論與實務應用，包括監督式學習、非監督式學習、深度學習等主題。",
    keywords: ["機器學習", "Machine Learning", "監督式", "非監督式", "深度學習"],
  },
  {
    id: "course-dl",
    courseId: "dl-2026",
    title: "課程簡介：深度學習",
    content:
      "深入探討深度神經網路、卷積神經網路、循環神經網路等深度學習模型與應用。",
    keywords: ["深度學習", "Deep Learning", "CNN", "RNN", "神經網路"],
  },
];

/**
 * 簡單關鍵字檢索：依 courseId / lessonId 篩選後，用關鍵字重疊計分，回傳分數最高的前 k 個 chunks
 */
export function retrieveChunks(
  query: string,
  courseId: string,
  lessonId?: string,
  k: number = 5
): RAGChunk[] {
  const queryLower = query.toLowerCase().trim();
  const terms = queryLower.split(/\s+/).filter(Boolean);
  if (terms.length === 0) terms.push(queryLower);

  const filtered = ragChunks.filter(
    (c) => c.courseId === courseId && (!lessonId || c.lessonId === lessonId || !c.lessonId)
  );

  const scored = filtered.map((chunk) => {
    const text = `${chunk.title} ${chunk.content} ${chunk.keywords.join(" ")}`.toLowerCase();
    let score = 0;
    for (const t of terms) {
      if (text.includes(t)) score += 1;
      for (const kw of chunk.keywords) {
        if (kw.toLowerCase().includes(t) || t.includes(kw.toLowerCase())) score += 1;
      }
    }
    return { chunk, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored
    .filter((s) => s.score > 0)
    .slice(0, k)
    .map((s) => s.chunk);
}
