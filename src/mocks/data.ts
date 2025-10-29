import { StudentProps } from "../models/Student";
import { ClassroomProps } from "../models/Classroom";

export const mockStudents: StudentProps[] = [
  {
    id: "stu-001",
    registration: "REG-2024001",
    name: "João Silva",
    birthDate: "2000-05-15",
    grade: "10º Ano",
    classNumber: "10A",
    address: "Rua das Flores, 123, Fortaleza",
    phone: "85999999999"
  },
  {
    id: "stu-002",
    registration: "REG-2024002",
    name: "Maria Souza",
    birthDate: "2001-09-21",
    grade: "9º Ano",
    classNumber: "09B",
    address: "Av. Beira Mar, 456, Fortaleza",
    phone: "85988887777"
  },
  {
    id: "stu-003",
    registration: "REG-2024003",
    name: "Carlos Lima",
    birthDate: "1999-12-01",
    grade: "3º Ano",
    classNumber: "03C",
    address: "Rua das Mangueiras, 321, Fortaleza",
    phone: "85991234567"
  },
  {
    id: "stu-004",
    registration: "REG-2024004",
    name: "Ana Costa",
    birthDate: "2002-03-09",
    grade: "1º Ano",
    classNumber: "01A",
    address: "Rua José de Alencar, 87, Fortaleza",
    phone: "85993456789"
  }
];

export const mockClassrooms: ClassroomProps[] = [
  {
    id: "class-001",
    name: "Turma de Matemática",
    shift: "Manhã",
    teacherId: "teacher-001",
    studentIds: ["stu-001", "stu-002"]
  },
  {
    id: "class-002",
    name: "Turma de Física",
    shift: "Tarde",
    teacherId: "teacher-002",
    studentIds: ["stu-003"]
  }
];
