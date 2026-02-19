import { supabase, isSupabaseConfigured } from './supabase';

const STORAGE_KEY = 'kicktraquer_last_keepalive_ping';
const PING_INTERVAL_DAYS = 5; // Ping si le dernier date de plus de 5 jours
const PING_INTERVAL_MS = PING_INTERVAL_DAYS * 24 * 60 * 60 * 1000;
const RECHECK_INTERVAL_MS = 24 * 60 * 60 * 1000; // Re-vérifier toutes les 24h si l'app reste ouverte

/**
 * Vérifie si un ping keep-alive est nécessaire et l'exécute si besoin.
 * Cela empêche Supabase de mettre le projet en pause après 7 jours d'inactivité.
 *
 * @returns true si un ping a été effectué, false sinon
 */
export async function performKeepAliveIfNeeded(): Promise<boolean> {
  // Ne rien faire si Supabase n'est pas configuré
  if (!isSupabaseConfigured() || !supabase) {
    return false;
  }

  try {
    const lastPingStr = localStorage.getItem(STORAGE_KEY);
    const lastPing = lastPingStr ? parseInt(lastPingStr, 10) : 0;
    const now = Date.now();

    // Si le dernier ping date de moins de 5 jours, pas besoin de ping
    if (now - lastPing < PING_INTERVAL_MS) {
      return false;
    }

    // Effectuer un ping léger (COUNT sur la table campagnes)
    const { error } = await supabase
      .from('campagnes')
      .select('id', { count: 'exact', head: true });

    if (error) {
      console.warn('Keep-alive ping failed:', error.message);
      return false;
    }

    // Enregistrer le timestamp du ping
    localStorage.setItem(STORAGE_KEY, now.toString());
    console.log('Keep-alive ping successful');
    return true;
  } catch (error) {
    // Erreurs silencieuses - on ne veut pas perturber l'utilisateur
    console.warn('Keep-alive error:', error);
    return false;
  }
}

/**
 * Démarre un intervalle pour re-vérifier le keep-alive toutes les 24h.
 * Utile si l'app reste ouverte dans un onglet.
 *
 * @returns Une fonction pour arrêter l'intervalle
 */
export function startKeepAliveInterval(): () => void {
  const intervalId = setInterval(() => {
    performKeepAliveIfNeeded();
  }, RECHECK_INTERVAL_MS);

  return () => clearInterval(intervalId);
}
