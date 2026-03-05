export interface Course {
  id: string;
  name: string;
  semester: string;
  description: string;
  instructor: string;
  tags: string[];
  status: "ongoing" | "previous";
}

