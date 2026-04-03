import { AppData, Campagne, Parametres, PARAMETRES_DEFAUT, JeuAVenir } from '@/types';

const STORAGE_KEY = 'kicktraquer-data';

export function getAppData(): AppData {
  if (typeof window === 'undefined') {
    return { campagnes: [], parametres: PARAMETRES_DEFAUT };
  }

  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    return { campagnes: [], parametres: PARAMETRES_DEFAUT };
  }

  try {
    const data = JSON.parse(stored) as AppData;
    // S'assurer que les paramètres existent
    if (!data.parametres) {
      data.parametres = PARAMETRES_DEFAUT;
    }
    return data;
  } catch {
    return { campagnes: [], parametres: PARAMETRES_DEFAUT };
  }
}

export function saveAppData(data: AppData): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function getCampagnes(): Campagne[] {
  return getAppData().campagnes;
}

export function saveCampagnes(campagnes: Campagne[]): void {
  const data = getAppData();
  data.campagnes = campagnes;
  saveAppData(data);
}

export function addCampagne(campagne: Campagne): void {
  const campagnes = getCampagnes();
  campagnes.push(campagne);
  saveCampagnes(campagnes);
}

export function updateCampagne(campagne: Campagne): void {
  const campagnes = getCampagnes();
  const index = campagnes.findIndex(c => c.id === campagne.id);
  if (index !== -1) {
    campagnes[index] = campagne;
    saveCampagnes(campagnes);
  }
}

export function deleteCampagne(id: string): void {
  const campagnes = getCampagnes();
  saveCampagnes(campagnes.filter(c => c.id !== id));
}

export function getParametres(): Parametres {
  return getAppData().parametres;
}

export function saveParametres(parametres: Parametres): void {
  const data = getAppData();
  data.parametres = parametres;
  saveAppData(data);
}

export function exportData(): string {
  return JSON.stringify(getAppData(), null, 2);
}

export function importData(jsonString: string): boolean {
  try {
    const data = JSON.parse(jsonString) as AppData;
    if (!data.campagnes || !Array.isArray(data.campagnes)) {
      return false;
    }
    if (!data.parametres) {
      data.parametres = PARAMETRES_DEFAUT;
    }
    saveAppData(data);
    return true;
  } catch {
    return false;
  }
}

// ========== Jeux À Venir (watchlist) ==========

const AVENIR_STORAGE_KEY = 'kicktraquer-avenir';

export function getJeuxAVenir(): JeuAVenir[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(AVENIR_STORAGE_KEY);
  if (!stored) return [];
  try {
    return JSON.parse(stored) as JeuAVenir[];
  } catch {
    return [];
  }
}

export function saveJeuxAVenir(jeux: JeuAVenir[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(AVENIR_STORAGE_KEY, JSON.stringify(jeux));
}

export function addJeuAVenir(jeu: JeuAVenir): void {
  const jeux = getJeuxAVenir();
  jeux.push(jeu);
  saveJeuxAVenir(jeux);
}

export function updateJeuAVenir(jeu: JeuAVenir): void {
  const jeux = getJeuxAVenir();
  const index = jeux.findIndex(j => j.id === jeu.id);
  if (index !== -1) {
    jeux[index] = jeu;
    saveJeuxAVenir(jeux);
  }
}

export function deleteJeuAVenir(id: string): void {
  const jeux = getJeuxAVenir();
  saveJeuxAVenir(jeux.filter(j => j.id !== id));
}
