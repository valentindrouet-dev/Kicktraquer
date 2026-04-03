export interface Paiement {
  id: string;
  date: string;
  montant: number;
  type: string;
  notes?: string;
}

export interface Addon {
  id: string;
  nom: string;
  prix: number;
  quantite: number;
  langue?: string;  // Langue de l'add-on
}

export interface Campagne {
  id: string;
  nomJeu: string;
  editeur: string;
  plateforme: string;
  niveauPledge: string;
  prixPledge: number;
  fraisPort: number;
  fraisPortPayes?: boolean;  // Frais de port déjà payés ?
  devise: string;
  statut: string;
  langue?: string;           // Langue du pledge de base
  propriete?: string;        // BGG ou Perso
  financementTotal?: number; // Financement total du jeu (objectif atteint)
  nombreFigurines?: number;  // Nombre de figurines dans le jeu
  paiements: Paiement[];
  addons: Addon[];
  moisLivraison?: number;  // 1-12
  anneeLivraison?: number; // ex: 2026
  dateFinCampagne?: string;
  imageUrl?: string;
  urlCampagne?: string;
  urlBGG?: string;         // URL BoardGameGeek
  idEngagement?: string;   // ID de l'engagement/pledge
  notes?: string;
  dateAjout: string;
  dejaJoue?: boolean;      // Le jeu a-t-il déjà été joué ?
}

export interface Parametres {
  plateformes: string[];
  statuts: string[];
  devises: string[];
  typesPaiement: string[];
  langues: string[];
  proprietes: string[];
}

export interface AppData {
  campagnes: Campagne[];
  parametres: Parametres;
}

export const PARAMETRES_DEFAUT: Parametres = {
  plateformes: [
    'Kickstarter',
    'Gamefound',
    'BackerKit',
    'Indiegogo',
    'Ulule',
    'KissKissBankBank',
    'Autre'
  ],
  statuts: [
    'À venir',
    'En cours',
    'Financé',
    'En production',
    'Expédié',
    'Livré',
    'Annulé',
    'Remboursé',
    'Revendu'
  ],
  devises: ['EUR', 'USD', 'GBP', 'CAD', 'AUD'],
  typesPaiement: [
    'Pledge initial',
    'Late pledge',
    'Add-on',
    'Frais de port',
    'Taxe/Douane',
    'Remboursement'
  ],
  langues: ['', 'Français', 'Anglais'],
  proprietes: ['Perso', 'BGG']
};
