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
