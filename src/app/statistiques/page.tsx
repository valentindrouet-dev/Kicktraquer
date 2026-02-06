'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Header from '@/components/Header';
import { Campagne, Parametres, PARAMETRES_DEFAUT } from '@/types';
import { getCampagnes, getParametres } from '@/lib/storage';
import { getCampagnesSupabase, getParametresSupabase } from '@/lib/supabase-storage';
import { useAuth } from '@/contexts/AuthContext';
import { TrendingUp, Package, CreditCard, Clock, CheckCircle, Filter, ChevronDown, ChevronUp, Calendar, Truck, Globe, Building } from 'lucide-react';

interface StatCard {
  label: string;
  value: string;
  subValue?: string;
  icon: React.ReactNode;
  color: string;
}

export default function StatistiquesPage() {
  const { user, loading: authLoading } = useAuth();
  const [campagnes, setCampagnes] = useState<Campagne[]>([]);
  const [parametres, setParametres] = useState<Parametres>(PARAMETRES_DEFAUT);
  const [isLoading, setIsLoading] = useState(true);
  const [deviseAffichage, setDeviseAffichage] = useState('EUR');

  // Filtres
  const [showFilters, setShowFilters] = useState(false);
  const [selectedPlateforme, setSelectedPlateforme] = useState<string>('');
  const [selectedStatut, setSelectedStatut] = useState<string>('');
  const [selectedPropriete, setSelectedPropriete] = useState<string>('');
  const [selectedLangue, setSelectedLangue] = useState<string>('');

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      if (user) {
        // Supabase
        const c = await getCampagnesSupabase();
        const p = await getParametresSupabase();
        setCampagnes(c);
        setParametres(p);
      } else {
        // localStorage
        const c = getCampagnes();
        const p = getParametres();
        setCampagnes(c);
        setParametres(p);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    }
    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    if (!authLoading) {
      loadData();
    }
  }, [authLoading, loadData]);

  // Campagnes filtrées
  const filteredCampagnes = useMemo(() => {
    let result = [...campagnes];
    if (selectedPlateforme) {
      result = result.filter((c) => c.plateforme === selectedPlateforme);
    }
    if (selectedStatut) {
      result = result.filter((c) => c.statut === selectedStatut);
    }
    if (selectedPropriete) {
      result = result.filter((c) => (c.propriete || 'Perso') === selectedPropriete);
    }
    if (selectedLangue) {
      result = result.filter((c) => c.langue === selectedLangue);
    }
    return result;
  }, [campagnes, selectedPlateforme, selectedStatut, selectedPropriete, selectedLangue]);

  // Valeurs uniques pour les filtres
  const plateformesUtilisees = useMemo(() => {
    const set = new Set(campagnes.map((c) => c.plateforme));
    return Array.from(set).sort();
  }, [campagnes]);

  const statutsUtilises = useMemo(() => {
    const set = new Set(campagnes.map((c) => c.statut));
    return Array.from(set).sort();
  }, [campagnes]);

  const proprietesUtilisees = useMemo(() => {
    const set = new Set(campagnes.map((c) => c.propriete || 'Perso'));
    return Array.from(set).sort();
  }, [campagnes]);

  const languesUtilisees = useMemo(() => {
    const set = new Set(campagnes.map((c) => c.langue).filter(Boolean));
    return Array.from(set).sort() as string[];
  }, [campagnes]);

  // Statistiques calculées
  const stats = useMemo(() => {
    if (filteredCampagnes.length === 0) return null;

    // Par plateforme
    const parPlateforme: Record<string, { count: number; total: number }> = {};
    // Par statut
    const parStatut: Record<string, number> = {};
    // Par année de paiement
    const paiementsParAnnee: Record<number, number> = {};
    // Par année de livraison prévue
    const livraisonsParAnnee: Record<number, { count: number; total: number }> = {};
    // Par langue
    const parLangue: Record<string, { count: number; total: number }> = {};
    // Par éditeur
    const parEditeur: Record<string, { count: number; total: number }> = {};
    // Totaux
    let totalPledge = 0;
    let totalFraisPort = 0;
    let totalAddons = 0;
    let totalPaye = 0;
    let totalFinancementGlobal = 0;
    let fraisPortNonRenseignes = 0;

    filteredCampagnes.forEach((c) => {
      // Conversion simplifiée (dans la vraie vie, utiliser une API de taux de change)
      const multiplier = c.devise === deviseAffichage ? 1 :
        c.devise === 'USD' && deviseAffichage === 'EUR' ? 0.92 :
        c.devise === 'EUR' && deviseAffichage === 'USD' ? 1.09 :
        c.devise === 'GBP' && deviseAffichage === 'EUR' ? 1.17 :
        c.devise === 'EUR' && deviseAffichage === 'GBP' ? 0.85 : 1;

      const pledgeConverti = c.prixPledge * multiplier;
      const portConverti = c.fraisPort * multiplier;
      const addonsConverti = (c.addons || []).reduce((sum, a) => sum + (a.prix * a.quantite), 0) * multiplier;
      const totalCampagne = pledgeConverti + portConverti + addonsConverti;

      totalPledge += pledgeConverti;
      totalFraisPort += portConverti;
      totalAddons += addonsConverti;

      // Financement total global
      if (c.financementTotal) {
        totalFinancementGlobal += c.financementTotal * multiplier;
      }

      // Frais de port non renseignés
      if (!c.fraisPort || c.fraisPort === 0) {
        fraisPortNonRenseignes++;
      }

      // Paiements par année
      c.paiements.forEach((p) => {
        const annee = new Date(p.date).getFullYear();
        const montantConverti = p.montant * multiplier;
        paiementsParAnnee[annee] = (paiementsParAnnee[annee] || 0) + montantConverti;
        totalPaye += montantConverti;
      });

      // Par plateforme
      if (!parPlateforme[c.plateforme]) {
        parPlateforme[c.plateforme] = { count: 0, total: 0 };
      }
      parPlateforme[c.plateforme].count++;
      parPlateforme[c.plateforme].total += totalCampagne;

      // Par statut
      parStatut[c.statut] = (parStatut[c.statut] || 0) + 1;

      // Par année de livraison
      if (c.anneeLivraison) {
        if (!livraisonsParAnnee[c.anneeLivraison]) {
          livraisonsParAnnee[c.anneeLivraison] = { count: 0, total: 0 };
        }
        livraisonsParAnnee[c.anneeLivraison].count++;
        livraisonsParAnnee[c.anneeLivraison].total += totalCampagne;
      }

      // Par langue
      const langue = c.langue || 'Non spécifiée';
      if (!parLangue[langue]) {
        parLangue[langue] = { count: 0, total: 0 };
      }
      parLangue[langue].count++;
      parLangue[langue].total += totalCampagne;

      // Par éditeur
      if (!parEditeur[c.editeur]) {
        parEditeur[c.editeur] = { count: 0, total: 0 };
      }
      parEditeur[c.editeur].count++;
      parEditeur[c.editeur].total += totalCampagne;
    });

    const totalDu = totalPledge + totalFraisPort + totalAddons;
    const resteAPayer = totalDu - totalPaye;

    // Campagnes livrées vs en attente
    const livrees = filteredCampagnes.filter((c) => c.statut === 'Livré').length;
    const enAttente = filteredCampagnes.filter((c) =>
      !['Livré', 'Annulé', 'Remboursé'].includes(c.statut)
    ).length;

    // Top 5 éditeurs
    const topEditeurs = Object.entries(parEditeur)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 5);

    return {
      nombreTotal: filteredCampagnes.length,
      totalPledge,
      totalFraisPort,
      totalAddons,
      totalDu,
      totalPaye,
      resteAPayer,
      parPlateforme,
      parStatut,
      paiementsParAnnee,
      livraisonsParAnnee,
      parLangue,
      topEditeurs,
      totalFinancementGlobal,
      fraisPortNonRenseignes,
      livrees,
      enAttente,
      moyennePledge: totalPledge / filteredCampagnes.length,
    };
  }, [filteredCampagnes, deviseAffichage]);

  const formatMontant = (montant: number) => {
    const symbols: Record<string, string> = {
      EUR: '€',
      USD: '$',
      GBP: '£',
    };
    return `${montant.toFixed(2)} ${symbols[deviseAffichage] || deviseAffichage}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const statCards: StatCard[] = stats ? [
    {
      label: 'Campagnes totales',
      value: stats.nombreTotal.toString(),
      icon: <Package className="w-6 h-6" />,
      color: 'bg-blue-500',
    },
    {
      label: 'Total engagé',
      value: formatMontant(stats.totalDu),
      subValue: `Pledges: ${formatMontant(stats.totalPledge)} | Add-ons: ${formatMontant(stats.totalAddons)} | Port: ${formatMontant(stats.totalFraisPort)}`,
      icon: <TrendingUp className="w-6 h-6" />,
      color: 'bg-green-500',
    },
    {
      label: 'Total payé',
      value: formatMontant(stats.totalPaye),
      icon: <CreditCard className="w-6 h-6" />,
      color: 'bg-emerald-500',
    },
    {
      label: 'Reste à payer',
      value: formatMontant(stats.resteAPayer),
      icon: <Clock className="w-6 h-6" />,
      color: stats.resteAPayer > 0 ? 'bg-orange-500' : 'bg-green-500',
    },
    {
      label: 'Campagnes livrées',
      value: stats.livrees.toString(),
      icon: <CheckCircle className="w-6 h-6" />,
      color: 'bg-emerald-500',
    },
    {
      label: 'En attente',
      value: stats.enAttente.toString(),
      icon: <Clock className="w-6 h-6" />,
      color: 'bg-amber-500',
    },
  ] : [];

  return (
    <div className="min-h-screen bg-slate-50">
      <Header onDataChange={loadData} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-slate-800">Statistiques</h1>
          <select
            value={deviseAffichage}
            onChange={(e) => setDeviseAffichage(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            {parametres.devises.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        {/* Filtres */}
        <div className="bg-white rounded-xl border border-slate-200 mb-6">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-slate-500" />
              <span className="font-medium text-slate-700">Filtres</span>
              {(selectedPlateforme || selectedStatut || selectedPropriete || selectedLangue) && (
                <span className="px-2 py-0.5 bg-primary-100 text-primary-700 rounded-full text-xs">
                  {[selectedPlateforme, selectedStatut, selectedPropriete, selectedLangue].filter(Boolean).length} actif(s)
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
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
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
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Propriété
                  </label>
                  <select
                    value={selectedPropriete}
                    onChange={(e) => setSelectedPropriete(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">Toutes</option>
                    {proprietesUtilisees.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Langue
                  </label>
                  <select
                    value={selectedLangue}
                    onChange={(e) => setSelectedLangue(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">Toutes</option>
                    {languesUtilisees.map((l) => (
                      <option key={l} value={l}>{l}</option>
                    ))}
                  </select>
                </div>
              </div>
              {(selectedPlateforme || selectedStatut || selectedPropriete || selectedLangue) && (
                <button
                  onClick={() => {
                    setSelectedPlateforme('');
                    setSelectedStatut('');
                    setSelectedPropriete('');
                    setSelectedLangue('');
                  }}
                  className="mt-4 text-sm text-primary-600 hover:text-primary-700"
                >
                  Réinitialiser les filtres
                </button>
              )}
            </div>
          )}
        </div>

        {filteredCampagnes.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <div className="text-6xl mb-4">📊</div>
            <h3 className="text-lg font-medium text-slate-800 mb-2">
              {campagnes.length === 0 ? 'Aucune donnée' : 'Aucune campagne trouvée'}
            </h3>
            <p className="text-slate-500">
              {campagnes.length === 0
                ? 'Ajoutez des campagnes pour voir les statistiques.'
                : 'Essayez de modifier vos filtres de recherche.'}
            </p>
          </div>
        ) : (
          <>
            {/* Cartes de statistiques */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              {statCards.map((card, index) => (
                <div
                  key={index}
                  className="bg-white rounded-xl border border-slate-200 p-4 flex items-start gap-4"
                >
                  <div className={`${card.color} text-white p-3 rounded-lg`}>
                    {card.icon}
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">{card.label}</p>
                    <p className="text-2xl font-bold text-slate-800">{card.value}</p>
                    {card.subValue && (
                      <p className="text-xs text-slate-500 mt-1">{card.subValue}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Répartition par plateforme */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h2 className="text-lg font-semibold text-slate-800 mb-4">
                  Par plateforme
                </h2>
                <div className="space-y-3">
                  {stats && Object.entries(stats.parPlateforme)
                    .sort((a, b) => b[1].count - a[1].count)
                    .map(([plateforme, data]) => (
                      <div key={plateforme} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{
                              backgroundColor:
                                plateforme === 'Kickstarter' ? '#05ce78' :
                                plateforme === 'Gamefound' ? '#ff6b35' :
                                plateforme === 'BackerKit' ? '#4a90d9' :
                                plateforme === 'Indiegogo' ? '#eb1478' :
                                '#6b7280',
                            }}
                          />
                          <span className="text-slate-700">{plateforme}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-medium text-slate-800">
                            {data.count} campagne{data.count > 1 ? 's' : ''}
                          </span>
                          <span className="text-slate-500 text-sm ml-2">
                            ({formatMontant(data.total)})
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Répartition par statut */}
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h2 className="text-lg font-semibold text-slate-800 mb-4">
                  Par statut
                </h2>
                <div className="space-y-3">
                  {stats && Object.entries(stats.parStatut)
                    .sort((a, b) => b[1] - a[1])
                    .map(([statut, count]) => {
                      const percentage = (count / stats.nombreTotal) * 100;
                      return (
                        <div key={statut}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-slate-700">{statut}</span>
                            <span className="font-medium text-slate-800">
                              {count} ({percentage.toFixed(0)}%)
                            </span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-2">
                            <div
                              className="h-2 rounded-full transition-all"
                              style={{
                                width: `${percentage}%`,
                                backgroundColor:
                                  statut === 'Livré' ? '#10b981' :
                                  statut === 'En cours' ? '#3b82f6' :
                                  statut === 'Financé' ? '#22c55e' :
                                  statut === 'En production' ? '#eab308' :
                                  statut === 'Expédié' ? '#8b5cf6' :
                                  statut === 'Annulé' ? '#ef4444' :
                                  statut === 'Remboursé' ? '#6b7280' :
                                  '#94a3b8',
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>

            {/* Moyennes */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 mb-8">
              <h2 className="text-lg font-semibold text-slate-800 mb-4">
                Moyennes
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <p className="text-sm text-slate-500">Pledge moyen</p>
                  <p className="text-xl font-bold text-slate-800">
                    {stats && formatMontant(stats.moyennePledge)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Frais de port moyens</p>
                  <p className="text-xl font-bold text-slate-800">
                    {stats && formatMontant(stats.totalFraisPort / stats.nombreTotal)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Total moyen par campagne</p>
                  <p className="text-xl font-bold text-slate-800">
                    {stats && formatMontant(stats.totalDu / stats.nombreTotal)}
                  </p>
                </div>
              </div>
            </div>

            {/* Paiements par année */}
            {stats && Object.keys(stats.paiementsParAnnee).length > 0 && (
              <div className="bg-white rounded-xl border border-slate-200 p-6 mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <CreditCard className="w-5 h-5 text-slate-400" />
                  <h2 className="text-lg font-semibold text-slate-800">Paiements par année</h2>
                </div>
                <div className="space-y-3">
                  {Object.entries(stats.paiementsParAnnee)
                    .sort(([a], [b]) => Number(b) - Number(a))
                    .map(([annee, montant]) => (
                      <div key={annee} className="flex items-center justify-between">
                        <span className="text-slate-700 font-medium">{annee}</span>
                        <span className="text-lg font-bold text-green-600">{formatMontant(montant)}</span>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Livraisons prévues par année et Langues */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Livraisons par année */}
              {stats && Object.keys(stats.livraisonsParAnnee).length > 0 && (
                <div className="bg-white rounded-xl border border-slate-200 p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Calendar className="w-5 h-5 text-slate-400" />
                    <h2 className="text-lg font-semibold text-slate-800">Livraisons prévues par année</h2>
                  </div>
                  <div className="space-y-3">
                    {Object.entries(stats.livraisonsParAnnee)
                      .sort(([a], [b]) => Number(a) - Number(b))
                      .map(([annee, data]) => (
                        <div key={annee} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-slate-700 font-medium">{annee}</span>
                            <span className="text-xs text-slate-500">({data.count} jeu{data.count > 1 ? 'x' : ''})</span>
                          </div>
                          <span className="font-medium text-slate-800">{formatMontant(data.total)}</span>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Par langue */}
              {stats && Object.keys(stats.parLangue).length > 0 && (
                <div className="bg-white rounded-xl border border-slate-200 p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Globe className="w-5 h-5 text-slate-400" />
                    <h2 className="text-lg font-semibold text-slate-800">Par langue</h2>
                  </div>
                  <div className="space-y-3">
                    {Object.entries(stats.parLangue)
                      .sort((a, b) => b[1].count - a[1].count)
                      .map(([langue, data]) => {
                        const percentage = (data.count / stats.nombreTotal) * 100;
                        return (
                          <div key={langue}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-slate-700">{langue}</span>
                              <span className="text-sm">
                                <span className="font-medium text-slate-800">{data.count}</span>
                                <span className="text-slate-500 ml-1">({formatMontant(data.total)})</span>
                              </span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-2">
                              <div
                                className="h-2 rounded-full bg-primary-500 transition-all"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>

            {/* Top éditeurs et Alertes */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Top éditeurs */}
              {stats && stats.topEditeurs.length > 0 && (
                <div className="bg-white rounded-xl border border-slate-200 p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Building className="w-5 h-5 text-slate-400" />
                    <h2 className="text-lg font-semibold text-slate-800">Top 5 Éditeurs</h2>
                  </div>
                  <div className="space-y-3">
                    {stats.topEditeurs.map(([editeur, data], index) => (
                      <div key={editeur} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-sm font-bold">
                            {index + 1}
                          </span>
                          <span className="text-slate-700">{editeur}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-medium text-slate-800">{data.count} campagne{data.count > 1 ? 's' : ''}</span>
                          <span className="text-slate-500 text-sm ml-2">({formatMontant(data.total)})</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Alertes et infos */}
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Truck className="w-5 h-5 text-slate-400" />
                  <h2 className="text-lg font-semibold text-slate-800">Alertes & Informations</h2>
                </div>
                <div className="space-y-4">
                  {stats && stats.fraisPortNonRenseignes > 0 && (
                    <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                          <Truck className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-red-700">Frais de port non réglés</span>
                      </div>
                      <span className="text-lg font-bold text-red-700">{stats.fraisPortNonRenseignes}</span>
                    </div>
                  )}
                  {stats && stats.totalFinancementGlobal > 0 && (
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                          <TrendingUp className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-green-700">Financement total des campagnes</span>
                      </div>
                      <span className="text-lg font-bold text-green-700">{formatMontant(stats.totalFinancementGlobal)}</span>
                    </div>
                  )}
                  {stats && (
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                          <Package className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-blue-700">Taux de livraison</span>
                      </div>
                      <span className="text-lg font-bold text-blue-700">
                        {((stats.livrees / stats.nombreTotal) * 100).toFixed(0)}%
                      </span>
                    </div>
                  )}
                  {stats && stats.resteAPayer > 0 && (
                    <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                          <Clock className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-orange-700">Pourcentage payé</span>
                      </div>
                      <span className="text-lg font-bold text-orange-700">
                        {((stats.totalPaye / stats.totalDu) * 100).toFixed(0)}%
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
