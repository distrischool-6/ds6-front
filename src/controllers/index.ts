import { ClassroomController } from "./ClassroomController";
import { StudentController } from "./StudentController";

const studentServiceUrl = import.meta.env
  ?.VITE_STUDENT_SERVICE_URL as string | undefined;
const classServiceUrl = import.meta.env
  ?.VITE_CLASS_SERVICE_URL as string | undefined;

export const studentController = new StudentController({
  baseUrl: studentServiceUrl
});
export const classroomController = new ClassroomController({
  baseUrl: classServiceUrl,
  studentController
});

export type { StudentSearchQuery } from "./StudentController";
export type { StudentProps, StudentEditableFields } from "../models/Student";
export type { ClassroomProps, ClassroomEditableFields } from "../models/Classroom";
