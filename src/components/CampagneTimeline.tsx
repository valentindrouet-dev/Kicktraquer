'use client';

import { useMemo } from 'react';
import { Campagne } from '@/types';
import Image from 'next/image';
import { Package } from 'lucide-react';

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
  // Grouper les campagnes par année
  const campagnesParAnnee = useMemo(() => {
    const parAnnee: Record<number, Campagne[]> = {};

    campagnes.forEach((campagne) => {
      if (campagne.anneeLivraison) {
        if (!parAnnee[campagne.anneeLivraison]) {
          parAnnee[campagne.anneeLivraison] = [];
        }
        parAnnee[campagne.anneeLivraison].push(campagne);
      }
    });

    // Trier les campagnes de chaque année par mois
    Object.keys(parAnnee).forEach((annee) => {
      parAnnee[Number(annee)].sort((a, b) => {
        return (a.moisLivraison || 1) - (b.moisLivraison || 1);
      });
    });

    return parAnnee;
  }, [campagnes]);

  // Obtenir les années triées
  const annees = useMemo(() => {
    return Object.keys(campagnesParAnnee)
      .map(Number)
      .sort((a, b) => a - b);
  }, [campagnesParAnnee]);

  // Campagnes sans date de livraison
  const campagnesSansDate = useMemo(() => {
    return campagnes.filter((c) => !c.anneeLivraison);
  }, [campagnes]);

  if (campagnes.length === 0) {
    return null;
  }

  return (
    <div className="space-y-8">
      {annees.map((annee) => (
        <div key={annee} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          {/* En-tête de l'année */}
          <div className="bg-primary-600 text-white px-6 py-3">
            <h3 className="text-xl font-bold">{annee}</h3>
            <p className="text-primary-100 text-sm">
              {campagnesParAnnee[annee].length} jeu{campagnesParAnnee[annee].length > 1 ? 'x' : ''} prévu{campagnesParAnnee[annee].length > 1 ? 's' : ''}
            </p>
          </div>

          {/* Frise chronologique */}
          <div className="p-4">
            {/* Ligne des mois */}
            <div className="relative">
              <div className="flex justify-between border-b-2 border-slate-200 pb-2 mb-4">
                {MOIS.map((mois, index) => (
                  <div
                    key={mois}
                    className="text-xs text-slate-500 font-medium w-[8.33%] text-center"
                  >
                    {mois}
                  </div>
                ))}
              </div>

              {/* Conteneur des campagnes */}
              <div className="relative min-h-[120px]">
                {/* Lignes verticales pour chaque mois */}
                <div className="absolute inset-0 flex">
                  {MOIS.map((_, index) => (
                    <div
                      key={index}
                      className="w-[8.33%] border-l border-slate-100 first:border-l-0"
                    />
                  ))}
                </div>

                {/* Campagnes positionnées */}
                <div className="relative flex flex-wrap gap-2 py-2">
                  {campagnesParAnnee[annee].map((campagne) => {
                    const mois = campagne.moisLivraison || 1;
                    const leftPercent = ((mois - 1) / 12) * 100;

                    return (
                      <div
                        key={campagne.id}
                        className="absolute group"
                        style={{
                          left: `${leftPercent}%`,
                          transform: 'translateX(-50%)'
                        }}
                      >
                        <button
                          onClick={() => onCampagneClick(campagne)}
                          className="block relative"
                          title={`${campagne.nomJeu} - ${MOIS[mois - 1]} ${annee}`}
                        >
                          <div className="w-16 h-16 rounded-lg overflow-hidden border-2 border-slate-200 hover:border-primary-500 transition-colors bg-slate-100 shadow-sm">
                            {campagne.imageUrl ? (
                              <Image
                                src={campagne.imageUrl}
                                alt={campagne.nomJeu}
                                width={64}
                                height={64}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Package className="w-6 h-6 text-slate-400" />
                              </div>
                            )}
                          </div>

                          {/* Indicateur frais de port non payés */}
                          {campagne.fraisPort > 0 && !campagne.fraisPortPayes && (
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center" title="Frais de port à payer">
                              <span className="text-white text-[8px] font-bold">FP</span>
                            </div>
                          )}

                          {/* Tooltip au survol */}
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                            <div className="bg-slate-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
                              {campagne.nomJeu}
                              <div className="text-slate-300">{MOIS[mois - 1]} {annee}</div>
                            </div>
                          </div>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Liste compacte des jeux de l'année */}
          <div className="border-t border-slate-200 bg-slate-50 px-4 py-3">
            <div className="flex flex-wrap gap-2">
              {campagnesParAnnee[annee].map((campagne) => (
                <button
                  key={campagne.id}
                  onClick={() => onCampagneClick(campagne)}
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-white rounded-full border border-slate-200 hover:border-primary-400 hover:bg-primary-50 transition-colors text-sm"
                >
                  <span className="text-slate-400 text-xs">{MOIS[(campagne.moisLivraison || 1) - 1]}</span>
                  <span className="font-medium text-slate-700">{campagne.nomJeu}</span>
                  {campagne.fraisPort > 0 && !campagne.fraisPortPayes && (
                    <span className="w-2 h-2 bg-red-500 rounded-full" title="Frais de port à payer" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      ))}

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
                  <div className="w-16 h-16 rounded-lg overflow-hidden border-2 border-slate-200 hover:border-primary-500 transition-colors bg-slate-100 shadow-sm">
                    {campagne.imageUrl ? (
                      <Image
                        src={campagne.imageUrl}
                        alt={campagne.nomJeu}
                        width={64}
                        height={64}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-6 h-6 text-slate-400" />
                      </div>
                    )}
                  </div>

                  {campagne.fraisPort > 0 && !campagne.fraisPortPayes && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center" title="Frais de port à payer">
                      <span className="text-white text-[8px] font-bold">FP</span>
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
