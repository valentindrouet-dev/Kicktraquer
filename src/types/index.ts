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
}

export interface Campagne {
  id: string;
  nomJeu: string;
  editeur: string;
  plateforme: string;
  niveauPledge: string;
  prixPledge: number;
  fraisPort: number;
  devise: string;
  statut: string;
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
}

export interface Parametres {
  plateformes: string[];
  statuts: string[];
  devises: string[];
  typesPaiement: string[];
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
    'En cours',
    'Financé',
    'En production',
    'Expédié',
    'Livré',
    'Annulé',
    'Remboursé'
  ],
  devises: ['EUR', 'USD', 'GBP', 'CAD', 'AUD'],
  typesPaiement: [
    'Pledge initial',
    'Late pledge',
    'Add-on',
    'Frais de port',
    'Taxe/Douane',
    'Remboursement'
  ]
};
