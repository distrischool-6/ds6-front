import {
  Classroom,
  ClassroomEditableFields,
  ClassroomProps
} from "../models/Classroom";
import { StudentController } from "./StudentController";

type ClassroomControllerOptions = {
  baseUrl?: string;
  studentController?: StudentController;
};

const STUDENT_SERVICE_FALLBACK_URL = resolveBaseUrl(
  import.meta.env?.VITE_STUDENT_SERVICE_URL as string | undefined,
  "http://localhost:8080"
);

const CLASSROOM_SERVICE_FALLBACK_URL = resolveBaseUrl(
  import.meta.env?.VITE_CLASS_SERVICE_URL as string | undefined,
  STUDENT_SERVICE_FALLBACK_URL
);

export class ClassroomController {
  #baseUrl: string;
  #cache = new Map<string, Classroom>();
  #studentController?: StudentController;

  constructor(options: ClassroomControllerOptions = {}) {
    this.#baseUrl = resolveBaseUrl(
      options.baseUrl,
      CLASSROOM_SERVICE_FALLBACK_URL
    );
    this.#studentController = options.studentController;
  }

  async list(): Promise<ClassroomProps[]> {
    const data = await this.#request<ClassroomProps[]>("/classes");
    this.#cache.clear();
    if (Array.isArray(data)) {
      data.forEach(item => this.#upsert(normalizeClassroom(item)));
    }
    return this.snapshot();
  }

  async findById(id: string): Promise<ClassroomProps | undefined> {
    const cached = this.#cache.get(id);
    if (cached) return cached.toObject();
    const data = await this.#request<ClassroomProps>(
      `/classes/${encodeURIComponent(id)}`
    );
    if (!data) return undefined;
    return this.#upsert(normalizeClassroom(data)).toObject();
  }

  async create(data: ClassroomEditableFields): Promise<ClassroomProps> {
    const result = await this.#request<ClassroomProps>("/classes", {
      method: "POST",
      body: JSON.stringify(data)
    });
    return this.#upsert(normalizeClassroom(result)).toObject();
  }

  async delete(id: string): Promise<boolean> {
    await this.#request<void>(
      `/classes/${encodeURIComponent(id)}`,
      { method: "DELETE" },
      { parseBody: false }
    );
    return this.#cache.delete(id);
  }

  async update(
    id: string,
    data: Partial<ClassroomEditableFields>
  ): Promise<ClassroomProps> {
    const result = await this.#request<ClassroomProps>(
      `/classes/${encodeURIComponent(id)}`,
      {
        method: "PUT",
        body: JSON.stringify(data)
      }
    );
    return this.#upsert(normalizeClassroom(result)).toObject();
  }

  async addStudent(
    classId: string,
    studentId: string
  ): Promise<ClassroomProps> {
    if (this.#studentController) {
      const student = await this.#studentController.findById(studentId);
      if (!student) {
        throw new Error(`Aluno ${studentId} não encontrado`);
      }
    }

    await this.#request<void>(
      `/classes/${encodeURIComponent(classId)}/students`,
      {
        method: "POST",
        body: JSON.stringify({ studentId })
      },
      { parseBody: false }
    );

    const classroom = await this.findById(classId);
    if (!classroom) {
      throw new Error(`Não foi possível carregar a turma ${classId}`);
    }
    return classroom;
  }

  async removeStudent(
    classId: string,
    studentId: string
  ): Promise<ClassroomProps> {
    await this.#request<void>(
      `/classes/${encodeURIComponent(classId)}/students/${encodeURIComponent(studentId)}`,
      { method: "DELETE" },
      { parseBody: false }
    );

    const classroom = await this.findById(classId);
    if (!classroom) {
      throw new Error(`Não foi possível carregar a turma ${classId}`);
    }
    return classroom;
  }

  async removeStudentFromAll(studentId: string): Promise<void> {
    const classes = await this.list();
    await Promise.all(
      classes
        .filter(classroom => classroom.studentIds.includes(studentId))
        .map(classroom =>
          this.removeStudent(classroom.id, studentId).catch(() => undefined)
        )
    );
  }

  snapshot(): ClassroomProps[] {
    return Array.from(this.#cache.values()).map(classroom =>
      classroom.toObject()
    );
  }

  async #request<T>(
    path: string,
    init: RequestInit = {},
    options: { parseBody?: boolean } = {}
  ): Promise<T> {
    const url = this.#buildUrl(path);
    const headers = new Headers(init.headers);
    if (!headers.has("Accept")) {
      headers.set("Accept", "application/json");
    }
    if (init.body && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }
    const config: RequestInit = {
      ...init,
      headers
    };

    try {
      const response = await fetch(url, config);
      const raw = await response.text();
      if (!response.ok) {
        throw new Error(buildErrorMessage(response, raw));
      }

      if (options.parseBody === false || raw.length === 0) {
        return undefined as T;
      }

      return JSON.parse(raw) as T;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Falha ao chamar ${url}: ${error.message}`);
      }
      throw new Error(`Falha ao chamar ${url}: erro desconhecido`);
    }
  }

  #upsert(data: ClassroomProps): Classroom {
    const classroom = Classroom.from(data);
    this.#cache.set(classroom.id, classroom);
    return classroom;
  }

  #buildUrl(path: string): string {
    if (path.startsWith("http://") || path.startsWith("https://")) {
      return path;
    }
    const normalized = path.startsWith("/") ? path : `/${path}`;
    return `${this.#baseUrl}${normalized}`;
  }
}

function resolveBaseUrl(
  candidate: string | undefined,
  fallback: string
): string {
  const trimmed = candidate?.trim();
  return (trimmed && trimmed.length > 0 ? trimmed : fallback).replace(
    /\/+$/,
    ""
  );
}

function normalizeClassroom(data: ClassroomProps): ClassroomProps {
  return {
    ...data,
    studentIds: Array.isArray(data.studentIds) ? data.studentIds : []
  };
}

function buildErrorMessage(response: Response, body: string): string {
  if (body) {
    try {
      const parsed = JSON.parse(body) as { message?: string };
      if (parsed?.message) {
        return parsed.message;
      }
    } catch {
      return body;
    }
  }
  return `HTTP ${response.status} ${response.statusText}`;
}
