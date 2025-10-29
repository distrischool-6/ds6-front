import {
  Student,
  StudentEditableFields,
  StudentProps
} from "../models/Student";

export type StudentSearchQuery = {
  name?: string;
  registration?: string;
};

type StudentControllerOptions = {
  baseUrl?: string;
};

const STUDENT_SERVICE_FALLBACK_URL = "http://localhost:8080";

const DEFAULT_STUDENT_SERVICE_BASE_URL = resolveBaseUrl(
  import.meta.env?.VITE_STUDENT_SERVICE_URL as string | undefined,
  STUDENT_SERVICE_FALLBACK_URL
);

export class StudentController {
  #baseUrl: string;
  #cache = new Map<string, Student>();

  constructor(options: StudentControllerOptions = {}) {
    this.#baseUrl = resolveBaseUrl(
      options.baseUrl,
      DEFAULT_STUDENT_SERVICE_BASE_URL
    );
  }

  async list(): Promise<StudentProps[]> {
    const data = await this.#request<StudentProps[]>("/students/all");
    this.#cache.clear();
    if (Array.isArray(data)) {
      data.forEach(item => {
        const student = Student.from(item);
        this.#cache.set(student.id, student);
      });
    }
    return this.snapshot();
  }

  async findById(id: string): Promise<StudentProps | undefined> {
    const cached = this.#cache.get(id);
    if (cached) {
      return cached.toObject();
    }
    const data = await this.#request<StudentProps>(
      `/students/${encodeURIComponent(id)}`
    );
    if (!data) return undefined;
    const student = Student.from(data);
    this.#cache.set(student.id, student);
    return student.toObject();
  }

  async create(data: StudentEditableFields): Promise<StudentProps> {
    const result = await this.#request<StudentProps>("/students/create", {
      method: "POST",
      body: JSON.stringify(data)
    });
    const student = Student.from(result);
    this.#cache.set(student.id, student);
    return student.toObject();
  }

  async update(
    id: string,
    data: Partial<StudentEditableFields>
  ): Promise<StudentProps> {
    const result = await this.#request<StudentProps>(
      `/students/update/${encodeURIComponent(id)}`,
      {
        method: "POST",
        body: JSON.stringify(data)
      }
    );
    const student = Student.from(result);
    this.#cache.set(student.id, student);
    return student.toObject();
  }

  async delete(id: string): Promise<boolean> {
    await this.#request<void>(
      `/students/${encodeURIComponent(id)}`,
      { method: "DELETE" },
      { parseBody: false }
    );
    return this.#cache.delete(id);
  }

  async search(query: StudentSearchQuery): Promise<StudentProps[]> {
    const params = new URLSearchParams();
    if (query.name) params.set("name", query.name);
    if (query.registration) params.set("registration", query.registration);
    const result = await this.#request<StudentProps[]>(
      `/students/search${params.toString() ? `?${params.toString()}` : ""}`
    );
    this.#cache.clear();
    if (Array.isArray(result)) {
      result.forEach(item => {
        const student = Student.from(item);
        this.#cache.set(student.id, student);
      });
    }
    return this.snapshot();
  }

  async bulkImport(): Promise<void> {
    throw new Error("Bulk import não é suportado pela API externa.");
  }

  snapshot(): StudentProps[] {
    return Array.from(this.#cache.values()).map(student => student.toObject());
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
