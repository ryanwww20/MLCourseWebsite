/** 相關課程連結（admin 可編輯） */
export interface RelatedCourseLink {
  label: string;
  url: string;
  /** 影片時間戳（秒），點擊可跳到 YouTube 對應位置 */
  timestamp?: number;
}

/** 額外教材（video 或 slide，admin 可編輯） */
export interface ExtraMaterial {
  type: "video" | "slide";
  title: string;
  url: string;
}

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
  /** 相關課程連結（本講頁「相關課程連結」區塊，admin 可編輯） */
  relatedCourseLinks?: RelatedCourseLink[];
  /** 額外教材（本講頁「Extra Material」區塊，admin 可編輯） */
  extraMaterials?: ExtraMaterial[];
}

