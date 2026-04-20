'use client';

import React, { useState } from 'react';
import { Campagne } from '@/types';
import { Pencil, ExternalLink, Truck, ChevronUp, ChevronDown, ChevronsUpDown, Settings2, Check } from 'lucide-react';

export type SortField = 'nomJeu' | 'editeur' | 'plateforme' | 'prixPledge' | 'dateAjout' | 'livraison' | 'langue' | 'financementTotal' | 'statut' | 'niveauPledge' | 'fraisPort' | 'totalPaye' | 'propriete' | 'nombreFigurines' | 'dateFinCampagne' | 'totalDu';
type SortOrder = 'asc' | 'desc';

export interface ColumnConfig {
  id: string;
  label: string;
  sortField?: SortField;
  visible: boolean;
  align?: 'left' | 'right' | 'center';
}

export const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: 'nomJeu', label: 'Jeu', sortField: 'nomJeu', visible: true, align: 'left' },
  { id: 'editeur', label: 'Éditeur', sortField: 'editeur', visible: true, align: 'left' },
  { id: 'statut', label: 'Statut', sortField: 'statut', visible: true, align: 'left' },
  { id: 'prixPledge', label: 'Prix', sortField: 'prixPledge', visible: true, align: 'right' },
  { id: 'fraisPort', label: 'FP', sortField: 'fraisPort', visible: true, align: 'right' },
  { id: 'totalDu', label: 'Total', sortField: 'totalDu', visible: true, align: 'right' },
  { id: 'dateFinCampagne', label: 'Fin campagne', sortField: 'dateFinCampagne', visible: true, align: 'left' },
  { id: 'propriete', label: 'Proprio', sortField: 'propriete', visible: true, align: 'left' },
  { id: 'actions', label: '', visible: true, align: 'center' },
  // Colonnes masquées par défaut
  { id: 'plateforme', label: 'Plateforme', sortField: 'plateforme', visible: false, align: 'left' },
  { id: 'niveauPledge', label: 'Pledge', sortField: 'niveauPledge', visible: false, align: 'left' },
  { id: 'totalPaye', label: 'Payé', sortField: 'totalPaye', visible: false, align: 'right' },
  { id: 'livraison', label: 'Livraison', sortField: 'livraison', visible: false, align: 'left' },
  { id: 'langue', label: 'Langue', sortField: 'langue', visible: false, align: 'left' },
  { id: 'financementTotal', label: 'Financement', sortField: 'financementTotal', visible: false, align: 'right' },
  { id: 'nombreFigurines', label: 'Figurines', sortField: 'nombreFigurines', visible: false, align: 'right' },
  { id: 'dateAjout', label: 'Date ajout', sortField: 'dateAjout', visible: false, align: 'left' },
];

interface CampagneTableProps {
  campagnes: Campagne[];
  onRowClick: (campagne: Campagne) => void;
  onEdit: (campagne: Campagne) => void;
  sortField?: SortField;
  sortOrder?: SortOrder;
  onSort?: (field: SortField) => void;
  columns?: ColumnConfig[];
  onColumnsChange?: (columns: ColumnConfig[]) => void;
}

const MOIS_NOMS = [
  '', 'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin',
  'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'
];

// Couleur de fond selon la propriété
function getBackgroundColor(propriete?: string): string {
  switch (propriete) {
    case 'BGG':
      return '#F5F2E4';
    case 'Perso':
      return '#E6F3F5';
    default:
      return 'transparent';
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
  return `${montant.toFixed(0)} ${symbol}`;
}

function getStatutColor(statut: string): string {
  const normalized = statut.toLowerCase().replace(/\s+/g, '-');
  switch (normalized) {
    case 'à-venir':
    case 'a-venir':
      return 'bg-cyan-100 text-cyan-800';
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
    case 'revendu':
      return 'bg-orange-100 text-orange-800';
    default:
      return 'bg-slate-100 text-slate-800';
  }
}

interface SortableHeaderProps {
  label: string;
  field?: SortField;
  currentField?: SortField;
  currentOrder?: SortOrder;
  onSort?: (field: SortField) => void;
  align?: 'left' | 'right' | 'center';
}

function SortableHeader({ label, field, currentField, currentOrder, onSort, align = 'left' }: SortableHeaderProps) {
  const isActive = field && currentField === field;
  const alignClass = align === 'right' ? 'justify-end' : align === 'center' ? 'justify-center' : 'justify-start';
  const isSortable = !!field;

  return (
    <th
      className={`py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider ${isSortable ? 'cursor-pointer hover:bg-slate-100' : ''} transition-colors select-none`}
      onClick={() => field && onSort?.(field)}
    >
      <div className={`flex items-center gap-1 ${alignClass}`}>
        <span>{label}</span>
        {isSortable && (
          isActive ? (
            currentOrder === 'asc' ? (
              <ChevronUp className="w-4 h-4 text-primary-600" />
            ) : (
              <ChevronDown className="w-4 h-4 text-primary-600" />
            )
          ) : (
            <ChevronsUpDown className="w-3 h-3 text-slate-400" />
          )
        )}
      </div>
    </th>
  );
}

export default function CampagneTable({
  campagnes,
  onRowClick,
  onEdit,
  sortField,
  sortOrder,
  onSort,
  columns = DEFAULT_COLUMNS,
  onColumnsChange
}: CampagneTableProps) {
  const [showColumnMenu, setShowColumnMenu] = useState(false);

  const visibleColumns = columns.filter(c => c.visible);

  const toggleColumn = (columnId: string) => {
    if (!onColumnsChange) return;
    const newColumns = columns.map(c =>
      c.id === columnId ? { ...c, visible: !c.visible } : c
    );
    onColumnsChange(newColumns);
  };

  const renderCell = (campagne: Campagne, column: ColumnConfig) => {
    const totalAddons = (campagne.addons || []).reduce((sum, a) => sum + (a.prix * a.quantite), 0);
    const totalPaye = campagne.paiements.reduce((sum, p) => sum + p.montant, 0);
    const totalDu = campagne.prixPledge + campagne.fraisPort + totalAddons;
    const livraison = campagne.moisLivraison && campagne.anneeLivraison
      ? `${MOIS_NOMS[campagne.moisLivraison]} ${campagne.anneeLivraison}`
      : '-';

    switch (column.id) {
      case 'nomJeu':
        return (
          <td key={column.id} className="py-3 px-4">
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
        );
      case 'editeur':
        return <td key={column.id} className="py-3 px-4 text-sm text-slate-600">{campagne.editeur}</td>;
      case 'plateforme':
        return <td key={column.id} className="py-3 px-4 text-sm text-slate-600">{campagne.plateforme}</td>;
      case 'statut':
        return (
          <td key={column.id} className="py-3 px-4">
            <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatutColor(campagne.statut)}`}>
              {campagne.statut}
            </span>
          </td>
        );
      case 'niveauPledge':
        return <td key={column.id} className="py-3 px-4 text-sm text-slate-600">{campagne.niveauPledge || '-'}</td>;
      case 'prixPledge':
        return (
          <td key={column.id} className="py-3 px-4 text-sm text-slate-800 text-right">
            {formatMontant(campagne.prixPledge, campagne.devise)}
          </td>
        );
      case 'totalDu':
        return (
          <td key={column.id} className="py-3 px-4 text-sm font-semibold text-right text-primary-600">
            {formatMontant(totalDu, campagne.devise)}
          </td>
        );
      case 'dateFinCampagne':
        return (
          <td key={column.id} className="py-3 px-4 text-sm text-slate-600">
            {campagne.dateFinCampagne
              ? new Date(campagne.dateFinCampagne).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
              : '-'}
          </td>
        );
      case 'fraisPort':
        return (
          <td key={column.id} className="py-3 px-4 text-sm text-right">
            {!campagne.fraisPortPayes ? (
              <div className="flex items-center justify-end gap-1">
                <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center" title="Frais de port non réglés">
                  <Truck className="w-2.5 h-2.5 text-white" />
                </div>
              </div>
            ) : (
              <span className="text-slate-600">{campagne.fraisPort ? formatMontant(campagne.fraisPort, campagne.devise) : '0 €'}</span>
            )}
          </td>
        );
      case 'totalPaye':
        return (
          <td key={column.id} className="py-3 px-4 text-right">
            <span className={`text-sm font-medium ${totalPaye >= totalDu ? 'text-green-600' : 'text-orange-600'}`}>
              {formatMontant(totalPaye, campagne.devise)}
            </span>
          </td>
        );
      case 'livraison':
        return <td key={column.id} className="py-3 px-4 text-sm text-slate-600">{livraison}</td>;
      case 'langue':
        return <td key={column.id} className="py-3 px-4 text-sm text-slate-600">{campagne.langue || '-'}</td>;
      case 'propriete':
        return <td key={column.id} className="py-3 px-4 text-sm text-slate-600">{campagne.propriete || 'Perso'}</td>;
      case 'financementTotal':
        return (
          <td key={column.id} className="py-3 px-4 text-sm text-slate-600 text-right">
            {campagne.financementTotal ? formatMontant(campagne.financementTotal, campagne.devise) : '-'}
          </td>
        );
      case 'nombreFigurines':
        return (
          <td key={column.id} className="py-3 px-4 text-sm text-slate-600 text-right">
            {campagne.nombreFigurines || '-'}
          </td>
        );
      case 'dateAjout':
        return (
          <td key={column.id} className="py-3 px-4 text-sm text-slate-600">
            {campagne.dateAjout ? new Date(campagne.dateAjout).toLocaleDateString('fr-FR') : '-'}
          </td>
        );
      case 'actions':
        return (
          <td key={column.id} className="py-3 px-4">
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
        );
      default:
        return <td key={column.id} className="py-3 px-4">-</td>;
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      {/* Bouton de configuration des colonnes */}
      {onColumnsChange && (
        <div className="flex justify-end p-2 border-b border-slate-100">
          <div className="relative">
            <button
              onClick={() => setShowColumnMenu(!showColumnMenu)}
              className="flex items-center gap-1 px-3 py-1.5 text-sm text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded transition-colors"
            >
              <Settings2 className="w-4 h-4" />
              <span>Colonnes</span>
            </button>

            {showColumnMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowColumnMenu(false)}
                />
                <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-slate-200 z-20 py-1">
                  {columns.filter(c => c.id !== 'actions').map(column => (
                    <button
                      key={column.id}
                      onClick={() => toggleColumn(column.id)}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      <div className={`w-4 h-4 rounded border flex items-center justify-center ${column.visible ? 'bg-primary-500 border-primary-500' : 'border-slate-300'}`}>
                        {column.visible && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <span>{column.label}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              {visibleColumns.map(column => (
                <SortableHeader
                  key={column.id}
                  label={column.label}
                  field={column.sortField}
                  currentField={sortField}
                  currentOrder={sortOrder}
                  onSort={onSort}
                  align={column.align}
                />
              ))}
            </tr>
          </thead>
          <tbody>
            {(() => {
              // Pré-calcul des stats par année
              const yearStats: Record<number, { count: number; total: number; delivered: number; resold: number }> = {};
              campagnes.forEach(c => {
                if (c.dateFinCampagne) {
                  const year = new Date(c.dateFinCampagne).getFullYear();
                  if (!yearStats[year]) yearStats[year] = { count: 0, total: 0, delivered: 0, resold: 0 };
                  yearStats[year].count++;
                  yearStats[year].total += c.prixPledge + c.fraisPort + (c.addons || []).reduce((sum, a) => sum + a.prix * a.quantite, 0);
                  if (c.statut === 'Livré' || c.statut === 'Revendu') yearStats[year].delivered++;
                  if (c.statut === 'Revendu') yearStats[year].resold++;
                }
              });

              return campagnes.map((campagne, index) => {
                // Séparateur d'année si tri par dateFinCampagne
                const currentYear = campagne.dateFinCampagne ? new Date(campagne.dateFinCampagne).getFullYear() : null;
                const prevYear = index > 0 && campagnes[index - 1]?.dateFinCampagne
                  ? new Date(campagnes[index - 1].dateFinCampagne!).getFullYear()
                  : null;
                const showYearSeparator = sortField === 'dateFinCampagne' && currentYear && (index === 0 || currentYear !== prevYear);
                const stats = currentYear ? yearStats[currentYear] : null;

                return (
                  <React.Fragment key={campagne.id}>
                    {showYearSeparator && stats && (
                      <tr>
                        <td colSpan={visibleColumns.length} className="py-0 px-0">
                          <div className="flex items-center justify-center gap-4 text-xs font-medium text-slate-200 bg-slate-500 py-2"
                               style={{ boxShadow: '-8px 0 0 0 #64748b, 8px 0 0 0 #64748b' }}>
                            <span className="text-base font-bold text-white">{currentYear}</span>
                            <span className="text-slate-400">•</span>
                            <span>{stats.count} campagne{stats.count > 1 ? 's' : ''}</span>
                            <span className="text-slate-400">•</span>
                            <span className="text-cyan-300 font-semibold">{stats.total.toLocaleString('fr-FR')} €</span>
                            <span className="text-slate-400">•</span>
                            <span className="text-green-300">{stats.delivered} reçue{stats.delivered > 1 ? 's' : ''}</span>
                            {stats.resold > 0 && (
                              <>
                                <span className="text-slate-400">•</span>
                                <span className="text-orange-300">{stats.resold} revendue{stats.resold > 1 ? 's' : ''}</span>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                    <tr
                      className="hover:brightness-95 cursor-pointer transition-all border-b border-slate-100"
                      style={{ backgroundColor: getBackgroundColor(campagne.propriete) }}
                      onClick={() => onRowClick(campagne)}
                    >
                      {visibleColumns.map(column => renderCell(campagne, column))}
                    </tr>
                  </React.Fragment>
                );
              });
            })()}
          </tbody>
        </table>
      </div>
    </div>
  );
}
