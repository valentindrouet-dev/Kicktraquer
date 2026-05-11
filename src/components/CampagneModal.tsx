'use client';

import { useState, useEffect } from 'react';
import { X, Plus, Trash2, Calendar } from 'lucide-react';
import { Campagne, Paiement, Addon, Parametres, PARAMETRES_DEFAUT } from '@/types';
import { v4 as uuidv4 } from 'uuid';

const MOIS = [
  { value: 1, label: 'Janvier' },
  { value: 2, label: 'Février' },
  { value: 3, label: 'Mars' },
  { value: 4, label: 'Avril' },
  { value: 5, label: 'Mai' },
  { value: 6, label: 'Juin' },
  { value: 7, label: 'Juillet' },
  { value: 8, label: 'Août' },
  { value: 9, label: 'Septembre' },
  { value: 10, label: 'Octobre' },
  { value: 11, label: 'Novembre' },
  { value: 12, label: 'Décembre' },
];

interface CampagneModalProps {
  campagne?: Campagne | null;
  parametres: Parametres;
  onSave: (campagne: Campagne) => void;
  onDelete?: (id: string) => void;
  onClose: () => void;
}

const EMPTY_CAMPAGNE: Omit<Campagne, 'id' | 'dateAjout'> = {
  nomJeu: '',
  editeur: '',
  plateforme: 'Kickstarter',
  niveauPledge: '',
  prixPledge: 0,
  fraisPort: 0,
  fraisPortPayes: false,
  devise: 'EUR',
  statut: 'En cours',
  langue: '',
  propriete: 'Perso',
  financementTotal: undefined,
  nombreFigurines: undefined,
  paiements: [],
  addons: [],
  moisLivraison: undefined,
  anneeLivraison: undefined,
  dateFinCampagne: '',
  imageUrl: '',
  urlCampagne: '',
  urlBGG: '',
  idEngagement: '',
  notes: '',
  dejaJoue: false,
  jdr: false,
  print3d: false,
  prixRevente: undefined,
};

export default function CampagneModal({
  campagne,
  parametres,
  onSave,
  onDelete,
  onClose,
}: CampagneModalProps) {
  const [formData, setFormData] = useState<Omit<Campagne, 'id' | 'dateAjout'>>(EMPTY_CAMPAGNE);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showStretchPay, setShowStretchPay] = useState(false);
  const [stretchPayData, setStretchPayData] = useState({
    mensualites: 5,
    montantTotal: 0,
    dateDebut: '',
  });

  useEffect(() => {
    if (campagne) {
      const { id, dateAjout, ...rest } = campagne;
      // Assurer la compatibilité avec les anciens champs
      setFormData({
        ...EMPTY_CAMPAGNE,
        ...rest,
        addons: rest.addons || [],
      });
    } else {
      setFormData({
        ...EMPTY_CAMPAGNE,
        plateforme: parametres.plateformes[0] || 'Kickstarter',
        devise: parametres.devises[0] || 'EUR',
        statut: parametres.statuts[0] || 'En cours',
      });
    }
  }, [campagne, parametres]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newCampagne: Campagne = {
      ...formData,
      id: campagne?.id || uuidv4(),
      dateAjout: campagne?.dateAjout || new Date().toISOString(),
    };
    onSave(newCampagne);
  };

  // Calcul du montant par défaut selon le type de paiement
  const getMontantForType = (type: string): number => {
    const typeLower = type.toLowerCase();
    if (typeLower.includes('pledge') || typeLower.includes('initial')) {
      return Number(formData.prixPledge) || 0;
    }
    if (typeLower.includes('frais') || typeLower.includes('port') || typeLower.includes('shipping')) {
      return Number(formData.fraisPort) || 0;
    }
    if (typeLower.includes('add-on') || typeLower.includes('addon') || typeLower.includes('extra')) {
      return formData.addons.reduce((sum, a) => sum + (Number(a.prix) * Number(a.quantite)), 0);
    }
    return 0;
  };

  const handleAddPaiement = () => {
    const defaultType = parametres.typesPaiement[0] || 'Pledge initial';
    const newPaiement: Paiement = {
      id: uuidv4(),
      date: formData.dateFinCampagne || new Date().toISOString().split('T')[0],
      montant: getMontantForType(defaultType),
      type: defaultType,
    };
    setFormData({
      ...formData,
      paiements: [...formData.paiements, newPaiement],
    });
  };

  const handleUpdatePaiement = (index: number, field: keyof Paiement, value: string | number) => {
    const updatedPaiements = [...formData.paiements];
    updatedPaiements[index] = { ...updatedPaiements[index], [field]: value };
    // Si on change le type, on met à jour le montant avec la valeur par défaut
    if (field === 'type' && typeof value === 'string') {
      updatedPaiements[index].montant = getMontantForType(value);
    }
    setFormData({ ...formData, paiements: updatedPaiements });
  };

  const handleRemovePaiement = (index: number) => {
    setFormData({
      ...formData,
      paiements: formData.paiements.filter((_, i) => i !== index),
    });
  };

  const handleGenerateStretchPay = () => {
    if (stretchPayData.mensualites < 2 || stretchPayData.montantTotal <= 0 || !stretchPayData.dateDebut) {
      return;
    }

    const montantMensuel = stretchPayData.montantTotal / stretchPayData.mensualites;
    const dateDebut = new Date(stretchPayData.dateDebut);
    const nouveauxPaiements: Paiement[] = [];

    for (let i = 0; i < stretchPayData.mensualites; i++) {
      const datePaiement = new Date(dateDebut);
      datePaiement.setMonth(datePaiement.getMonth() + i);

      nouveauxPaiements.push({
        id: uuidv4(),
        date: datePaiement.toISOString().split('T')[0],
        montant: Math.round(montantMensuel * 100) / 100,
        type: 'Stretch Pay',
      });
    }

    setFormData({
      ...formData,
      paiements: [...formData.paiements, ...nouveauxPaiements],
    });
    setShowStretchPay(false);
    setStretchPayData({ mensualites: 5, montantTotal: 0, dateDebut: '' });
  };

  const handleAddAddon = () => {
    const newAddon: Addon = {
      id: uuidv4(),
      nom: '',
      prix: 0,
      quantite: 1,
    };
    setFormData({
      ...formData,
      addons: [...formData.addons, newAddon],
    });
  };

  const handleUpdateAddon = (index: number, field: keyof Addon, value: string | number) => {
    const updatedAddons = [...formData.addons];
    updatedAddons[index] = { ...updatedAddons[index], [field]: value };
    setFormData({ ...formData, addons: updatedAddons });
  };

  const handleRemoveAddon = (index: number) => {
    setFormData({
      ...formData,
      addons: formData.addons.filter((_, i) => i !== index),
    });
  };

  const totalAddons = formData.addons.reduce((sum, a) => sum + (Number(a.prix) * Number(a.quantite)), 0);
  const totalPaye = formData.paiements.reduce((sum, p) => sum + Number(p.montant), 0);
  const totalDu = Number(formData.prixPledge) + Number(formData.fraisPort) + totalAddons;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 overflow-y-auto py-8">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 my-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <h2 className="text-xl font-bold text-slate-800">
            {campagne ? 'Modifier la campagne' : 'Nouvelle campagne'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Informations de base */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Nom du jeu *
              </label>
              <input
                type="text"
                value={formData.nomJeu}
                onChange={(e) => setFormData({ ...formData, nomJeu: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Éditeur *
              </label>
              <input
                type="text"
                value={formData.editeur}
                onChange={(e) => setFormData({ ...formData, editeur: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Plateforme
              </label>
              <select
                value={formData.plateforme}
                onChange={(e) => setFormData({ ...formData, plateforme: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                {parametres.plateformes.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Statut
              </label>
              <select
                value={formData.statut}
                onChange={(e) => setFormData({ ...formData, statut: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                {[...new Set([...parametres.statuts, ...PARAMETRES_DEFAUT.statuts])].map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Langue
              </label>
              <select
                value={formData.langue || ''}
                onChange={(e) => setFormData({ ...formData, langue: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                {(parametres.langues || ['', 'Français', 'Anglais']).map((l) => (
                  <option key={l} value={l}>{l || '-- Non spécifié --'}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Propriété
              </label>
              <select
                value={formData.propriete || 'Perso'}
                onChange={(e) => setFormData({ ...formData, propriete: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                {(parametres.proprietes || ['Perso', 'BGG']).map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Niveau de pledge
            </label>
            <input
              type="text"
              value={formData.niveauPledge}
              onChange={(e) => setFormData({ ...formData, niveauPledge: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Ex: All-in, Core box, Deluxe..."
            />
          </div>

          {/* Prix */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Prix du pledge
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.prixPledge}
                onChange={(e) => setFormData({ ...formData, prixPledge: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Frais de port
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.fraisPort}
                onChange={(e) => setFormData({ ...formData, fraisPort: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
              {/* Checkbox Frais de port payés */}
              <label className="flex items-center gap-2 mt-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.fraisPortPayes || false}
                  onChange={(e) => setFormData({ ...formData, fraisPortPayes: e.target.checked })}
                  className="w-4 h-4 text-primary-600 rounded border-slate-300 focus:ring-primary-500"
                />
                <span className="text-xs text-slate-600">FP payés</span>
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Devise
              </label>
              <select
                value={formData.devise}
                onChange={(e) => setFormData({ ...formData, devise: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                {parametres.devises.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Financement total
              </label>
              <input
                type="number"
                step="1"
                min="0"
                value={formData.financementTotal || ''}
                onChange={(e) => setFormData({ ...formData, financementTotal: e.target.value ? parseFloat(e.target.value) : undefined })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Ex: 500000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Nombre de figurines
              </label>
              <input
                type="number"
                step="1"
                min="0"
                value={formData.nombreFigurines || ''}
                onChange={(e) => setFormData({ ...formData, nombreFigurines: e.target.value ? parseInt(e.target.value) : undefined })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Ex: 50"
              />
            </div>
          </div>

          {/* Addons */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-slate-700">
                Add-ons
              </label>
              <button
                type="button"
                onClick={handleAddAddon}
                className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700"
              >
                <Plus className="w-4 h-4" />
                Ajouter
              </button>
            </div>

            {formData.addons.length > 0 ? (
              <div className="space-y-2">
                {formData.addons.map((addon, index) => (
                  <div
                    key={addon.id}
                    className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg flex-wrap"
                  >
                    <input
                      type="text"
                      value={addon.nom}
                      onChange={(e) => handleUpdateAddon(index, 'nom', e.target.value)}
                      className="flex-1 min-w-[120px] px-2 py-1 border border-slate-300 rounded text-sm"
                      placeholder="Nom de l'add-on"
                    />
                    <select
                      value={addon.langue || ''}
                      onChange={(e) => handleUpdateAddon(index, 'langue', e.target.value)}
                      className="w-24 px-2 py-1 border border-slate-300 rounded text-sm"
                    >
                      {(parametres.langues || ['', 'Français', 'Anglais']).map((l) => (
                        <option key={l} value={l}>{l || 'Langue'}</option>
                      ))}
                    </select>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={addon.prix}
                      onChange={(e) => handleUpdateAddon(index, 'prix', parseFloat(e.target.value) || 0)}
                      className="w-20 px-2 py-1 border border-slate-300 rounded text-sm"
                      placeholder="Prix"
                    />
                    <span className="text-slate-500 text-sm">x</span>
                    <input
                      type="number"
                      min="1"
                      value={addon.quantite}
                      onChange={(e) => handleUpdateAddon(index, 'quantite', parseInt(e.target.value) || 1)}
                      className="w-14 px-2 py-1 border border-slate-300 rounded text-sm"
                    />
                    <span className="text-slate-600 text-sm w-20 text-right">
                      = {(addon.prix * addon.quantite).toFixed(2)}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveAddon(index)}
                      className="p-1 text-red-500 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <div className="text-right text-sm text-slate-600">
                  Total add-ons : <span className="font-medium">{totalAddons.toFixed(2)} {formData.devise}</span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-500 italic">Aucun add-on</p>
            )}
          </div>

          {/* ID Engagement */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              ID de l'engagement
            </label>
            <input
              type="text"
              value={formData.idEngagement || ''}
              onChange={(e) => setFormData({ ...formData, idEngagement: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Ex: #123456"
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Fin de campagne
              </label>
              <input
                type="date"
                value={formData.dateFinCampagne || ''}
                onChange={(e) => setFormData({ ...formData, dateFinCampagne: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Livraison prévue
              </label>
              <div className="flex gap-2">
                <select
                  value={formData.moisLivraison || ''}
                  onChange={(e) => setFormData({ ...formData, moisLivraison: e.target.value ? parseInt(e.target.value) : undefined })}
                  className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">Mois</option>
                  {MOIS.map((m) => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
                <input
                  type="number"
                  min="2020"
                  max="2035"
                  placeholder="Année"
                  value={formData.anneeLivraison || ''}
                  onChange={(e) => setFormData({ ...formData, anneeLivraison: e.target.value ? parseInt(e.target.value) : undefined })}
                  className="w-24 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>
          </div>

          {/* URLs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                URL de la campagne
              </label>
              <input
                type="url"
                value={formData.urlCampagne || ''}
                onChange={(e) => setFormData({ ...formData, urlCampagne: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="https://..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                URL BoardGameGeek
              </label>
              <input
                type="url"
                value={formData.urlBGG || ''}
                onChange={(e) => setFormData({ ...formData, urlBGG: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="https://boardgamegeek.com/..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                URL de l'image
              </label>
              <input
                type="url"
                value={formData.imageUrl || ''}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="https://..."
              />
            </div>
          </div>

          {/* Paiements */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-slate-700">
                Paiements
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowStretchPay(!showStretchPay)}
                  className={`flex items-center gap-1 text-sm ${showStretchPay ? 'text-orange-600' : 'text-orange-500 hover:text-orange-600'}`}
                >
                  <Calendar className="w-4 h-4" />
                  Stretch Pay
                </button>
                <button
                  type="button"
                  onClick={handleAddPaiement}
                  className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700"
                >
                  <Plus className="w-4 h-4" />
                  Ajouter
                </button>
              </div>
            </div>

            {/* Formulaire Stretch Pay */}
            {showStretchPay && (
              <div className="mb-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="text-sm font-medium text-orange-800 mb-2">Paiement fractionné</div>
                <div className="grid grid-cols-3 gap-2 mb-2">
                  <div>
                    <label className="block text-xs text-orange-700 mb-1">Mensualités</label>
                    <input
                      type="number"
                      min="2"
                      max="12"
                      value={stretchPayData.mensualites}
                      onChange={(e) => setStretchPayData({ ...stretchPayData, mensualites: parseInt(e.target.value) || 5 })}
                      className="w-full px-2 py-1 border border-orange-300 rounded text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-orange-700 mb-1">Montant total</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={stretchPayData.montantTotal || ''}
                      onChange={(e) => setStretchPayData({ ...stretchPayData, montantTotal: parseFloat(e.target.value) || 0 })}
                      className="w-full px-2 py-1 border border-orange-300 rounded text-sm"
                      placeholder={`${formData.devise}`}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-orange-700 mb-1">1er paiement</label>
                    <input
                      type="date"
                      value={stretchPayData.dateDebut}
                      onChange={(e) => setStretchPayData({ ...stretchPayData, dateDebut: e.target.value })}
                      className="w-full px-2 py-1 border border-orange-300 rounded text-sm"
                    />
                  </div>
                </div>
                {stretchPayData.montantTotal > 0 && stretchPayData.mensualites >= 2 && (
                  <div className="text-xs text-orange-600 mb-2">
                    → {stretchPayData.mensualites} × {(stretchPayData.montantTotal / stretchPayData.mensualites).toFixed(2)} {formData.devise}
                  </div>
                )}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleGenerateStretchPay}
                    disabled={!stretchPayData.dateDebut || stretchPayData.montantTotal <= 0}
                    className="flex-1 px-3 py-1.5 bg-orange-500 text-white text-sm rounded hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Générer {stretchPayData.mensualites} paiements
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowStretchPay(false)}
                    className="px-3 py-1.5 text-orange-600 text-sm hover:bg-orange-100 rounded"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            )}

            {formData.paiements.length > 0 ? (
              <div className="space-y-2">
                {formData.paiements.map((paiement, index) => (
                  <div
                    key={paiement.id}
                    className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg"
                  >
                    <input
                      type="date"
                      value={paiement.date}
                      onChange={(e) => handleUpdatePaiement(index, 'date', e.target.value)}
                      className="px-2 py-1 border border-slate-300 rounded text-sm"
                    />
                    <input
                      type="number"
                      step="0.01"
                      value={paiement.montant}
                      onChange={(e) => handleUpdatePaiement(index, 'montant', parseFloat(e.target.value) || 0)}
                      className="w-24 px-2 py-1 border border-slate-300 rounded text-sm"
                      placeholder="Montant"
                    />
                    <select
                      value={paiement.type}
                      onChange={(e) => handleUpdatePaiement(index, 'type', e.target.value)}
                      className="flex-1 px-2 py-1 border border-slate-300 rounded text-sm"
                    >
                      {parametres.typesPaiement.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => handleRemovePaiement(index)}
                      className="p-1 text-red-500 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500 italic">Aucun paiement enregistré</p>
            )}

            {/* Résumé */}
            <div className="mt-2 p-2 bg-slate-100 rounded-lg text-sm">
              <div className="flex justify-between">
                <span>Total dû :</span>
                <span className="font-medium">{totalDu.toFixed(2)} {formData.devise}</span>
              </div>
              <div className="flex justify-between">
                <span>Total payé :</span>
                <span className="font-medium text-green-600">{totalPaye.toFixed(2)} {formData.devise}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 mt-1 pt-1">
                <span>Reste à payer :</span>
                <span className={`font-medium ${totalDu - totalPaye > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                  {(totalDu - totalPaye).toFixed(2)} {formData.devise}
                </span>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Notes
            </label>
            <textarea
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              rows={3}
              placeholder="Remarques, détails du pledge..."
            />
          </div>

          {/* Options */}
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.dejaJoue || false}
                onChange={(e) => setFormData({ ...formData, dejaJoue: e.target.checked })}
                className="w-5 h-5 text-green-600 rounded border-slate-300 focus:ring-green-500"
              />
              <span className="text-sm font-medium text-slate-700">Déjà joué</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.jdr || false}
                onChange={(e) => setFormData({ ...formData, jdr: e.target.checked })}
                className="w-5 h-5 text-purple-600 rounded border-slate-300 focus:ring-purple-500"
              />
              <span className="text-sm font-medium text-slate-700">JDR / Livre</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.print3d || false}
                onChange={(e) => setFormData({ ...formData, print3d: e.target.checked })}
                className="w-5 h-5 text-cyan-600 rounded border-slate-300 focus:ring-cyan-500"
              />
              <span className="text-sm font-medium text-slate-700">3D Print</span>
            </label>
          </div>

          {/* Prix de revente — visible uniquement si statut Revendu */}
          {formData.statut === 'Revendu' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Prix de revente <span className="text-slate-400 font-normal">({formData.devise})</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.prixRevente ?? ''}
                onChange={(e) => setFormData({ ...formData, prixRevente: e.target.value ? parseFloat(e.target.value) : undefined })}
                className="w-full px-3 py-2 border border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-orange-50"
                placeholder="Ex: 45.00"
              />
              {formData.prixRevente !== undefined && formData.prixRevente > 0 && (
                <p className="text-xs text-slate-500 mt-1">
                  Coût net : <span className={`font-medium ${totalDu - formData.prixRevente > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                    {(totalDu - formData.prixRevente).toFixed(2)} {formData.devise}
                  </span>
                  {' '}({formData.prixRevente >= totalDu ? '✓ revente bénéficiaire' : `perte de ${(totalDu - formData.prixRevente).toFixed(2)} ${formData.devise}`})
                </p>
              )}
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-slate-200 bg-slate-50 rounded-b-xl">
          <div>
            {campagne && onDelete && (
              <>
                {showDeleteConfirm ? (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-red-600">Confirmer ?</span>
                    <button
                      type="button"
                      onClick={() => onDelete(campagne.id)}
                      className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                    >
                      Oui
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(false)}
                      className="px-3 py-1 bg-slate-200 text-slate-700 text-sm rounded hover:bg-slate-300"
                    >
                      Non
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="flex items-center gap-1 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Supprimer
                  </button>
                )}
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              {campagne ? 'Enregistrer' : 'Créer'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
