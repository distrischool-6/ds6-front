import {
  Classroom,
  ClassroomEditableFields,
  ClassroomProps
} from "../models/Classroom";
import { StudentController } from "./StudentController";

export class ClassroomController {
  #classes: Classroom[] = [];
  #studentController?: StudentController;

  constructor(
    initialClasses: Array<Classroom | ClassroomProps> = [],
    deps?: { studentController?: StudentController }
  ) {
    this.#classes = initialClasses.map(item =>
      item instanceof Classroom ? item : Classroom.from(item)
    );
    this.#studentController = deps?.studentController;
  }

  async list(): Promise<ClassroomProps[]> {
    return this.#classes.map(item => item.toObject());
  }

  async findById(id: string): Promise<ClassroomProps | undefined> {
    const classroom = this.#classes.find(item => item.id === id);
    return classroom?.toObject();
  }

  async create(data: ClassroomEditableFields): Promise<ClassroomProps> {
    const classroom = Classroom.create(data);
    this.#classes = [...this.#classes, classroom];
    return classroom.toObject();
  }

  async delete(id: string): Promise<boolean> {
    const before = this.#classes.length;
    this.#classes = this.#classes.filter(item => item.id !== id);
    return before !== this.#classes.length;
  }

  async update(
    id: string,
    data: Partial<ClassroomEditableFields>
  ): Promise<ClassroomProps> {
    const classroom = this.#ensureClass(id);
    classroom.update(data);
    return classroom.toObject();
  }

  async addStudent(
    classId: string,
    studentId: string
  ): Promise<ClassroomProps> {
    const classroom = this.#ensureClass(classId);
    if (this.#studentController) {
      const student = await this.#studentController.findById(studentId);
      if (!student) {
        throw new Error(`Aluno ${studentId} não encontrado`);
      }
    }
    classroom.addStudent(studentId);
    return classroom.toObject();
  }

  async removeStudent(
    classId: string,
    studentId: string
  ): Promise<ClassroomProps> {
    const classroom = this.#ensureClass(classId);
    classroom.removeStudent(studentId);
    return classroom.toObject();
  }

  async removeStudentFromAll(studentId: string): Promise<void> {
    this.#classes.forEach(classroom => classroom.removeStudent(studentId));
  }

  snapshot(): ClassroomProps[] {
    return this.#classes.map(item => item.toObject());
  }

  #ensureClass(id: string): Classroom {
    const classroom = this.#classes.find(item => item.id === id);
    if (!classroom) {
      throw new Error(`Turma com id ${id} não encontrada`);
    }
    return classroom;
  }
}
