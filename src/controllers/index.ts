import { ClassroomController } from "./ClassroomController";
import { StudentController } from "./StudentController";
import { mockClassrooms, mockStudents } from "../mocks/data";

export const studentController = new StudentController(mockStudents);
export const classroomController = new ClassroomController(
  mockClassrooms,
  { studentController }
);

export type { StudentSearchQuery } from "./StudentController";
export type { StudentProps, StudentEditableFields } from "../models/Student";
export type { ClassroomProps, ClassroomEditableFields } from "../models/Classroom";
