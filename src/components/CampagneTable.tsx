'use client';

import { Campagne } from '@/types';
import { Pencil, ExternalLink } from 'lucide-react';

interface CampagneTableProps {
  campagnes: Campagne[];
  onRowClick: (campagne: Campagne) => void;
  onEdit: (campagne: Campagne) => void;
}

const MOIS_NOMS = [
  '', 'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin',
  'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'
];

function formatMontant(montant: number, devise: string): string {
  const symbols: Record<string, string> = {
    EUR: '€',
    USD: '$',
    GBP: '£',
    CAD: 'CA$',
    AUD: 'AU$',
  };
  const symbol = symbols[devise] || devise;
  return `${montant.toFixed(0)} ${symbol}`;
}

function getStatutColor(statut: string): string {
  const normalized = statut.toLowerCase().replace(/\s+/g, '-');
  switch (normalized) {
    case 'en-cours':
      return 'bg-blue-100 text-blue-800';
    case 'financé':
    case 'finance':
      return 'bg-green-100 text-green-800';
    case 'en-production':
      return 'bg-yellow-100 text-yellow-800';
    case 'expédié':
    case 'expedie':
      return 'bg-purple-100 text-purple-800';
    case 'livré':
    case 'livre':
      return 'bg-emerald-100 text-emerald-800';
    case 'annulé':
    case 'annule':
      return 'bg-red-100 text-red-800';
    case 'remboursé':
    case 'rembourse':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-slate-100 text-slate-800';
  }
}

export default function CampagneTable({ campagnes, onRowClick, onEdit }: CampagneTableProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Jeu</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Éditeur</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Plateforme</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Statut</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Pledge</th>
              <th className="text-right py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Total</th>
              <th className="text-right py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Payé</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Livraison</th>
              <th className="text-center py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {campagnes.map((campagne) => {
              const totalAddons = (campagne.addons || []).reduce((sum, a) => sum + (a.prix * a.quantite), 0);
              const totalPaye = campagne.paiements.reduce((sum, p) => sum + p.montant, 0);
              const totalDu = campagne.prixPledge + campagne.fraisPort + totalAddons;
              const livraison = campagne.moisLivraison && campagne.anneeLivraison
                ? `${MOIS_NOMS[campagne.moisLivraison]} ${campagne.anneeLivraison}`
                : '-';

              return (
                <tr
                  key={campagne.id}
                  className="hover:bg-slate-50 cursor-pointer transition-colors"
                  onClick={() => onRowClick(campagne)}
                >
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      {campagne.imageUrl ? (
                        <img
                          src={campagne.imageUrl}
                          alt={campagne.nomJeu}
                          className="w-10 h-10 rounded object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded bg-slate-100 flex items-center justify-center text-lg">
                          🎮
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-slate-800">{campagne.nomJeu}</p>
                        {campagne.langue && (
                          <p className="text-xs text-slate-500">{campagne.langue}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm text-slate-600">{campagne.editeur}</td>
                  <td className="py-3 px-4 text-sm text-slate-600">{campagne.plateforme}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatutColor(campagne.statut)}`}>
                      {campagne.statut}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-slate-600">{campagne.niveauPledge || '-'}</td>
                  <td className="py-3 px-4 text-sm text-slate-800 font-medium text-right">
                    {formatMontant(totalDu, campagne.devise)}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className={`text-sm font-medium ${totalPaye >= totalDu ? 'text-green-600' : 'text-orange-600'}`}>
                      {formatMontant(totalPaye, campagne.devise)}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-slate-600">{livraison}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit(campagne);
                        }}
                        className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition-colors"
                        title="Modifier"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      {campagne.urlCampagne && (
                        <a
                          href={campagne.urlCampagne}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition-colors"
                          title="Ouvrir la campagne"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
