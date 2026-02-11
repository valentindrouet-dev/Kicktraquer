-- Schema Kicktraquer pour Supabase
-- Exécutez ce script dans l'éditeur SQL de Supabase

-- Table des campagnes
CREATE TABLE campagnes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  nom_jeu TEXT NOT NULL,
  editeur TEXT NOT NULL,
  plateforme TEXT NOT NULL,
  niveau_pledge TEXT NOT NULL,
  prix_pledge DECIMAL(10,2) NOT NULL DEFAULT 0,
  frais_port DECIMAL(10,2) NOT NULL DEFAULT 0,
  frais_port_payes BOOLEAN DEFAULT FALSE,
  devise TEXT NOT NULL DEFAULT 'EUR',
  statut TEXT NOT NULL DEFAULT 'En cours',
  langue TEXT,
  propriete TEXT DEFAULT 'Perso',
  financement_total DECIMAL(12,2),
  nombre_figurines INTEGER,
  mois_livraison INTEGER,
  annee_livraison INTEGER,
  date_fin_campagne DATE,
  image_url TEXT,
  url_campagne TEXT,
  url_bgg TEXT,
  id_engagement TEXT,
  notes TEXT,
  date_ajout TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des paiements
CREATE TABLE paiements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campagne_id UUID REFERENCES campagnes(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  montant DECIMAL(10,2) NOT NULL,
  type TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des addons
CREATE TABLE addons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campagne_id UUID REFERENCES campagnes(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  nom TEXT NOT NULL,
  prix DECIMAL(10,2) NOT NULL,
  quantite INTEGER NOT NULL DEFAULT 1,
  langue TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des paramètres utilisateur
CREATE TABLE parametres_utilisateur (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  plateformes TEXT[] DEFAULT ARRAY['Kickstarter', 'Gamefound', 'BackerKit', 'Indiegogo', 'Ulule', 'KissKissBankBank', 'Autre'],
  statuts TEXT[] DEFAULT ARRAY['En cours', 'Financé', 'En production', 'Expédié', 'Livré', 'Annulé', 'Remboursé'],
  devises TEXT[] DEFAULT ARRAY['EUR', 'USD', 'GBP', 'CAD', 'AUD'],
  types_paiement TEXT[] DEFAULT ARRAY['Pledge initial', 'Late pledge', 'Add-on', 'Frais de port', 'Taxe/Douane', 'Remboursement'],
  langues TEXT[] DEFAULT ARRAY['', 'Français', 'Anglais'],
  proprietes TEXT[] DEFAULT ARRAY['Perso', 'BGG'],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour les performances
CREATE INDEX idx_campagnes_user_id ON campagnes(user_id);
CREATE INDEX idx_paiements_campagne_id ON paiements(campagne_id);
CREATE INDEX idx_addons_campagne_id ON addons(campagne_id);

-- Row Level Security (RLS) - Sécurité par utilisateur
ALTER TABLE campagnes ENABLE ROW LEVEL SECURITY;
ALTER TABLE paiements ENABLE ROW LEVEL SECURITY;
ALTER TABLE addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE parametres_utilisateur ENABLE ROW LEVEL SECURITY;

-- Policies pour campagnes
CREATE POLICY "Users can view their own campagnes"
  ON campagnes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own campagnes"
  ON campagnes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own campagnes"
  ON campagnes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own campagnes"
  ON campagnes FOR DELETE
  USING (auth.uid() = user_id);

-- Policies pour paiements
CREATE POLICY "Users can view their own paiements"
  ON paiements FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own paiements"
  ON paiements FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own paiements"
  ON paiements FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own paiements"
  ON paiements FOR DELETE
  USING (auth.uid() = user_id);

-- Policies pour addons
CREATE POLICY "Users can view their own addons"
  ON addons FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own addons"
  ON addons FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own addons"
  ON addons FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own addons"
  ON addons FOR DELETE
  USING (auth.uid() = user_id);

-- Policies pour parametres_utilisateur
CREATE POLICY "Users can view their own parametres"
  ON parametres_utilisateur FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own parametres"
  ON parametres_utilisateur FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own parametres"
  ON parametres_utilisateur FOR UPDATE
  USING (auth.uid() = user_id);

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers pour updated_at
CREATE TRIGGER update_campagnes_updated_at
  BEFORE UPDATE ON campagnes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_parametres_updated_at
  BEFORE UPDATE ON parametres_utilisateur
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
