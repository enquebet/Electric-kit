export interface UserPreferences {
  theme: 'dark' | 'light';
  eSeriesDefault: 'E12' | 'E24' | 'E96';
  favorites: string[];
  recentToolIds: string[];
}

const DEFAULT_PREFERENCES: UserPreferences = {
  theme: 'dark',
  eSeriesDefault: 'E24',
  favorites: ['ohms-law', 'voltage-divider', 'resistor-color-code', 'led-resistor'],
  recentToolIds: [],
};

const STORAGE_KEY = 'electrokit_user_prefs';

export function loadUserPreferences(): UserPreferences {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PREFERENCES;
    return { ...DEFAULT_PREFERENCES, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export function saveUserPreferences(prefs: UserPreferences): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // Ignore storage quota or disabled localStorage
  }
}

export function toggleFavoriteTool(toolId: string): boolean {
  const prefs = loadUserPreferences();
  const index = prefs.favorites.indexOf(toolId);
  let isFavorite = false;
  if (index >= 0) {
    prefs.favorites.splice(index, 1);
    isFavorite = false;
  } else {
    prefs.favorites.push(toolId);
    isFavorite = true;
  }
  saveUserPreferences(prefs);
  return isFavorite;
}

export function recordToolVisit(toolId: string): void {
  const prefs = loadUserPreferences();
  prefs.recentToolIds = [toolId, ...prefs.recentToolIds.filter(id => id !== toolId)].slice(0, 10);
  saveUserPreferences(prefs);
}

export const loadPreferences = (): { favoriteToolIds: string[]; recentToolIds: string[]; theme: 'dark' | 'light'; eSeriesDefault: 'E12' | 'E24' | 'E96' } => {
  const p = loadUserPreferences();
  return {
    favoriteToolIds: p.favorites,
    recentToolIds: p.recentToolIds,
    theme: p.theme,
    eSeriesDefault: p.eSeriesDefault,
  };
};

export const savePreferences = (update: { favoriteToolIds?: string[]; recentToolIds?: string[]; theme?: 'dark' | 'light'; eSeriesDefault?: 'E12' | 'E24' | 'E96' }): void => {
  const current = loadUserPreferences();
  const next: UserPreferences = {
    ...current,
    ...(update.favoriteToolIds ? { favorites: update.favoriteToolIds } : {}),
    ...(update.recentToolIds ? { recentToolIds: update.recentToolIds } : {}),
    ...(update.theme ? { theme: update.theme } : {}),
    ...(update.eSeriesDefault ? { eSeriesDefault: update.eSeriesDefault } : {}),
  };
  saveUserPreferences(next);
};

export interface CalculationProject {
  id: string;
  name: string;
  toolId: string;
  category: string;
  createdAt: number;
  updatedAt: number;
  data: Record<string, any>;
  notes?: string;
}

const PROJECTS_STORAGE_KEY = 'electrokit_saved_projects';

export function loadSavedProjects(): CalculationProject[] {
  try {
    const raw = localStorage.getItem(PROJECTS_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveCalculationProject(project: Omit<CalculationProject, 'createdAt' | 'updatedAt'> & { createdAt?: number }): CalculationProject {
  const existing = loadSavedProjects();
  const now = Date.now();
  const existingIndex = existing.findIndex(p => p.id === project.id);

  const fullProject: CalculationProject = {
    ...project,
    createdAt: project.createdAt || (existingIndex >= 0 ? existing[existingIndex].createdAt : now),
    updatedAt: now,
  };

  let updatedList: CalculationProject[];
  if (existingIndex >= 0) {
    updatedList = [...existing];
    updatedList[existingIndex] = fullProject;
  } else {
    updatedList = [fullProject, ...existing];
  }

  try {
    localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(updatedList));
  } catch {
    // Local storage full or private browsing exception
  }

  return fullProject;
}

export function deleteCalculationProject(id: string): void {
  const existing = loadSavedProjects();
  const updatedList = existing.filter(p => p.id !== id);
  try {
    localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(updatedList));
  } catch {
    // Ignore
  }
}

export function getCalculationProject(id: string): CalculationProject | undefined {
  const existing = loadSavedProjects();
  return existing.find(p => p.id === id);
}


