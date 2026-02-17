'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Header from '@/components/Header';
import CampagneDetails from '@/components/CampagneDetails';
import { Campagne } from '@/types';
import { getCampagnes } from '@/lib/storage';
import { getCampagnesSupabase } from '@/lib/supabase-storage';
import { useAuth } from '@/contexts/AuthContext';
import { ChevronUp, ChevronDown, ChevronsUpDown, CreditCard } from 'lucide-react';

type PaiementSortField = 'date' | 'campagne' | 'montant' | 'type' | 'propriete';
type SortOrder = 'asc' | 'desc';

interface PaiementRow {
  id: string;
  date: string;
  campagneNom: string;
  campagneId: string;
  montant: number;
  devise: string;
  type: string;
  propriete: string;
}

function formatMontant(montant: number, devise: string): string {
  const symbols: Record<string, string> = {
    EUR: '\u20ac',
    USD: '$',
    GBP: '\u00a3',
    CAD: 'CA$',
    AUD: 'AU$',
  };
  const symbol = symbols[devise] || devise;
  return `${montant.toFixed(2)} ${symbol}`;
}

// Couleur de fond selon la propri\u00e9t\u00e9
function getBackgroundColor(propriete: string): string {
  switch (propriete) {
    case 'BGG':
      return '#F5F2E4';
    case 'Perso':
      return '#E6F3F5';
    default:
      return 'transparent';
  }
}

export default function PaiementsPage() {
  const { user, loading: authLoading } = useAuth();
  const [campagnes, setCampagnes] = useState<Campagne[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortField, setSortField] = useState<PaiementSortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [selectedCampagne, setSelectedCampagne] = useState<Campagne | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      if (user) {
        const c = await getCampagnesSupabase();
        setCampagnes(c);
      } else {
        const c = getCampagnes();
        setCampagnes(c);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des donn\u00e9es:', error);
    }
    setIsLoading(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  useEffect(() => {
    if (!authLoading) {
      loadData();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user?.id]);

  // Extraire tous les paiements de toutes les campagnes
  const paiements = useMemo((): PaiementRow[] => {
    const rows: PaiementRow[] = [];
    campagnes.forEach((c) => {
      c.paiements.forEach((p) => {
        rows.push({
          id: p.id,
          date: p.date,
          campagneNom: c.nomJeu,
          campagneId: c.id,
          montant: p.montant,
          devise: c.devise,
          type: p.type,
          propriete: c.propriete || 'Perso',
        });
      });
    });
    return rows;
  }, [campagnes]);

  // Trier les paiements
  const sortedPaiements = useMemo(() => {
    const sorted = [...paiements];
    sorted.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'date':
          comparison = (a.date || '').localeCompare(b.date || '');
          break;
        case 'campagne':
          comparison = a.campagneNom.localeCompare(b.campagneNom);
          break;
        case 'montant':
          comparison = a.montant - b.montant;
          break;
        case 'type':
          comparison = a.type.localeCompare(b.type);
          break;
        case 'propriete':
          comparison = a.propriete.localeCompare(b.propriete);
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
    return sorted;
  }, [paiements, sortField, sortOrder]);

  // Total des paiements
  const totalParDevise = useMemo(() => {
    const totals: Record<string, number> = {};
    paiements.forEach((p) => {
      totals[p.devise] = (totals[p.devise] || 0) + p.montant;
    });
    return totals;
  }, [paiements]);

  const handleSort = (field: PaiementSortField) => {
    if (field === sortField) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleCampagneClick = (campagneId: string) => {
    const campagne = campagnes.find(c => c.id === campagneId);
    if (campagne) {
      setSelectedCampagne(campagne);
      setShowDetails(true);
    }
  };

  const SortIcon = ({ field }: { field: PaiementSortField }) => {
    if (sortField !== field) {
      return <ChevronsUpDown className="w-3.5 h-3.5 text-slate-400" />;
    }
    return sortOrder === 'asc'
      ? <ChevronUp className="w-3.5 h-3.5 text-primary-600" />
      : <ChevronDown className="w-3.5 h-3.5 text-primary-600" />;
  };

  if (isLoading || authLoading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />

      <main className="max-w-7xl mx-auto px-2 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <CreditCard className="w-6 h-6 text-slate-400" />
            <h1 className="text-2xl font-bold text-slate-800">Paiements</h1>
            <span className="text-sm text-slate-500">
              ({paiements.length} paiement{paiements.length > 1 ? 's' : ''})
            </span>
          </div>
          {/* Total */}
          <div className="flex items-center gap-4">
            {Object.entries(totalParDevise).map(([devise, total]) => (
              <div key={devise} className="text-right">
                <p className="text-xs text-slate-500">Total {devise}</p>
                <p className="text-lg font-bold text-slate-800">{formatMontant(total, devise)}</p>
              </div>
            ))}
          </div>
        </div>

        {paiements.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <div className="text-6xl mb-4">💳</div>
            <h3 className="text-lg font-medium text-slate-800 mb-2">Aucun paiement</h3>
            <p className="text-slate-500">
              Les paiements enregistr&eacute;s dans vos campagnes appara&icirc;tront ici.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th
                      className="py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider text-left cursor-pointer hover:bg-slate-100 transition-colors select-none"
                      onClick={() => handleSort('date')}
                    >
                      <div className="flex items-center gap-1">
                        Date
                        <SortIcon field="date" />
                      </div>
                    </th>
                    <th
                      className="py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider text-left cursor-pointer hover:bg-slate-100 transition-colors select-none"
                      onClick={() => handleSort('campagne')}
                    >
                      <div className="flex items-center gap-1">
                        Campagne
                        <SortIcon field="campagne" />
                      </div>
                    </th>
                    <th
                      className="py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider text-right cursor-pointer hover:bg-slate-100 transition-colors select-none"
                      onClick={() => handleSort('montant')}
                    >
                      <div className="flex items-center justify-end gap-1">
                        Somme
                        <SortIcon field="montant" />
                      </div>
                    </th>
                    <th
                      className="py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider text-left cursor-pointer hover:bg-slate-100 transition-colors select-none"
                      onClick={() => handleSort('type')}
                    >
                      <div className="flex items-center gap-1">
                        Raison
                        <SortIcon field="type" />
                      </div>
                    </th>
                    <th
                      className="py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider text-left cursor-pointer hover:bg-slate-100 transition-colors select-none"
                      onClick={() => handleSort('propriete')}
                    >
                      <div className="flex items-center gap-1">
                        Propri&eacute;t&eacute;
                        <SortIcon field="propriete" />
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sortedPaiements.map((p) => (
                    <tr
                      key={p.id}
                      className="hover:brightness-95 transition-all"
                      style={{ backgroundColor: getBackgroundColor(p.propriete) }}
                    >
                      <td className="py-3 px-4 text-sm text-slate-700">
                        {p.date ? new Date(p.date).toLocaleDateString('fr-FR') : '-'}
                      </td>
                      <td className="py-3 px-4 text-sm font-medium">
                        <button
                          onClick={() => handleCampagneClick(p.campagneId)}
                          className="text-primary-600 hover:text-primary-800 hover:underline text-left"
                        >
                          {p.campagneNom}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-700 text-right font-medium">
                        {formatMontant(p.montant, p.devise)}
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-600">
                        {p.type}
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-600">
                        {p.propriete}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Modal détails campagne */}
      {showDetails && selectedCampagne && (
        <CampagneDetails
          campagne={selectedCampagne}
          onClose={() => {
            setShowDetails(false);
            setSelectedCampagne(null);
          }}
          onEdit={() => {}}
          onPrevious={undefined}
          onNext={undefined}
          hasPrevious={false}
          hasNext={false}
        />
      )}
    </div>
  );
}
