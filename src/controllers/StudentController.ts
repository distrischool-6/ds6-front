import {
  Student,
  StudentEditableFields,
  StudentProps
} from "../models/Student";

export type StudentSearchQuery = {
  name?: string;
  registration?: string;
};

export class StudentController {
  #students: Student[] = [];

  constructor(initialStudents: Array<Student | StudentProps> = []) {
    this.#students = initialStudents.map(student =>
      student instanceof Student ? student : Student.from(student)
    );
  }

  async list(): Promise<StudentProps[]> {
    return this.#students.map(student => student.toObject());
  }

  async findById(id: string): Promise<StudentProps | undefined> {
    const student = this.#students.find(item => item.id === id);
    return student?.toObject();
  }

  async create(data: StudentEditableFields): Promise<StudentProps> {
    const student = Student.create(data);
    this.#students = [...this.#students, student];
    return student.toObject();
  }

  async update(
    id: string,
    data: Partial<StudentEditableFields>
  ): Promise<StudentProps> {
    const student = this.#ensureStudent(id);
    student.update(data);
    return student.toObject();
  }

  async delete(id: string): Promise<boolean> {
    const beforeLength = this.#students.length;
    this.#students = this.#students.filter(student => student.id !== id);
    return beforeLength !== this.#students.length;
  }

  async search(query: StudentSearchQuery): Promise<StudentProps[]> {
    const normalizedName = query.name?.trim().toLowerCase();
    const normalizedRegistration = query.registration?.trim().toLowerCase();

    return this.#students
      .filter(student => {
        const matchesName = normalizedName
          ? student.name.toLowerCase().includes(normalizedName)
          : true;
        const matchesRegistration = normalizedRegistration
          ? student.registration.toLowerCase().includes(normalizedRegistration)
          : true;
        return matchesName && matchesRegistration;
      })
      .map(student => student.toObject());
  }

  async bulkImport(entries: StudentEditableFields[]): Promise<void> {
    const newStudents = entries.map(Student.create);
    this.#students = [...this.#students, ...newStudents];
  }

  snapshot(): StudentProps[] {
    return this.#students.map(student => student.toObject());
  }

  #ensureStudent(id: string): Student {
    const student = this.#students.find(item => item.id === id);
    if (!student) {
      throw new Error(`Aluno com id ${id} não encontrado`);
    }
    return student;
  }
}
