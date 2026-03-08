import type { Project, Task } from '@/types';

/** localStorage のキー定数 */
export const LS_KEYS = {
  PROJECTS: 'taskline:projects',
  TASKS: 'taskline:tasks',
  META_VERSION: 'taskline:meta:version',
} as const;

/** localStorage に保存する Project の生 JSON 形式 */
type RawProject = Omit<Project, 'deadline' | 'createdAt' | 'updatedAt'> & {
  deadline: string;
  createdAt: string;
  updatedAt: string;
};

/** localStorage に保存する Task の生 JSON 形式 */
type RawTask = Omit<Task, 'startDate' | 'endDate' | 'createdAt' | 'updatedAt'> & {
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  updatedAt: string;
};

export function serializeProject(project: Project): RawProject {
  return {
    ...project,
    deadline: project.deadline.toISOString(),
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
  };
}

export function deserializeProject(raw: RawProject): Project {
  return {
    ...raw,
    deadline: new Date(raw.deadline),
    createdAt: new Date(raw.createdAt),
    updatedAt: new Date(raw.updatedAt),
  };
}

export function serializeTask(task: Task): RawTask {
  return {
    ...task,
    startDate: task.startDate ? task.startDate.toISOString() : null,
    endDate: task.endDate ? task.endDate.toISOString() : null,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
  };
}

export function deserializeTask(raw: RawTask): Task {
  return {
    ...raw,
    startDate: raw.startDate ? new Date(raw.startDate) : null,
    endDate: raw.endDate ? new Date(raw.endDate) : null,
    createdAt: new Date(raw.createdAt),
    updatedAt: new Date(raw.updatedAt),
  };
}

/** localStorage から Project[] を読み込む */
export function loadProjects(): Project[] {
  try {
    const raw = localStorage.getItem(LS_KEYS.PROJECTS);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as RawProject[];
    return parsed.map(deserializeProject);
  } catch {
    return [];
  }
}

/** Project[] を localStorage に保存する */
export function saveProjects(projects: Project[]): void {
  localStorage.setItem(LS_KEYS.PROJECTS, JSON.stringify(projects.map(serializeProject)));
}

/** localStorage から Task[] を読み込む */
export function loadTasks(): Task[] {
  try {
    const raw = localStorage.getItem(LS_KEYS.TASKS);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as RawTask[];
    return parsed.map(deserializeTask);
  } catch {
    return [];
  }
}

/** Task[] を localStorage に保存する */
export function saveTasks(tasks: Task[]): void {
  localStorage.setItem(LS_KEYS.TASKS, JSON.stringify(tasks.map(serializeTask)));
}
