'use client';

import { useMemo } from 'react';
import { Campagne } from '@/types';
import Image from 'next/image';
import { Package, Truck } from 'lucide-react';

interface CampagneTimelineProps {
  campagnes: Campagne[];
  onCampagneClick: (campagne: Campagne) => void;
  onEdit: (campagne: Campagne) => void;
}

const MOIS = [
  'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin',
  'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'
];

export default function CampagneTimeline({ campagnes, onCampagneClick, onEdit }: CampagneTimelineProps) {
  // Grouper les campagnes par année puis par mois
  const campagnesParAnneeEtMois = useMemo(() => {
    const parAnnee: Record<number, Record<number, Campagne[]>> = {};

    campagnes.forEach((campagne) => {
      if (campagne.anneeLivraison) {
        if (!parAnnee[campagne.anneeLivraison]) {
          parAnnee[campagne.anneeLivraison] = {};
        }
        const mois = campagne.moisLivraison || 1;
        if (!parAnnee[campagne.anneeLivraison][mois]) {
          parAnnee[campagne.anneeLivraison][mois] = [];
        }
        parAnnee[campagne.anneeLivraison][mois].push(campagne);
      }
    });

    return parAnnee;
  }, [campagnes]);

  // Compter le nombre total de campagnes par année
  const countParAnnee = useMemo(() => {
    const counts: Record<number, number> = {};
    Object.entries(campagnesParAnneeEtMois).forEach(([annee, mois]) => {
      counts[Number(annee)] = Object.values(mois).reduce((sum, c) => sum + c.length, 0);
    });
    return counts;
  }, [campagnesParAnneeEtMois]);

  // Obtenir les années triées
  const annees = useMemo(() => {
    return Object.keys(campagnesParAnneeEtMois)
      .map(Number)
      .sort((a, b) => a - b);
  }, [campagnesParAnneeEtMois]);

  // Campagnes sans date de livraison
  const campagnesSansDate = useMemo(() => {
    return campagnes.filter((c) => !c.anneeLivraison);
  }, [campagnes]);

  // Calculer la hauteur maximale nécessaire pour une année
  const getMaxStackHeight = (annee: number) => {
    const moisData = campagnesParAnneeEtMois[annee];
    let maxStack = 0;
    Object.values(moisData).forEach((campagnesduMois) => {
      if (campagnesduMois.length > maxStack) {
        maxStack = campagnesduMois.length;
      }
    });
    return maxStack;
  };

  if (campagnes.length === 0) {
    return null;
  }

  return (
    <div className="space-y-8">
      {annees.map((annee) => {
        const maxStack = getMaxStackHeight(annee);
        const containerHeight = Math.max(80, maxStack * 72 + 16); // 72px par jeu + padding

        return (
          <div key={annee} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            {/* En-tête de l'année */}
            <div className="bg-primary-600 text-white px-6 py-3">
              <h3 className="text-xl font-bold">{annee}</h3>
              <p className="text-primary-100 text-sm">
                {countParAnnee[annee]} jeu{countParAnnee[annee] > 1 ? 'x' : ''} prévu{countParAnnee[annee] > 1 ? 's' : ''}
              </p>
            </div>

            {/* Frise chronologique */}
            <div className="p-4">
              {/* Ligne des mois */}
              <div className="relative">
                <div className="flex justify-between border-b-2 border-slate-200 pb-2 mb-4">
                  {MOIS.map((mois) => (
                    <div
                      key={mois}
                      className="text-xs text-slate-500 font-medium w-[8.33%] text-center"
                    >
                      {mois}
                    </div>
                  ))}
                </div>

                {/* Conteneur des campagnes */}
                <div className="relative" style={{ minHeight: `${containerHeight}px` }}>
                  {/* Lignes verticales pour chaque mois */}
                  <div className="absolute inset-0 flex">
                    {MOIS.map((_, index) => (
                      <div
                        key={index}
                        className="w-[8.33%] border-l border-slate-100 first:border-l-0"
                      />
                    ))}
                  </div>

                  {/* Campagnes groupées par mois et empilées verticalement */}
                  {Object.entries(campagnesParAnneeEtMois[annee]).map(([mois, campagnesDuMois]) => {
                    const moisNum = Number(mois);
                    const leftPercent = ((moisNum - 1) / 12) * 100 + (100 / 24); // Centré dans la colonne

                    return (
                      <div
                        key={mois}
                        className="absolute flex flex-col gap-1"
                        style={{
                          left: `${leftPercent}%`,
                          transform: 'translateX(-50%)',
                          top: '8px'
                        }}
                      >
                        {campagnesDuMois.map((campagne, index) => (
                          <button
                            key={campagne.id}
                            onClick={() => onCampagneClick(campagne)}
                            className="block relative group"
                            title={`${campagne.nomJeu} - ${MOIS[moisNum - 1]} ${annee}`}
                          >
                            <div className="w-14 h-14 rounded-lg overflow-hidden border-2 border-slate-200 hover:border-primary-500 transition-colors bg-slate-100 shadow-sm">
                              {campagne.imageUrl ? (
                                <Image
                                  src={campagne.imageUrl}
                                  alt={campagne.nomJeu}
                                  width={56}
                                  height={56}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Package className="w-5 h-5 text-slate-400" />
                                </div>
                              )}
                            </div>

                            {/* Indicateur frais de port non renseignés */}
                            {(!campagne.fraisPort || campagne.fraisPort === 0) && (
                              <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center" title="Frais de port non renseignés">
                                <Truck className="w-2.5 h-2.5 text-white" />
                              </div>
                            )}

                            {/* Tooltip au survol */}
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                              <div className="bg-slate-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
                                {campagne.nomJeu}
                                <div className="text-slate-300">{MOIS[moisNum - 1]} {annee}</div>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Liste compacte des jeux de l'année */}
            <div className="border-t border-slate-200 bg-slate-50 px-4 py-3">
              <div className="flex flex-wrap gap-2">
                {Object.entries(campagnesParAnneeEtMois[annee])
                  .sort(([a], [b]) => Number(a) - Number(b))
                  .flatMap(([mois, campagnesDuMois]) =>
                    campagnesDuMois.map((campagne) => (
                      <button
                        key={campagne.id}
                        onClick={() => onCampagneClick(campagne)}
                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-white rounded-full border border-slate-200 hover:border-primary-400 hover:bg-primary-50 transition-colors text-sm"
                      >
                        <span className="text-slate-400 text-xs">{MOIS[Number(mois) - 1]}</span>
                        <span className="font-medium text-slate-700">{campagne.nomJeu}</span>
                        {(!campagne.fraisPort || campagne.fraisPort === 0) && (
                          <span className="w-2 h-2 bg-red-500 rounded-full" title="Frais de port non renseignés" />
                        )}
                      </button>
                    ))
                  )}
              </div>
            </div>
          </div>
        );
      })}

      {/* Section pour les campagnes sans date de livraison */}
      {campagnesSansDate.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="bg-slate-500 text-white px-6 py-3">
            <h3 className="text-xl font-bold">Date non définie</h3>
            <p className="text-slate-200 text-sm">
              {campagnesSansDate.length} jeu{campagnesSansDate.length > 1 ? 'x' : ''} sans date de livraison
            </p>
          </div>

          <div className="p-4">
            <div className="flex flex-wrap gap-3">
              {campagnesSansDate.map((campagne) => (
                <button
                  key={campagne.id}
                  onClick={() => onCampagneClick(campagne)}
                  className="group relative"
                >
                  <div className="w-14 h-14 rounded-lg overflow-hidden border-2 border-slate-200 hover:border-primary-500 transition-colors bg-slate-100 shadow-sm">
                    {campagne.imageUrl ? (
                      <Image
                        src={campagne.imageUrl}
                        alt={campagne.nomJeu}
                        width={56}
                        height={56}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-5 h-5 text-slate-400" />
                      </div>
                    )}
                  </div>

                  {(!campagne.fraisPort || campagne.fraisPort === 0) && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center" title="Frais de port non renseignés">
                      <Truck className="w-2.5 h-2.5 text-white" />
                    </div>
                  )}

                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                    <div className="bg-slate-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
                      {campagne.nomJeu}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
