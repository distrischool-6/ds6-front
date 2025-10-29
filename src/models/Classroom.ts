export interface ClassroomProps {
  id: string;
  name: string;
  shift: "Manhã" | "Tarde" | "Noite" | string;
  teacherId: string;
  studentIds: string[];
}

export type ClassroomEditableFields = Omit<ClassroomProps, "id" | "studentIds"> & {
  studentIds?: string[];
};

export class Classroom {
  #props: ClassroomProps;

  private constructor(props: ClassroomProps) {
    this.#props = {
      ...props,
      studentIds: [...props.studentIds]
    };
  }

  static create(
    props: ClassroomEditableFields &
      Partial<Pick<ClassroomProps, "id">>
  ): Classroom {
    const id =
      props.id ||
      (typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`);

    return new Classroom({
      id,
      name: props.name,
      shift: props.shift,
      teacherId: props.teacherId,
      studentIds: props.studentIds ? [...props.studentIds] : []
    });
  }

  static from(props: ClassroomProps): Classroom {
    return new Classroom(props);
  }

  get id(): string {
    return this.#props.id;
  }

  get name(): string {
    return this.#props.name;
  }

  get shift(): string {
    return this.#props.shift;
  }

  get teacherId(): string {
    return this.#props.teacherId;
  }

  get studentIds(): string[] {
    return [...this.#props.studentIds];
  }

  update(fields: Partial<ClassroomEditableFields>) {
    this.#props = {
      ...this.#props,
      ...fields,
      studentIds: fields.studentIds
        ? [...fields.studentIds]
        : [...this.#props.studentIds]
    };
  }

  addStudent(studentId: string) {
    if (!this.#props.studentIds.includes(studentId)) {
      this.#props.studentIds = [...this.#props.studentIds, studentId];
    }
  }

  removeStudent(studentId: string) {
    this.#props.studentIds = this.#props.studentIds.filter(
      id => id !== studentId
    );
  }

  toObject(): ClassroomProps {
    return {
      ...this.#props,
      studentIds: this.studentIds
    };
  }
}
