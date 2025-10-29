export interface StudentProps {
  id: string;
  name: string;
  birthDate: string;
  grade: string;
  classNumber: string;
  address: string;
  phone: string;
  registration: string;
}

export type StudentEditableFields = Omit<StudentProps, "id" | "registration">;

export class Student {
  #props: StudentProps;

  private constructor(props: StudentProps) {
    this.#props = props;
  }

  static create(
    props: StudentEditableFields &
      Partial<Pick<StudentProps, "id" | "registration">>
  ): Student {
    const id =
      props.id ||
      (typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`);

    const registration =
      props.registration ||
      `REG-${id.toString().slice(-6).toUpperCase()}`;

    return new Student({
      id,
      registration,
      name: props.name,
      birthDate: props.birthDate,
      grade: props.grade,
      classNumber: props.classNumber,
      address: props.address,
      phone: props.phone
    });
  }

  static from(props: StudentProps): Student {
    return new Student({ ...props });
  }

  get id(): string {
    return this.#props.id;
  }

  get registration(): string {
    return this.#props.registration;
  }

  get name(): string {
    return this.#props.name;
  }

  get birthDate(): string {
    return this.#props.birthDate;
  }

  get grade(): string {
    return this.#props.grade;
  }

  get classNumber(): string {
    return this.#props.classNumber;
  }

  get address(): string {
    return this.#props.address;
  }

  get phone(): string {
    return this.#props.phone;
  }

  update(fields: Partial<StudentEditableFields>) {
    this.#props = {
      ...this.#props,
      ...fields
    };
  }

  toObject(): StudentProps {
    return { ...this.#props };
  }
}
