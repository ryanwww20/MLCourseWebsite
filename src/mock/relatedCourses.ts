import type { Course } from "./courses";

export interface RelatedCourse extends Course {
  relation: string;
}

export const getRelatedCourses = (_courseId: string): RelatedCourse[] => {
  return [];
};

