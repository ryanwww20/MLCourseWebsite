import { NextResponse } from "next/server";
import { getCourses } from "@/lib/data";

export async function GET() {
  const courses = getCourses();
  return NextResponse.json(courses);
}
