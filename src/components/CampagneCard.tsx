'use client';

import Image from 'next/image';
import { Campagne } from '@/types';
import { ExternalLink, Pencil } from 'lucide-react';

interface CampagneCardProps {
  campagne: Campagne;
  size: number;
  onClick: () => void;
  onEdit: () => void;
}

function getStatutBadgeClass(statut: string): string {
  const normalized = statut.toLowerCase().replace(/\s+/g, '-');
  switch (normalized) {
    case 'en-cours':
      return 'badge-en-cours';
    case 'financé':
    case 'finance':
      return 'badge-finance';
    case 'en-production':
      return 'badge-en-production';
    case 'expédié':
    case 'expedie':
      return 'badge-expedie';
    case 'livré':
    case 'livre':
      return 'badge-livre';
    case 'annulé':
    case 'annule':
      return 'badge-annule';
    case 'remboursé':
    case 'rembourse':
      return 'badge-rembourse';
    default:
      return 'bg-slate-100 text-slate-800';
  }
}

function formatMontant(montant: number, devise: string): string {
  const symbols: Record<string, string> = {
    EUR: '€',
    USD: '$',
    GBP: '£',
    CAD: 'CA$',
    AUD: 'AU$',
  };
  const symbol = symbols[devise] || devise;
  return `${montant.toFixed(2)} ${symbol}`;
}

export default function CampagneCard({ campagne, size, onClick, onEdit }: CampagneCardProps) {
  const totalAddons = (campagne.addons || []).reduce((sum, a) => sum + (a.prix * a.quantite), 0);
  const totalPaye = campagne.paiements.reduce((sum, p) => sum + p.montant, 0);
  const totalDu = campagne.prixPledge + campagne.fraisPort + totalAddons;
  const resteAPayer = totalDu - totalPaye;

  // Taille de la carte basée sur le slider
  // En mode mini (0-1), on affiche uniquement l'image
  const isMinimalMode = size <= 1;
  const cardWidth = isMinimalMode ? (80 + size * 40) : (150 + size * 30); // De 80px à 270px
  const imageHeight = isMinimalMode ? cardWidth : (100 + size * 25); // Carré en mode mini

  return (
    <div
      className={`bg-white overflow-hidden cursor-pointer card-hover border border-slate-200 group ${isMinimalMode ? 'rounded-lg' : 'rounded-xl shadow-sm'}`}
      style={{ width: `${cardWidth}px` }}
      onClick={onClick}
      title={campagne.nomJeu}
    >
      {/* Image */}
      <div
        className="relative bg-gradient-to-br from-slate-100 to-slate-200"
        style={{ height: `${imageHeight}px` }}
      >
        {campagne.imageUrl ? (
          <Image
            src={campagne.imageUrl}
            alt={campagne.nomJeu}
            fill
            className="object-cover"
            sizes={`${cardWidth}px`}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-400">
            <span className={isMinimalMode ? 'text-2xl' : 'text-4xl'}>🎮</span>
          </div>
        )}
        {/* Badge statut - caché en mode mini */}
        {!isMinimalMode && (
          <div className="absolute top-2 left-2">
            <span className={`badge ${getStatutBadgeClass(campagne.statut)}`}>
              {campagne.statut}
            </span>
          </div>
        )}
        {/* Bouton édition - visible au hover */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          className={`absolute ${isMinimalMode ? 'bottom-1 right-1 p-1' : 'bottom-2 right-2 p-1.5'} bg-white/90 rounded-full hover:bg-white transition-all opacity-0 group-hover:opacity-100`}
          title="Modifier"
        >
          <Pencil className={`${isMinimalMode ? 'w-3 h-3' : 'w-4 h-4'} text-slate-600`} />
        </button>
        {/* Lien externe - caché en mode mini */}
        {!isMinimalMode && campagne.urlCampagne && (
          <a
            href={campagne.urlCampagne}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute top-2 right-2 p-1.5 bg-white/90 rounded-full hover:bg-white transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <ExternalLink className="w-4 h-4 text-slate-600" />
          </a>
        )}
      </div>

      {/* Contenu - caché en mode mini */}
      {!isMinimalMode && (
        <div className="p-3">
          <h3 className="font-semibold text-slate-800 truncate" title={campagne.nomJeu}>
            {campagne.nomJeu}
          </h3>
          <p className="text-sm text-slate-500 truncate">{campagne.editeur}</p>

          {size >= 3 && (
            <div className="mt-2 pt-2 border-t border-slate-100">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Plateforme</span>
                <span className="text-slate-700 font-medium">{campagne.plateforme}</span>
              </div>
              <div className="flex justify-between text-xs mt-1">
                <span className="text-slate-500">Total</span>
                <span className="text-slate-700 font-medium">
                  {formatMontant(totalDu, campagne.devise)}
                </span>
              </div>
              {resteAPayer > 0 && (
                <div className="flex justify-between text-xs mt-1">
                  <span className="text-slate-500">Reste à payer</span>
                  <span className="text-orange-600 font-medium">
                    {formatMontant(resteAPayer, campagne.devise)}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
