import { Campagne, Parametres, JeuAVenir, PARAMETRES_DEFAUT } from '@/types';
import {
  getAppData,
  saveAppData,
  getJeuxAVenir,
  saveJeuxAVenir,
} from './storage';
import {
  getCampagnesSupabase,
  getParametresSupabase,
  saveParametresSupabase,
  restoreCampagnesSupabase,
} from './supabase-storage';

export const BACKUP_FORMAT = 'kicktraquer-backup';
export const BACKUP_VERSION = 2;

export interface BackupFile {
  format: typeof BACKUP_FORMAT;
  version: number;
  exportDate: string;
  source: 'supabase' | 'local';
  campagnes: Campagne[];
  parametres: Parametres;
  jeuxAVenir: JeuAVenir[];
}

/**
 * Construit une sauvegarde complète depuis la source réellement utilisée.
 * Connecté -> Supabase (campagnes + paiements + addons + paramètres).
 * Non connecté -> localStorage.
 * Les jeux "À venir" sont toujours locaux.
 */
export async function buildBackup(isLoggedIn: boolean): Promise<BackupFile> {
  let campagnes: Campagne[];
  let parametres: Parametres;

  if (isLoggedIn) {
    const [c, p] = await Promise.all([
      getCampagnesSupabase(),
      getParametresSupabase(),
    ]);
    campagnes = c;
    parametres = p;
  } else {
    const local = getAppData();
    campagnes = local.campagnes;
    parametres = local.parametres || PARAMETRES_DEFAUT;
  }

  return {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    exportDate: new Date().toISOString(),
    source: isLoggedIn ? 'supabase' : 'local',
    campagnes,
    parametres,
    jeuxAVenir: getJeuxAVenir(),
  };
}

/** Normalise une campagne pour garantir la présence de tous les champs. */
function normaliserCampagne(c: Partial<Campagne>): Campagne {
  return {
    ...c,
    id: c.id as string,
    nomJeu: c.nomJeu || '',
    editeur: c.editeur || '',
    plateforme: c.plateforme || 'Kickstarter',
    niveauPledge: c.niveauPledge || '',
    prixPledge: Number(c.prixPledge) || 0,
    fraisPort: Number(c.fraisPort) || 0,
    devise: c.devise || 'EUR',
    statut: c.statut || 'En cours',
    dateAjout: c.dateAjout || new Date().toISOString(),
    paiements: c.paiements || [],
    addons: c.addons || [],
  } as Campagne;
}

export interface RestoreResult {
  ok: boolean;
  message: string;
  campagnes: number;
  jeuxAVenir: number;
  errors: string[];
}

/**
 * Restaure une sauvegarde. Fusion par id : rien n'est supprimé.
 * Une entrée présente dans la sauvegarde écrase celle du même id ;
 * les entrées absentes de la sauvegarde sont conservées telles quelles.
 */
export async function restoreBackup(
  jsonString: string,
  isLoggedIn: boolean
): Promise<RestoreResult> {
  let data: Partial<BackupFile>;

  try {
    data = JSON.parse(jsonString);
  } catch {
    return {
      ok: false,
      message: 'Fichier illisible : ce n\'est pas un JSON valide.',
      campagnes: 0,
      jeuxAVenir: 0,
      errors: [],
    };
  }

  if (!data.campagnes || !Array.isArray(data.campagnes)) {
    return {
      ok: false,
      message: 'Fichier invalide : aucune campagne trouvée.',
      campagnes: 0,
      jeuxAVenir: 0,
      errors: [],
    };
  }

  const campagnes = data.campagnes.map(normaliserCampagne).filter(c => c.id);
  const parametres = data.parametres || PARAMETRES_DEFAUT;
  const jeuxAVenir = Array.isArray(data.jeuxAVenir) ? data.jeuxAVenir : [];
  const errors: string[] = [];
  let campagnesRestaurees = 0;

  if (isLoggedIn) {
    const res = await restoreCampagnesSupabase(campagnes);
    campagnesRestaurees = res.count;
    errors.push(...res.errors);
    await saveParametresSupabase(parametres);
  } else {
    // Fusion par id, sans rien supprimer
    const existantes = getAppData().campagnes;
    const parId = new Map(existantes.map(c => [c.id, c]));
    campagnes.forEach(c => parId.set(c.id, c));
    saveAppData({ campagnes: Array.from(parId.values()), parametres });
    campagnesRestaurees = campagnes.length;
  }

  // Jeux à venir : toujours en local, fusion par id
  if (jeuxAVenir.length > 0) {
    const existants = getJeuxAVenir();
    const parId = new Map(existants.map(j => [j.id, j]));
    jeuxAVenir.forEach(j => parId.set(j.id, j));
    saveJeuxAVenir(Array.from(parId.values()));
  }

  return {
    ok: errors.length === 0,
    message:
      errors.length === 0
        ? `Restauration réussie : ${campagnesRestaurees} campagne(s)${jeuxAVenir.length > 0 ? `, ${jeuxAVenir.length} jeu(x) à venir` : ''}.`
        : `Restauration partielle : ${campagnesRestaurees} campagne(s), ${errors.length} erreur(s).`,
    campagnes: campagnesRestaurees,
    jeuxAVenir: jeuxAVenir.length,
    errors,
  };
}
