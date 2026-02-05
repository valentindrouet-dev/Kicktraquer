'use client';

import Image from 'next/image';
import { Campagne } from '@/types';
import { ExternalLink } from 'lucide-react';

interface CampagneCardProps {
  campagne: Campagne;
  size: number;
  onClick: () => void;
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

export default function CampagneCard({ campagne, size, onClick }: CampagneCardProps) {
  const totalPaye = campagne.paiements.reduce((sum, p) => sum + p.montant, 0);
  const totalDu = campagne.prixPledge + campagne.fraisPort;
  const resteAPayer = totalDu - totalPaye;

  // Taille de la carte basée sur le slider
  const cardWidth = 150 + size * 30; // De 150px à 270px
  const imageHeight = 100 + size * 25; // De 100px à 200px

  return (
    <div
      className="bg-white rounded-xl shadow-sm overflow-hidden cursor-pointer card-hover border border-slate-200"
      style={{ width: `${cardWidth}px` }}
      onClick={onClick}
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
            <span className="text-4xl">🎮</span>
          </div>
        )}
        {/* Badge statut */}
        <div className="absolute top-2 left-2">
          <span className={`badge ${getStatutBadgeClass(campagne.statut)}`}>
            {campagne.statut}
          </span>
        </div>
        {/* Lien externe */}
        {campagne.urlCampagne && (
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

      {/* Contenu */}
      <div className="p-3">
        <h3 className="font-semibold text-slate-800 truncate" title={campagne.nomJeu}>
          {campagne.nomJeu}
        </h3>
        <p className="text-sm text-slate-500 truncate">{campagne.editeur}</p>

        {size >= 2 && (
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
    </div>
  );
}
