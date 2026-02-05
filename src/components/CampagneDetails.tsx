'use client';

import Image from 'next/image';
import { X, ExternalLink, Calendar, CreditCard, Package, Tag, Building, Globe, User, Truck, TrendingUp } from 'lucide-react';
import { Campagne } from '@/types';

interface CampagneDetailsProps {
  campagne: Campagne;
  onClose: () => void;
  onEdit: () => void;
}

const MOIS_NOMS = [
  '', 'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
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
  return `${montant.toFixed(2)} ${symbol}`;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
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

export default function CampagneDetails({ campagne, onClose, onEdit }: CampagneDetailsProps) {
  const totalAddons = (campagne.addons || []).reduce((sum, a) => sum + (a.prix * a.quantite), 0);
  const totalPaye = campagne.paiements.reduce((sum, p) => sum + p.montant, 0);
  const totalDu = campagne.prixPledge + campagne.fraisPort + totalAddons;
  const resteAPayer = totalDu - totalPaye;

  const livraisonPrevue = campagne.moisLivraison && campagne.anneeLivraison
    ? `${MOIS_NOMS[campagne.moisLivraison]} ${campagne.anneeLivraison}`
    : '-';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 overflow-y-auto py-8">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full mx-4 my-auto">
        {/* Header avec image */}
        <div className="relative">
          {campagne.imageUrl ? (
            <div className="relative h-64 w-full">
              <Image
                src={campagne.imageUrl}
                alt={campagne.nomJeu}
                fill
                className="object-cover rounded-t-xl"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent rounded-t-xl" />
            </div>
          ) : (
            <div className="h-48 bg-gradient-to-br from-slate-200 to-slate-300 rounded-t-xl flex items-center justify-center">
              <span className="text-8xl">🎮</span>
            </div>
          )}

          {/* Boutons */}
          <div className="absolute top-4 right-4 flex gap-2">
            <button
              onClick={onEdit}
              className="px-3 py-1.5 bg-white/90 hover:bg-white text-slate-700 rounded-lg text-sm font-medium transition-colors"
            >
              Modifier
            </button>
            <button
              onClick={onClose}
              className="p-2 bg-white/90 hover:bg-white text-slate-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Badge statut */}
          <div className="absolute bottom-4 left-4">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatutColor(campagne.statut)}`}>
              {campagne.statut}
            </span>
          </div>

          {/* Titre sur l'image */}
          <div className="absolute bottom-4 right-4 text-right">
            <h1 className="text-2xl font-bold text-white drop-shadow-lg">{campagne.nomJeu}</h1>
            <p className="text-white/90 drop-shadow">{campagne.editeur}</p>
          </div>
        </div>

        {/* Contenu */}
        <div className="p-6 space-y-6">
          {/* Infos principales */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <Building className="w-5 h-5 text-slate-400" />
              <div>
                <p className="text-xs text-slate-500">Plateforme</p>
                <p className="font-medium">{campagne.plateforme}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-slate-400" />
              <div>
                <p className="text-xs text-slate-500">Langue</p>
                <p className="font-medium">{campagne.langue || '-'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-slate-400" />
              <div>
                <p className="text-xs text-slate-500">Propriété</p>
                <p className="font-medium">{campagne.propriete || 'Perso'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-slate-400" />
              <div>
                <p className="text-xs text-slate-500">Livraison prévue</p>
                <p className="font-medium">{livraisonPrevue}</p>
              </div>
            </div>
          </div>

          {/* Pledge */}
          <div className="bg-slate-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Tag className="w-5 h-5 text-slate-400" />
              <h3 className="font-semibold text-slate-800">Pledge</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-slate-500">Niveau</p>
                <p className="font-medium">{campagne.niveauPledge || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Prix pledge</p>
                <p className="font-medium">{formatMontant(campagne.prixPledge, campagne.devise)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Frais de port</p>
                <p className="font-medium flex items-center gap-2">
                  {campagne.fraisPort && campagne.fraisPort > 0
                    ? formatMontant(campagne.fraisPort, campagne.devise)
                    : <span className="flex items-center gap-1">
                        <span className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center" title="Frais de port non renseignés">
                          <Truck className="w-3 h-3 text-white" />
                        </span>
                        <span className="text-red-600 text-sm">Non renseignés</span>
                      </span>
                  }
                </p>
              </div>
              {campagne.idEngagement && (
                <div>
                  <p className="text-xs text-slate-500">ID Engagement</p>
                  <p className="font-medium">{campagne.idEngagement}</p>
                </div>
              )}
              {campagne.dateFinCampagne && (
                <div>
                  <p className="text-xs text-slate-500">Fin de campagne</p>
                  <p className="font-medium">{formatDate(campagne.dateFinCampagne)}</p>
                </div>
              )}
              {campagne.financementTotal && (
                <div>
                  <p className="text-xs text-slate-500">Financement total</p>
                  <p className="font-medium flex items-center gap-1">
                    <TrendingUp className="w-4 h-4 text-green-500" />
                    {new Intl.NumberFormat('fr-FR').format(campagne.financementTotal)} {campagne.devise}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Add-ons */}
          {campagne.addons && campagne.addons.length > 0 && (
            <div className="bg-slate-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Package className="w-5 h-5 text-slate-400" />
                <h3 className="font-semibold text-slate-800">Add-ons</h3>
              </div>
              <div className="space-y-2">
                {campagne.addons.map((addon) => (
                  <div key={addon.id} className="flex justify-between items-center text-sm">
                    <span>
                      {addon.nom}
                      {addon.langue && <span className="text-slate-500 ml-2">({addon.langue})</span>}
                      {addon.quantite > 1 && <span className="text-slate-500"> x{addon.quantite}</span>}
                    </span>
                    <span className="font-medium">{formatMontant(addon.prix * addon.quantite, campagne.devise)}</span>
                  </div>
                ))}
                <div className="pt-2 border-t border-slate-200 flex justify-between text-sm font-medium">
                  <span>Total add-ons</span>
                  <span>{formatMontant(totalAddons, campagne.devise)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Paiements */}
          <div className="bg-slate-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <CreditCard className="w-5 h-5 text-slate-400" />
              <h3 className="font-semibold text-slate-800">Paiements</h3>
            </div>
            {campagne.paiements.length > 0 ? (
              <div className="space-y-2">
                {campagne.paiements.map((paiement) => (
                  <div key={paiement.id} className="flex justify-between items-center text-sm">
                    <span>
                      <span className="text-slate-500">{formatDate(paiement.date)}</span>
                      <span className="ml-2">{paiement.type}</span>
                    </span>
                    <span className="font-medium text-green-600">{formatMontant(paiement.montant, campagne.devise)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500 italic">Aucun paiement enregistré</p>
            )}

            {/* Résumé financier */}
            <div className="mt-4 pt-3 border-t border-slate-200 space-y-1">
              <div className="flex justify-between text-sm">
                <span>Total dû</span>
                <span className="font-medium">{formatMontant(totalDu, campagne.devise)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Total payé</span>
                <span className="font-medium text-green-600">{formatMontant(totalPaye, campagne.devise)}</span>
              </div>
              <div className="flex justify-between text-sm font-semibold">
                <span>Reste à payer</span>
                <span className={resteAPayer > 0 ? 'text-orange-600' : 'text-green-600'}>
                  {formatMontant(resteAPayer, campagne.devise)}
                </span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {campagne.notes && (
            <div className="bg-slate-50 rounded-lg p-4">
              <h3 className="font-semibold text-slate-800 mb-2">Notes</h3>
              <p className="text-sm text-slate-600 whitespace-pre-wrap">{campagne.notes}</p>
            </div>
          )}

          {/* Liens */}
          <div className="flex flex-wrap gap-3">
            {campagne.urlCampagne && (
              <a
                href={campagne.urlCampagne}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-medium text-slate-700 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                Page campagne
              </a>
            )}
            {campagne.urlBGG && (
              <a
                href={campagne.urlBGG}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-orange-100 hover:bg-orange-200 rounded-lg text-sm font-medium text-orange-700 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                BoardGameGeek
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
