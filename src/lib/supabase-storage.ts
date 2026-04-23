import { supabase } from './supabase';
import { Campagne, Parametres, PARAMETRES_DEFAUT } from '@/types';

// Helper pour vérifier que supabase est disponible
function getSupabase() {
  if (!supabase) {
    throw new Error('Supabase non configuré');
  }
  return supabase;
}

// Conversion des noms de champs (camelCase <-> snake_case)
// Les chaînes vides sont converties en null pour les champs optionnels
function toSnakeCase(campagne: Campagne): Record<string, unknown> {
  return {
    id: campagne.id,
    nom_jeu: campagne.nomJeu,
    editeur: campagne.editeur,
    plateforme: campagne.plateforme,
    niveau_pledge: campagne.niveauPledge || '',
    prix_pledge: campagne.prixPledge,
    frais_port: campagne.fraisPort,
    frais_port_payes: campagne.fraisPortPayes,
    devise: campagne.devise,
    statut: campagne.statut,
    langue: campagne.langue || null,
    propriete: campagne.propriete || 'Perso',
    financement_total: campagne.financementTotal || null,
    nombre_figurines: campagne.nombreFigurines || null,
    mois_livraison: campagne.moisLivraison || null,
    annee_livraison: campagne.anneeLivraison || null,
    date_fin_campagne: campagne.dateFinCampagne || null,
    image_url: campagne.imageUrl || null,
    url_campagne: campagne.urlCampagne || null,
    url_bgg: campagne.urlBGG || null,
    id_engagement: campagne.idEngagement || null,
    notes: campagne.notes || null,
    date_ajout: campagne.dateAjout,
    deja_joue: campagne.dejaJoue || false,
    jdr: campagne.jdr || false,
    print3d: campagne.print3d || false,
    prix_revente: campagne.prixRevente || null,
  };
}

function toCamelCase(row: Record<string, unknown>): Campagne {
  return {
    id: row.id as string,
    nomJeu: row.nom_jeu as string,
    editeur: row.editeur as string,
    plateforme: row.plateforme as string,
    niveauPledge: row.niveau_pledge as string,
    prixPledge: Number(row.prix_pledge) || 0,
    fraisPort: Number(row.frais_port) || 0,
    fraisPortPayes: row.frais_port_payes as boolean,
    devise: row.devise as string,
    statut: row.statut as string,
    langue: row.langue as string,
    propriete: row.propriete as string,
    financementTotal: row.financement_total ? Number(row.financement_total) : undefined,
    nombreFigurines: row.nombre_figurines ? Number(row.nombre_figurines) : undefined,
    moisLivraison: row.mois_livraison as number,
    anneeLivraison: row.annee_livraison as number,
    dateFinCampagne: row.date_fin_campagne as string,
    imageUrl: row.image_url as string,
    urlCampagne: row.url_campagne as string,
    urlBGG: row.url_bgg as string,
    idEngagement: row.id_engagement as string,
    notes: row.notes as string,
    dateAjout: row.date_ajout as string,
    dejaJoue: row.deja_joue as boolean,
    jdr: row.jdr as boolean,
    print3d: row.print3d as boolean,
    prixRevente: row.prix_revente ? Number(row.prix_revente) : undefined,
    paiements: [],
    addons: [],
  };
}

// Campagnes
export async function getCampagnesSupabase(): Promise<Campagne[]> {
  const sb = getSupabase();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return [];

  const { data: campagnesData, error } = await sb
    .from('campagnes')
    .select('*')
    .eq('user_id', user.id)
    .order('date_ajout', { ascending: false });

  if (error) {
    console.error('Erreur lors de la récupération des campagnes:', error);
    return [];
  }

  // Récupérer les paiements et addons pour chaque campagne
  const campagneIds = campagnesData.map(c => c.id);

  const [{ data: paiementsData }, { data: addonsData }] = await Promise.all([
    sb.from('paiements').select('*').in('campagne_id', campagneIds),
    sb.from('addons').select('*').in('campagne_id', campagneIds),
  ]);

  return campagnesData.map(row => {
    const campagne = toCamelCase(row);
    campagne.paiements = (paiementsData || [])
      .filter(p => p.campagne_id === row.id)
      .map(p => ({
        id: p.id,
        date: p.date,
        montant: Number(p.montant),
        type: p.type,
        notes: p.notes,
      }));
    campagne.addons = (addonsData || [])
      .filter(a => a.campagne_id === row.id)
      .map(a => ({
        id: a.id,
        nom: a.nom,
        prix: Number(a.prix),
        quantite: a.quantite,
        langue: a.langue,
      }));
    return campagne;
  });
}

export async function addCampagneSupabase(campagne: Campagne): Promise<boolean> {
  const sb = getSupabase();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) {
    console.error('addCampagneSupabase: utilisateur non connecté');
    throw new Error('Utilisateur non connecté');
  }

  const campagneData = {
    ...toSnakeCase(campagne),
    user_id: user.id,
  };

  console.log('Ajout campagne:', campagneData);

  const { data, error } = await sb
    .from('campagnes')
    .insert(campagneData)
    .select()
    .single();

  if (error) {
    console.error('Erreur Supabase:', error.message, error.details, error.hint, error.code);
    throw new Error(`Erreur Supabase: ${error.message}`);
  }

  console.log('Campagne ajoutée:', data);

  // Ajouter les paiements
  if (campagne.paiements.length > 0) {
    const paiements = campagne.paiements.map(p => ({
      id: p.id,
      campagne_id: data.id,
      user_id: user.id,
      date: p.date,
      montant: p.montant,
      type: p.type,
      notes: p.notes,
    }));
    await sb.from('paiements').insert(paiements);
  }

  // Ajouter les addons
  if (campagne.addons.length > 0) {
    const addons = campagne.addons.map(a => ({
      id: a.id,
      campagne_id: data.id,
      user_id: user.id,
      nom: a.nom,
      prix: a.prix,
      quantite: a.quantite,
      langue: a.langue,
    }));
    await sb.from('addons').insert(addons);
  }

  return true;
}

export async function updateCampagneSupabase(campagne: Campagne): Promise<boolean> {
  const sb = getSupabase();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) {
    throw new Error('Utilisateur non connecté');
  }

  const campagneData = toSnakeCase(campagne);

  const { error } = await sb
    .from('campagnes')
    .update(campagneData)
    .eq('id', campagne.id)
    .eq('user_id', user.id);

  if (error) {
    console.error('Erreur Supabase update:', error.message, error.details, error.hint, error.code);
    throw new Error(`Erreur Supabase: ${error.message}`);
  }

  // Supprimer et recréer les paiements
  await sb.from('paiements').delete().eq('campagne_id', campagne.id);
  if (campagne.paiements.length > 0) {
    const paiements = campagne.paiements.map(p => ({
      id: p.id,
      campagne_id: campagne.id,
      user_id: user.id,
      date: p.date,
      montant: p.montant,
      type: p.type,
      notes: p.notes,
    }));
    await sb.from('paiements').insert(paiements);
  }

  // Supprimer et recréer les addons
  await sb.from('addons').delete().eq('campagne_id', campagne.id);
  if (campagne.addons.length > 0) {
    const addons = campagne.addons.map(a => ({
      id: a.id,
      campagne_id: campagne.id,
      user_id: user.id,
      nom: a.nom,
      prix: a.prix,
      quantite: a.quantite,
      langue: a.langue,
    }));
    await sb.from('addons').insert(addons);
  }

  return true;
}

export async function deleteCampagneSupabase(id: string): Promise<boolean> {
  const sb = getSupabase();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return false;

  const { error } = await sb
    .from('campagnes')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    console.error('Erreur lors de la suppression de la campagne:', error);
    return false;
  }

  return true;
}

// Paramètres
export async function getParametresSupabase(): Promise<Parametres> {
  const sb = getSupabase();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return PARAMETRES_DEFAUT;

  const { data, error } = await sb
    .from('parametres_utilisateur')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (error || !data) {
    return PARAMETRES_DEFAUT;
  }

  return {
    plateformes: data.plateformes || PARAMETRES_DEFAUT.plateformes,
    statuts: data.statuts || PARAMETRES_DEFAUT.statuts,
    devises: data.devises || PARAMETRES_DEFAUT.devises,
    typesPaiement: data.types_paiement || PARAMETRES_DEFAUT.typesPaiement,
    langues: data.langues || PARAMETRES_DEFAUT.langues,
    proprietes: data.proprietes || PARAMETRES_DEFAUT.proprietes,
  };
}

export async function saveParametresSupabase(parametres: Parametres): Promise<boolean> {
  const sb = getSupabase();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return false;

  const { error } = await sb
    .from('parametres_utilisateur')
    .upsert({
      user_id: user.id,
      plateformes: parametres.plateformes,
      statuts: parametres.statuts,
      devises: parametres.devises,
      types_paiement: parametres.typesPaiement,
      langues: parametres.langues,
      proprietes: parametres.proprietes,
    }, { onConflict: 'user_id' });

  if (error) {
    console.error('Erreur lors de la sauvegarde des paramètres:', error);
    return false;
  }

  return true;
}

// Migration des données locales vers Supabase
export async function migrateLocalDataToSupabase(
  campagnes: Campagne[],
  parametres: Parametres
): Promise<{ success: boolean; count: number; errors: string[] }> {
  const sb = getSupabase();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) {
    return { success: false, count: 0, errors: ['Utilisateur non connecté'] };
  }

  const errors: string[] = [];
  let successCount = 0;

  // Sauvegarder les paramètres
  await saveParametresSupabase(parametres);

  // Migrer chaque campagne
  for (const campagne of campagnes) {
    try {
      const success = await addCampagneSupabase(campagne);
      if (success) {
        successCount++;
      } else {
        errors.push(`Erreur pour "${campagne.nomJeu}"`);
      }
    } catch (e) {
      errors.push(`Erreur pour "${campagne.nomJeu}": ${e}`);
    }
  }

  return {
    success: errors.length === 0,
    count: successCount,
    errors,
  };
}
