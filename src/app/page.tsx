'use client';

import { useState, useEffect, useMemo } from 'react';
import { Search, Filter, ChevronDown, ChevronUp, ZoomIn, ZoomOut, AlertCircle } from 'lucide-react';
import Header from '@/components/Header';
import CampagneCard from '@/components/CampagneCard';
import CampagneModal from '@/components/CampagneModal';
import { Campagne, Parametres, PARAMETRES_DEFAUT } from '@/types';
import { getCampagnes, saveCampagnes, getParametres, addCampagne, updateCampagne, deleteCampagne } from '@/lib/storage';

type SortField = 'nomJeu' | 'editeur' | 'plateforme' | 'prixPledge' | 'dateAjout' | 'livraison';
type SortOrder = 'asc' | 'desc';

export default function HomePage() {
  const [campagnes, setCampagnes] = useState<Campagne[]>([]);
  const [parametres, setParametres] = useState<Parametres>(PARAMETRES_DEFAUT);
  const [isLoading, setIsLoading] = useState(true);

  // UI State
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedPlateforme, setSelectedPlateforme] = useState<string>('');
  const [selectedStatut, setSelectedStatut] = useState<string>('');
  const [cardSize, setCardSize] = useState(2); // 0-4
  const [sortField, setSortField] = useState<SortField>('dateAjout');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [selectedCampagne, setSelectedCampagne] = useState<Campagne | null>(null);

  // Charger les données
  const loadData = () => {
    const c = getCampagnes();
    const p = getParametres();
    setCampagnes(c);
    setParametres(p);
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtrer et trier les campagnes
  const filteredCampagnes = useMemo(() => {
    let result = [...campagnes];

    // Recherche
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          c.nomJeu.toLowerCase().includes(query) ||
          c.editeur.toLowerCase().includes(query) ||
          c.plateforme.toLowerCase().includes(query) ||
          c.niveauPledge.toLowerCase().includes(query)
      );
    }

    // Filtres
    if (selectedPlateforme) {
      result = result.filter((c) => c.plateforme === selectedPlateforme);
    }
    if (selectedStatut) {
      result = result.filter((c) => c.statut === selectedStatut);
    }

    // Tri
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'nomJeu':
        case 'editeur':
        case 'plateforme':
          comparison = a[sortField].localeCompare(b[sortField]);
          break;
        case 'prixPledge':
          comparison = a.prixPledge - b.prixPledge;
          break;
        case 'dateAjout':
          const dateA = a.dateAjout || '';
          const dateB = b.dateAjout || '';
          comparison = dateA.localeCompare(dateB);
          break;
        case 'livraison':
          // Tri par année puis mois
          const livraisonA = (a.anneeLivraison || 9999) * 100 + (a.moisLivraison || 99);
          const livraisonB = (b.anneeLivraison || 9999) * 100 + (b.moisLivraison || 99);
          comparison = livraisonA - livraisonB;
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [campagnes, searchQuery, selectedPlateforme, selectedStatut, sortField, sortOrder]);

  // Handlers
  const handleSave = (campagne: Campagne) => {
    if (selectedCampagne) {
      updateCampagne(campagne);
    } else {
      addCampagne(campagne);
    }
    loadData();
    setShowModal(false);
    setSelectedCampagne(null);
  };

  const handleDelete = (id: string) => {
    deleteCampagne(id);
    loadData();
    setShowModal(false);
    setSelectedCampagne(null);
  };

  const handleCardClick = (campagne: Campagne) => {
    setSelectedCampagne(campagne);
    setShowModal(true);
  };

  const handleAjouter = () => {
    setSelectedCampagne(null);
    setShowModal(true);
  };

  // Plateformes et statuts uniques dans les données
  const plateformesUtilisees = useMemo(() => {
    const set = new Set(campagnes.map((c) => c.plateforme));
    return Array.from(set).sort();
  }, [campagnes]);

  const statutsUtilises = useMemo(() => {
    const set = new Set(campagnes.map((c) => c.statut));
    return Array.from(set).sort();
  }, [campagnes]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header onAjouter={handleAjouter} onDataChange={loadData} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Bannière mode local */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-amber-800">Mode local activé</h3>
              <p className="text-sm text-amber-700 mt-1">
                Les données sont stockées uniquement sur cet appareil. Utilisez les boutons d'export/import pour sauvegarder ou transférer vos données.
              </p>
            </div>
          </div>
        </div>

        {/* Barre de recherche */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher par nom, éditeur, plateforme..."
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>

        {/* Filtres */}
        <div className="bg-white rounded-xl border border-slate-200 mb-4">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-slate-500" />
              <span className="font-medium text-slate-700">Filtres</span>
              {(selectedPlateforme || selectedStatut) && (
                <span className="px-2 py-0.5 bg-primary-100 text-primary-700 rounded-full text-xs">
                  {[selectedPlateforme, selectedStatut].filter(Boolean).length} actif(s)
                </span>
              )}
            </div>
            {showFilters ? (
              <ChevronUp className="w-5 h-5 text-slate-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-slate-400" />
            )}
          </button>

          {showFilters && (
            <div className="p-4 pt-0 border-t border-slate-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Plateforme
                  </label>
                  <select
                    value={selectedPlateforme}
                    onChange={(e) => setSelectedPlateforme(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">Toutes</option>
                    {plateformesUtilisees.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Statut
                  </label>
                  <select
                    value={selectedStatut}
                    onChange={(e) => setSelectedStatut(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">Tous</option>
                    {statutsUtilises.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>
              {(selectedPlateforme || selectedStatut) && (
                <button
                  onClick={() => {
                    setSelectedPlateforme('');
                    setSelectedStatut('');
                  }}
                  className="mt-4 text-sm text-primary-600 hover:text-primary-700"
                >
                  Réinitialiser les filtres
                </button>
              )}
            </div>
          )}
        </div>

        {/* Barre d'outils */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-slate-600">
            {filteredCampagnes.length} campagne{filteredCampagnes.length > 1 ? 's' : ''}
          </p>

          <div className="flex items-center gap-4">
            {/* Contrôle de taille */}
            <div className="flex items-center gap-2 bg-white rounded-lg border border-slate-200 p-1">
              <button
                onClick={() => setCardSize(Math.max(0, cardSize - 1))}
                className="p-1 text-slate-500 hover:text-slate-700 disabled:opacity-50"
                disabled={cardSize === 0}
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <div className="flex gap-1">
                {[0, 1, 2, 3, 4].map((i) => (
                  <button
                    key={i}
                    onClick={() => setCardSize(i)}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      i === cardSize ? 'bg-primary-500' : 'bg-slate-300'
                    }`}
                  />
                ))}
              </div>
              <button
                onClick={() => setCardSize(Math.min(4, cardSize + 1))}
                className="p-1 text-slate-500 hover:text-slate-700 disabled:opacity-50"
                disabled={cardSize === 4}
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>

            {/* Tri */}
            <div className="flex items-center gap-2">
              <select
                value={sortField}
                onChange={(e) => setSortField(e.target.value as SortField)}
                className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="nomJeu">Nom</option>
                <option value="editeur">Éditeur</option>
                <option value="plateforme">Plateforme</option>
                <option value="prixPledge">Prix</option>
                <option value="dateAjout">Date d'ajout</option>
                <option value="livraison">Livraison</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="p-1.5 border border-slate-300 rounded-lg hover:bg-slate-50"
              >
                {sortOrder === 'asc' ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Grille de campagnes */}
        {filteredCampagnes.length > 0 ? (
          <div className="flex flex-wrap gap-4">
            {filteredCampagnes.map((campagne) => (
              <CampagneCard
                key={campagne.id}
                campagne={campagne}
                size={cardSize}
                onClick={() => handleCardClick(campagne)}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <div className="text-6xl mb-4">🚀</div>
            <h3 className="text-lg font-medium text-slate-800 mb-2">
              {searchQuery || selectedPlateforme || selectedStatut
                ? 'Aucune campagne trouvée'
                : 'Aucune campagne'}
            </h3>
            <p className="text-slate-500 mb-4">
              {searchQuery || selectedPlateforme || selectedStatut
                ? 'Essayez de modifier vos filtres de recherche.'
                : 'Commencez par ajouter votre première campagne de financement participatif.'}
            </p>
            {!searchQuery && !selectedPlateforme && !selectedStatut && (
              <button
                onClick={handleAjouter}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                Ajouter une campagne
              </button>
            )}
          </div>
        )}
      </main>

      {/* Modal */}
      {showModal && (
        <CampagneModal
          campagne={selectedCampagne}
          parametres={parametres}
          onSave={handleSave}
          onDelete={handleDelete}
          onClose={() => {
            setShowModal(false);
            setSelectedCampagne(null);
          }}
        />
      )}
    </div>
  );
}
