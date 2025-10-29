import { Title } from "@solidjs/meta";
import {
  For,
  Show,
  createMemo,
  createSignal,
  onMount
} from "solid-js";
import {
    classroomController,
    studentController,
    type ClassroomEditableFields,
    type ClassroomProps,
    type StudentEditableFields,
    type StudentProps,
    type StudentSearchQuery
} from "~/controllers";

function sanitizeQueryValue(value: string | null): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export default function Home() {
  const [students, setStudents] = createSignal<StudentProps[]>([]);
  const [classes, setClasses] = createSignal<ClassroomProps[]>([]);
  const [searchQuery, setSearchQuery] = createSignal<StudentSearchQuery>({});
  const [studentFormError, setStudentFormError] = createSignal("");
  const [classFormError, setClassFormError] = createSignal("");
  const [selectedClassId, setSelectedClassId] = createSignal<string>();

  let searchFormRef: HTMLFormElement | undefined;

  const studentsById = createMemo(() => {
    const map = new Map<string, StudentProps>();
    for (const student of students()) {
      map.set(student.id, student);
    }
    return map;
  });

  const selectedClass = createMemo(() =>
    classes().find(classroom => classroom.id === selectedClassId())
  );

  const selectedClassStudents = createMemo(() => {
    const classroom = selectedClass();
    if (!classroom) return [];
    const collection = studentsById();
    return classroom.studentIds
      .map(id => collection.get(id))
      .filter(Boolean) as StudentProps[];
  });

  const availableStudentsForClass = createMemo(() => {
    const classroom = selectedClass();
    if (!classroom) return students();
    const presentIds = new Set(classroom.studentIds);
    return students().filter(student => !presentIds.has(student.id));
  });

  async function loadStudents(query?: StudentSearchQuery) {
    const result =
      query && (query.name || query.registration)
        ? await studentController.search(query)
        : await studentController.list();
    setStudents(result);
    return result;
  }

  async function loadClasses() {
    const result = await classroomController.list();
    setClasses(result);
    return result;
  }

  async function refreshClasses(preserveSelection = true) {
    const result = await loadClasses();
    if (!preserveSelection || !selectedClassId()) {
      setSelectedClassId(result[0]?.id);
      return;
    }

    const stillExists = result.some(
      classroom => classroom.id === selectedClassId()
    );
    if (!stillExists) {
      setSelectedClassId(result[0]?.id);
    }
  }

  onMount(async () => {
    await loadStudents();
    const classList = await loadClasses();
    setSelectedClassId(classList[0]?.id);
  });

  async function handleSearch(event: SubmitEvent) {
    event.preventDefault();
    const form = event.currentTarget as HTMLFormElement;
    const data = new FormData(form);
    const query: StudentSearchQuery = {
      name: sanitizeQueryValue(data.get("name")?.toString() ?? ""),
      registration: sanitizeQueryValue(
        data.get("registration")?.toString() ?? ""
      )
    };
    setSearchQuery(query);
    await loadStudents(query);
  }

  async function handleClearFilters() {
    setSearchQuery({});
    await loadStudents();
    searchFormRef?.reset();
  }

  async function handleCreateStudent(event: SubmitEvent) {
    event.preventDefault();
    const form = event.currentTarget as HTMLFormElement;
    const data = new FormData(form);
    const payload: StudentEditableFields = {
      name: (data.get("name") as string) ?? "",
      birthDate: (data.get("birthDate") as string) ?? "",
      grade: (data.get("grade") as string) ?? "",
      classNumber: (data.get("classNumber") as string) ?? "",
      address: (data.get("address") as string) ?? "",
      phone: (data.get("phone") as string) ?? ""
    };

    const hasEmptyField = Object.values(payload).some(
      value => !value || value.trim().length === 0
    );
    if (hasEmptyField) {
      setStudentFormError("Preencha todos os campos para cadastrar o aluno.");
      return;
    }

    await studentController.create(payload);
    setStudentFormError("");
    form.reset();
    await loadStudents(searchQuery());
    await refreshClasses();
  }

  async function handleDeleteStudent(id: string) {
    await studentController.delete(id);
    await classroomController.removeStudentFromAll(id);
    await loadStudents(searchQuery());
    await refreshClasses();
  }

  async function handleCreateClass(event: SubmitEvent) {
    event.preventDefault();
    const form = event.currentTarget as HTMLFormElement;
    const data = new FormData(form);
    const payload: ClassroomEditableFields = {
      name: (data.get("name") as string) ?? "",
      shift: (data.get("shift") as string) ?? "",
      teacherId: (data.get("teacherId") as string) ?? ""
    };

    const hasEmptyField = Object.values(payload).some(
      value => !value || value.trim().length === 0
    );
    if (hasEmptyField) {
      setClassFormError("Informe nome, turno e professor responsável.");
      return;
    }

    const classroom = await classroomController.create(payload);
    setClassFormError("");
    form.reset();
    const list = await loadClasses();
    setSelectedClassId(classroom.id ?? list[0]?.id);
  }

  async function handleDeleteClass(id: string) {
    await classroomController.delete(id);
    const updated = await loadClasses();
    if (selectedClassId() === id) {
      setSelectedClassId(updated[0]?.id);
    }
  }

  async function handleSelectClass(id: string) {
    setSelectedClassId(id);
  }

  async function handleAddStudentToClass(event: SubmitEvent) {
    event.preventDefault();
    const classId = selectedClassId();
    if (!classId) return;
    const form = event.currentTarget as HTMLFormElement;
    const data = new FormData(form);
    const studentId = sanitizeQueryValue(
      data.get("studentId")?.toString() ?? ""
    );
    if (!studentId) return;

    await classroomController.addStudent(classId, studentId);
    form.reset();
    await refreshClasses();
  }

  async function handleRemoveStudentFromClass(studentId: string) {
    const classId = selectedClassId();
    if (!classId) return;
    await classroomController.removeStudent(classId, studentId);
    await refreshClasses();
  }

  return (
    <main class="container">
      <Title>Gestão Escolar - Mock</Title>
      <header class="page-header">
        <div>
          <h1>Gestão Escolar</h1>
          <p>Protótipo em SolidStart (dados mockados)</p>
        </div>
      </header>

      <section class="grid">
        <section class="card">
          <h2>Alunos</h2>

          <form
            ref={searchFormRef}
            id="student-search-form"
            class="form-inline"
            onSubmit={handleSearch}
          >
            <div class="form-grid">
              <label>
                Nome
                <input name="name" type="text" placeholder="Buscar por nome" />
              </label>
              <label>
                Matrícula
                <input
                  name="registration"
                  type="text"
                  placeholder="Buscar por matrícula"
                />
              </label>
            </div>
            <div class="actions">
              <button type="submit">Filtrar</button>
              <button type="button" onClick={handleClearFilters}>
                Limpar
              </button>
            </div>
          </form>

          <form class="form" onSubmit={handleCreateStudent}>
            <h3>Novo aluno</h3>
            <div class="form-grid">
              <label>
                Nome completo
                <input name="name" type="text" required />
              </label>
              <label>
                Data de nascimento
                <input name="birthDate" type="date" required />
              </label>
              <label>
                Série
                <input name="grade" type="text" required />
              </label>
              <label>
                Turma
                <input name="classNumber" type="text" required />
              </label>
              <label>
                Endereço
                <input name="address" type="text" required />
              </label>
              <label>
                Telefone
                <input name="phone" type="tel" required />
              </label>
            </div>
            <div class="actions">
              <button type="submit">Cadastrar aluno</button>
            </div>
            <Show when={studentFormError()}>
              <p class="error">{studentFormError()}</p>
            </Show>
          </form>

          <div class="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Matrícula</th>
                  <th>Série</th>
                  <th>Turma</th>
                  <th>Telefone</th>
                  <th class="actions-col"></th>
                </tr>
              </thead>
              <tbody>
                <Show
                  when={students().length > 0}
                  fallback={
                    <tr>
                      <td colSpan={6} class="empty">
                        Nenhum aluno encontrado.
                      </td>
                    </tr>
                  }
                >
                  <For each={students()}>
                    {student => (
                      <tr>
                        <td>
                          <strong>{student.name}</strong>
                        </td>
                        <td>{student.registration}</td>
                        <td>{student.grade}</td>
                        <td>{student.classNumber}</td>
                        <td class="phone-cell">{student.phone}</td>
                        <td class="row-actions">
                          <button
                            type="button"
                            class="danger compact icon-only"
                            aria-label={`Remover ${student.name}`}
                            onClick={() => handleDeleteStudent(student.id)}
                          >
                            <span aria-hidden="true">🗑️</span>
                          </button>
                        </td>
                      </tr>
                    )}
                  </For>
                </Show>
              </tbody>
            </table>
          </div>
        </section>

        <section class="card">
          <h2>Turmas</h2>
          <form class="form" onSubmit={handleCreateClass}>
            <h3>Nova turma</h3>
            <div class="form-grid">
              <label>
                Nome
                <input name="name" type="text" required />
              </label>
              <label>
                Turno
                <select name="shift" required>
                  <option value="">Selecione</option>
                  <option value="Manhã">Manhã</option>
                  <option value="Tarde">Tarde</option>
                  <option value="Noite">Noite</option>
                </select>
              </label>
              <label>
                Professor responsável (ID)
                <input name="teacherId" type="text" required />
              </label>
            </div>
            <div class="actions">
              <button type="submit">Criar turma</button>
            </div>
            <Show when={classFormError()}>
              <p class="error">{classFormError()}</p>
            </Show>
          </form>

          <div class="class-list">
            <For each={classes()}>
              {classroom => (
                <button
                  type="button"
                  class={`class-pill ${
                    classroom.id === selectedClassId() ? "active" : ""
                  }`}
                  onClick={() => handleSelectClass(classroom.id)}
                >
                  {classroom.name}
                </button>
              )}
            </For>
          </div>

          <Show when={selectedClass()} fallback={<p>Selecione uma turma.</p>}>
            {currentClass => (
              <div class="class-details">
                <header>
                  <div>
                    <h3>{currentClass().name}</h3>
                    <p>
                      Turno: <strong>{currentClass().shift}</strong>
                    </p>
                    <p>
                      Professor ID:{" "}
                      <code>{currentClass().teacherId}</code>
                    </p>
                  </div>
                  <button
                    type="button"
                    class="danger"
                    onClick={() => handleDeleteClass(currentClass().id)}
                  >
                    Excluir turma
                  </button>
                </header>

                <form class="form-inline" onSubmit={handleAddStudentToClass}>
                  <label>
                    Adicionar aluno
                    <select name="studentId">
                      <option value="">Selecione um aluno</option>
                      <For each={availableStudentsForClass()}>
                        {student => (
                          <option value={student.id}>
                            {student.name} ({student.registration})
                          </option>
                        )}
                      </For>
                    </select>
                  </label>
                  <div class="actions">
                    <button type="submit">Adicionar</button>
                  </div>
                </form>

                <div class="table-wrapper compact">
                  <table>
                    <thead>
                      <tr>
                        <th>Aluno</th>
                        <th>Matrícula</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      <Show
                        when={selectedClassStudents().length > 0}
                        fallback={
                          <tr>
                            <td colSpan={3} class="empty">
                              Ainda não há alunos nesta turma.
                            </td>
                          </tr>
                        }
                      >
                        <For each={selectedClassStudents()}>
                          {student => (
                            <tr>
                              <td>{student.name}</td>
                              <td>{student.registration}</td>
                              <td class="row-actions">
                                <button
                                  type="button"
                                  class="danger compact icon-only"
                                  aria-label={`Remover ${student.name} da turma`}
                                  onClick={() =>
                                    handleRemoveStudentFromClass(student.id)
                                  }
                                >
                                  <span aria-hidden="true">🗑️</span>
                                </button>
                              </td>
                            </tr>
                          )}
                        </For>
                      </Show>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </Show>
        </section>
      </section>
    </main>
  );
}
