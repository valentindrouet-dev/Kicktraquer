'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Header from '@/components/Header';
import { Campagne, Parametres, PARAMETRES_DEFAUT } from '@/types';
import { getCampagnes, getParametres } from '@/lib/storage';
import { getCampagnesSupabase, getParametresSupabase } from '@/lib/supabase-storage';
import { useAuth } from '@/contexts/AuthContext';
import { TrendingUp, Package, CreditCard, Clock, CheckCircle, Filter, ChevronDown, ChevronUp, Calendar, Truck, Globe, Building, Gamepad2, Users, DollarSign, AlertTriangle } from 'lucide-react';

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
        const c = await getCampagnesSupabase();
        const p = await getParametresSupabase();
        setCampagnes(c);
        setParametres(p);
      } else {
        const c = getCampagnes();
        const p = getParametres();
        setCampagnes(c);
        setParametres(p);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
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

  // Campagnes filtrées
  const filteredCampagnes = useMemo(() => {
    let result = [...campagnes];
    if (selectedPlateforme) result = result.filter((c) => c.plateforme === selectedPlateforme);
    if (selectedStatut) result = result.filter((c) => c.statut === selectedStatut);
    if (selectedPropriete) result = result.filter((c) => (c.propriete || 'Perso') === selectedPropriete);
    if (selectedLangue) result = result.filter((c) => c.langue === selectedLangue);
    return result;
  }, [campagnes, selectedPlateforme, selectedStatut, selectedPropriete, selectedLangue]);

  // Valeurs uniques pour les filtres
  const plateformesUtilisees = useMemo(() => Array.from(new Set(campagnes.map((c) => c.plateforme))).sort(), [campagnes]);
  const statutsUtilises = useMemo(() => Array.from(new Set(campagnes.map((c) => c.statut))).sort(), [campagnes]);
  const proprietesUtilisees = useMemo(() => Array.from(new Set(campagnes.map((c) => c.propriete || 'Perso'))).sort(), [campagnes]);
  const languesUtilisees = useMemo(() => Array.from(new Set(campagnes.map((c) => c.langue).filter(Boolean))).sort() as string[], [campagnes]);

  // Statistiques calculées
  const stats = useMemo(() => {
    if (filteredCampagnes.length === 0) return null;

    const parPlateforme: Record<string, { count: number; total: number }> = {};
    const parStatut: Record<string, number> = {};
    const parPropriete: Record<string, { count: number; total: number; paye: number }> = {};
    const paiementsParAnnee: Record<number, number> = {};
    const paiementsParType: Record<string, number> = {};
    const livraisonsParAnnee: Record<number, { count: number; total: number }> = {};
    const parLangue: Record<string, { count: number; total: number }> = {};
    const parEditeur: Record<string, { count: number; total: number }> = {};
    const campagnesAvecReste: { nom: string; reste: number; devise: string }[] = [];

    // Nouvelles stats
    const campagnesParAnnee: Record<number, number> = {};
    const campagnesParMois: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0, 11: 0, 12: 0 };
    const campagnesParJour: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
    const pledgeParAnnee: Record<number, { total: number; count: number }> = {};
    const pledgeRanges: Record<string, number> = { '0-50': 0, '50-100': 0, '100-200': 0, '200-500': 0, '500+': 0 };
    const topPledges: { nom: string; total: number }[] = [];
    const delaisLivraison: number[] = [];

    let totalPledge = 0, totalFraisPort = 0, totalAddons = 0, totalPaye = 0;
    let totalFinancementGlobal = 0, totalFigurines = 0, campagnesAvecFigurines = 0;
    let fraisPortNonRenseignes = 0, jeuxJoues = 0, jeuxNonJoues = 0;
    let campagnesAnnulees = 0, campagnesRemboursees = 0, campagnesRevendues = 0;

    filteredCampagnes.forEach((c) => {
      const multiplier = c.devise === deviseAffichage ? 1 :
        c.devise === 'USD' && deviseAffichage === 'EUR' ? 0.92 :
        c.devise === 'EUR' && deviseAffichage === 'USD' ? 1.09 :
        c.devise === 'GBP' && deviseAffichage === 'EUR' ? 1.17 :
        c.devise === 'EUR' && deviseAffichage === 'GBP' ? 0.85 : 1;

      const pledgeConverti = c.prixPledge * multiplier;
      const portConverti = c.fraisPort * multiplier;
      const addonsConverti = (c.addons || []).reduce((sum, a) => sum + (a.prix * a.quantite), 0) * multiplier;
      const totalCampagne = pledgeConverti + portConverti + addonsConverti;
      const payeCampagne = c.paiements.reduce((sum, p) => sum + p.montant, 0) * multiplier;

      totalPledge += pledgeConverti;
      totalFraisPort += portConverti;
      totalAddons += addonsConverti;

      if (c.financementTotal) totalFinancementGlobal += c.financementTotal * multiplier;
      if (!c.fraisPort || c.fraisPort === 0) fraisPortNonRenseignes++;
      if (c.nombreFigurines && c.nombreFigurines > 0) { totalFigurines += c.nombreFigurines; campagnesAvecFigurines++; }
      if (c.dejaJoue) jeuxJoues++; else jeuxNonJoues++;
      if (c.statut === 'Annulé') campagnesAnnulees++;
      if (c.statut === 'Remboursé') campagnesRemboursees++;
      if (c.statut === 'Revendu') campagnesRevendues++;

      // Campagnes par année (date de fin de campagne)
      if (c.dateFinCampagne) {
        const anneeFinCampagne = new Date(c.dateFinCampagne).getFullYear();
        campagnesParAnnee[anneeFinCampagne] = (campagnesParAnnee[anneeFinCampagne] || 0) + 1;

        // Pledge moyen par année
        if (!pledgeParAnnee[anneeFinCampagne]) pledgeParAnnee[anneeFinCampagne] = { total: 0, count: 0 };
        pledgeParAnnee[anneeFinCampagne].total += pledgeConverti;
        pledgeParAnnee[anneeFinCampagne].count++;

        // Mois de financement
        const mois = new Date(c.dateFinCampagne).getMonth() + 1;
        campagnesParMois[mois]++;

        // Jour de la semaine
        const jour = new Date(c.dateFinCampagne).getDay();
        campagnesParJour[jour]++;
      }

      // Délai de livraison (entre dateFinCampagne et dateLivraisonReelle si livré)
      if (c.statut === 'Livré' && c.dateFinCampagne && c.dateLivraisonReelle) {
        const debut = new Date(c.dateFinCampagne);
        const fin = new Date(c.dateLivraisonReelle);
        const delaiMois = (fin.getFullYear() - debut.getFullYear()) * 12 + (fin.getMonth() - debut.getMonth());
        if (delaiMois > 0) delaisLivraison.push(delaiMois);
      }

      // Distribution des pledges
      if (pledgeConverti < 50) pledgeRanges['0-50']++;
      else if (pledgeConverti < 100) pledgeRanges['50-100']++;
      else if (pledgeConverti < 200) pledgeRanges['100-200']++;
      else if (pledgeConverti < 500) pledgeRanges['200-500']++;
      else pledgeRanges['500+']++;

      // Top pledges
      topPledges.push({ nom: c.nomJeu, total: totalCampagne });

      // Reste à payer par campagne
      const resteCampagne = totalCampagne - payeCampagne;
      if (resteCampagne > 0.01) {
        campagnesAvecReste.push({ nom: c.nomJeu, reste: resteCampagne, devise: deviseAffichage });
      }

      // Paiements
      c.paiements.forEach((p) => {
        const annee = new Date(p.date).getFullYear();
        const montantConverti = p.montant * multiplier;
        paiementsParAnnee[annee] = (paiementsParAnnee[annee] || 0) + montantConverti;
        paiementsParType[p.type] = (paiementsParType[p.type] || 0) + montantConverti;
        totalPaye += montantConverti;
      });

      // Par plateforme
      if (!parPlateforme[c.plateforme]) parPlateforme[c.plateforme] = { count: 0, total: 0 };
      parPlateforme[c.plateforme].count++;
      parPlateforme[c.plateforme].total += totalCampagne;

      // Par statut
      parStatut[c.statut] = (parStatut[c.statut] || 0) + 1;

      // Par propriété
      const prop = c.propriete || 'Perso';
      if (!parPropriete[prop]) parPropriete[prop] = { count: 0, total: 0, paye: 0 };
      parPropriete[prop].count++;
      parPropriete[prop].total += totalCampagne;
      parPropriete[prop].paye += payeCampagne;

      // Par année de livraison
      if (c.anneeLivraison) {
        if (!livraisonsParAnnee[c.anneeLivraison]) livraisonsParAnnee[c.anneeLivraison] = { count: 0, total: 0 };
        livraisonsParAnnee[c.anneeLivraison].count++;
        livraisonsParAnnee[c.anneeLivraison].total += totalCampagne;
      }

      // Par langue
      const langue = c.langue || 'Non spécifiée';
      if (!parLangue[langue]) parLangue[langue] = { count: 0, total: 0 };
      parLangue[langue].count++;
      parLangue[langue].total += totalCampagne;

      // Par éditeur
      if (!parEditeur[c.editeur]) parEditeur[c.editeur] = { count: 0, total: 0 };
      parEditeur[c.editeur].count++;
      parEditeur[c.editeur].total += totalCampagne;
    });

    const totalDu = totalPledge + totalFraisPort + totalAddons;
    const resteAPayer = totalDu - totalPaye;
    const livrees = filteredCampagnes.filter((c) => c.statut === 'Livré').length;
    const enAttente = filteredCampagnes.filter((c) => !['Livré', 'Annulé', 'Remboursé', 'Revendu'].includes(c.statut)).length;
    const topEditeurs = Object.entries(parEditeur).sort((a, b) => b[1].count - a[1].count).slice(0, 5);
    campagnesAvecReste.sort((a, b) => b.reste - a.reste);

    // Top 5 pledges les plus élevés
    topPledges.sort((a, b) => b.total - a.total);
    const top5Pledges = topPledges.slice(0, 5);

    // Mois les plus actifs
    const moisNoms = ['', 'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
    const joursNoms = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

    const topMois = Object.entries(campagnesParMois)
      .map(([m, count]) => ({ mois: moisNoms[parseInt(m)], count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);

    const topJours = Object.entries(campagnesParJour)
      .map(([j, count]) => ({ jour: joursNoms[parseInt(j)], count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);

    // Délai moyen de livraison
    const delaiMoyenLivraison = delaisLivraison.length > 0
      ? delaisLivraison.reduce((a, b) => a + b, 0) / delaisLivraison.length
      : null;

    // Évolution pledge moyen par année
    const pledgeMoyenParAnnee = Object.entries(pledgeParAnnee)
      .map(([annee, data]) => ({ annee: parseInt(annee), moyenne: data.total / data.count }))
      .sort((a, b) => a.annee - b.annee);

    // Ratio addons/pledge
    const ratioAddons = totalPledge > 0 ? (totalAddons / totalPledge) * 100 : 0;
    const ratioFraisPort = totalPledge > 0 ? (totalFraisPort / totalPledge) * 100 : 0;

    // Première et dernière campagne
    const campagnesAvecDate = filteredCampagnes.filter(c => c.dateFinCampagne);
    const datesSorted = campagnesAvecDate.sort((a, b) => new Date(a.dateFinCampagne!).getTime() - new Date(b.dateFinCampagne!).getTime());
    const premiereCampagne = datesSorted.length > 0 ? datesSorted[0] : null;
    const derniereCampagne = datesSorted.length > 0 ? datesSorted[datesSorted.length - 1] : null;

    // Années d'activité
    const anneesActives = Object.keys(campagnesParAnnee).length;

    return {
      nombreTotal: filteredCampagnes.length,
      totalPledge, totalFraisPort, totalAddons, totalDu, totalPaye, resteAPayer,
      parPlateforme, parStatut, parPropriete, paiementsParAnnee, paiementsParType,
      livraisonsParAnnee, parLangue, topEditeurs, campagnesAvecReste,
      totalFinancementGlobal, totalFigurines, campagnesAvecFigurines,
      fraisPortNonRenseignes, livrees, enAttente, jeuxJoues, jeuxNonJoues,
      moyennePledge: totalPledge / filteredCampagnes.length,
      prixParFigurine: campagnesAvecFigurines > 0 ? totalPledge / totalFigurines : 0,
      // Nouvelles stats
      campagnesParAnnee, campagnesParMois, campagnesParJour, pledgeRanges, top5Pledges,
      topMois, topJours, delaiMoyenLivraison, pledgeMoyenParAnnee,
      campagnesAnnulees, campagnesRemboursees, campagnesRevendues,
      ratioAddons, ratioFraisPort, premiereCampagne, derniereCampagne, anneesActives,
    };
  }, [filteredCampagnes, deviseAffichage]);

  const formatMontant = (montant: number) => {
    const symbols: Record<string, string> = { EUR: '€', USD: '$', GBP: '£' };
    return `${montant.toFixed(2)} ${symbols[deviseAffichage] || deviseAffichage}`;
  };

  const formatMontantShort = (montant: number) => {
    const symbols: Record<string, string> = { EUR: '€', USD: '$', GBP: '£' };
    if (montant >= 1000) return `${(montant / 1000).toFixed(1)}k ${symbols[deviseAffichage]}`;
    return `${montant.toFixed(0)} ${symbols[deviseAffichage]}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header onDataChange={loadData} />

      <main className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-slate-800">Statistiques</h1>
          <select
            value={deviseAffichage}
            onChange={(e) => setDeviseAffichage(e.target.value)}
            className="px-2 py-1 text-sm border border-slate-300 rounded-lg"
          >
            {parametres.devises.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>

        {/* Filtres */}
        <div className="bg-white rounded-lg border border-slate-200 mb-4">
          <button onClick={() => setShowFilters(!showFilters)} className="w-full flex items-center justify-between p-3 hover:bg-slate-50">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-500" />
              <span className="text-sm font-medium text-slate-700">Filtres</span>
              {(selectedPlateforme || selectedStatut || selectedPropriete || selectedLangue) && (
                <span className="px-1.5 py-0.5 bg-primary-100 text-primary-700 rounded-full text-xs">
                  {[selectedPlateforme, selectedStatut, selectedPropriete, selectedLangue].filter(Boolean).length}
                </span>
              )}
            </div>
            {showFilters ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </button>
          {showFilters && (
            <div className="p-3 pt-0 border-t border-slate-200">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3">
                <select value={selectedPlateforme} onChange={(e) => setSelectedPlateforme(e.target.value)} className="text-sm px-2 py-1.5 border border-slate-300 rounded-lg">
                  <option value="">Plateforme</option>
                  {plateformesUtilisees.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
                <select value={selectedStatut} onChange={(e) => setSelectedStatut(e.target.value)} className="text-sm px-2 py-1.5 border border-slate-300 rounded-lg">
                  <option value="">Statut</option>
                  {statutsUtilises.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <select value={selectedPropriete} onChange={(e) => setSelectedPropriete(e.target.value)} className="text-sm px-2 py-1.5 border border-slate-300 rounded-lg">
                  <option value="">Propriété</option>
                  {proprietesUtilisees.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
                <select value={selectedLangue} onChange={(e) => setSelectedLangue(e.target.value)} className="text-sm px-2 py-1.5 border border-slate-300 rounded-lg">
                  <option value="">Langue</option>
                  {languesUtilisees.map((l) => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              {(selectedPlateforme || selectedStatut || selectedPropriete || selectedLangue) && (
                <button onClick={() => { setSelectedPlateforme(''); setSelectedStatut(''); setSelectedPropriete(''); setSelectedLangue(''); }} className="mt-2 text-xs text-primary-600 hover:text-primary-700">
                  Réinitialiser
                </button>
              )}
            </div>
          )}
        </div>

        {filteredCampagnes.length === 0 ? (
          <div className="bg-white rounded-lg border border-slate-200 p-8 text-center">
            <div className="text-4xl mb-3">📊</div>
            <h3 className="text-base font-medium text-slate-800">{campagnes.length === 0 ? 'Aucune donnée' : 'Aucune campagne trouvée'}</h3>
          </div>
        ) : stats && (
          <>
            {/* Cartes principales - Grille compacte */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2 mb-4">
              <StatCard icon={<Package className="w-4 h-4" />} label="Campagnes" value={stats.nombreTotal.toString()} color="bg-blue-500" />
              <StatCard icon={<TrendingUp className="w-4 h-4" />} label="Total engagé" value={formatMontantShort(stats.totalDu)} color="bg-green-500" />
              <StatCard icon={<CreditCard className="w-4 h-4" />} label="Total payé" value={formatMontantShort(stats.totalPaye)} color="bg-emerald-500" />
              <StatCard icon={<Clock className="w-4 h-4" />} label="Reste à payer" value={formatMontantShort(stats.resteAPayer)} color={stats.resteAPayer > 0 ? 'bg-orange-500' : 'bg-green-500'} />
              <StatCard icon={<CheckCircle className="w-4 h-4" />} label="Livrées" value={`${stats.livrees}/${stats.nombreTotal}`} color="bg-emerald-500" />
              <StatCard icon={<Gamepad2 className="w-4 h-4" />} label="Déjà joués" value={`${stats.jeuxJoues}/${stats.nombreTotal}`} color="bg-purple-500" />
            </div>

            {/* Détails financiers */}
            <div className="bg-white rounded-lg border border-slate-200 p-3 mb-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div><span className="text-slate-500">Pledges:</span> <span className="font-medium">{formatMontant(stats.totalPledge)}</span></div>
                <div><span className="text-slate-500">Add-ons:</span> <span className="font-medium">{formatMontant(stats.totalAddons)}</span></div>
                <div><span className="text-slate-500">Frais port:</span> <span className="font-medium">{formatMontant(stats.totalFraisPort)}</span></div>
                <div><span className="text-slate-500">Pledge moyen:</span> <span className="font-medium">{formatMontant(stats.moyennePledge)}</span></div>
              </div>
            </div>

            {/* Statistiques par Propriété */}
            {Object.keys(stats.parPropriete).length > 0 && (
              <div className="bg-white rounded-lg border border-slate-200 p-3 mb-4">
                <h2 className="text-sm font-semibold text-slate-800 mb-2 flex items-center gap-1">
                  <Users className="w-4 h-4 text-slate-400" /> Par propriété
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {Object.entries(stats.parPropriete).map(([prop, data]) => (
                    <div key={prop} className={`p-2 rounded-lg ${prop === 'BGG' ? 'bg-amber-50' : 'bg-sky-50'}`}>
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-sm">{prop}</span>
                        <span className="text-xs text-slate-600">{data.count} jeux</span>
                      </div>
                      <div className="flex justify-between text-xs mt-1">
                        <span>Engagé: {formatMontantShort(data.total)}</span>
                        <span>Payé: {formatMontantShort(data.paye)}</span>
                        <span className={data.total - data.paye > 0 ? 'text-orange-600' : 'text-green-600'}>
                          Reste: {formatMontantShort(data.total - data.paye)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reste à payer - Détail par campagne */}
            {stats.campagnesAvecReste.length > 0 && (
              <div className="bg-white rounded-lg border border-slate-200 p-3 mb-4">
                <h2 className="text-sm font-semibold text-slate-800 mb-2 flex items-center gap-1">
                  <AlertTriangle className="w-4 h-4 text-orange-500" /> Reste à payer ({stats.campagnesAvecReste.length} campagnes)
                </h2>
                <div className="max-h-40 overflow-y-auto">
                  <div className="space-y-1">
                    {stats.campagnesAvecReste.map((c, i) => (
                      <div key={i} className="flex justify-between items-center text-sm py-1 border-b border-slate-100 last:border-0">
                        <span className="text-slate-700 truncate flex-1 mr-2">{c.nom}</span>
                        <span className="font-medium text-orange-600 whitespace-nowrap">{formatMontant(c.reste)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
              {/* Par plateforme */}
              <div className="bg-white rounded-lg border border-slate-200 p-3">
                <h2 className="text-sm font-semibold text-slate-800 mb-2">Par plateforme</h2>
                <div className="space-y-1.5">
                  {Object.entries(stats.parPlateforme).sort((a, b) => b[1].count - a[1].count).map(([plateforme, data]) => (
                    <div key={plateforme} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: plateforme === 'Kickstarter' ? '#05ce78' : plateforme === 'Gamefound' ? '#ff6b35' : plateforme === 'BackerKit' ? '#4a90d9' : '#6b7280' }} />
                        <span>{plateforme}</span>
                      </div>
                      <span className="text-slate-600">{data.count} <span className="text-slate-400">({formatMontantShort(data.total)})</span></span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Par statut */}
              <div className="bg-white rounded-lg border border-slate-200 p-3">
                <h2 className="text-sm font-semibold text-slate-800 mb-2">Par statut</h2>
                <div className="space-y-1.5">
                  {Object.entries(stats.parStatut).sort((a, b) => b[1] - a[1]).map(([statut, count]) => {
                    const pct = (count / stats.nombreTotal) * 100;
                    return (
                      <div key={statut}>
                        <div className="flex justify-between text-sm mb-0.5">
                          <span>{statut}</span>
                          <span className="text-slate-600">{count} ({pct.toFixed(0)}%)</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5">
                          <div className="h-1.5 rounded-full" style={{ width: `${pct}%`, backgroundColor: statut === 'À venir' ? '#06b6d4' : statut === 'Livré' ? '#10b981' : statut === 'En cours' ? '#3b82f6' : statut === 'Financé' ? '#22c55e' : statut === 'En production' ? '#eab308' : statut === 'Expédié' ? '#8b5cf6' : statut === 'Annulé' ? '#ef4444' : statut === 'Revendu' ? '#f97316' : '#6b7280' }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
              {/* Paiements par année */}
              {Object.keys(stats.paiementsParAnnee).length > 0 && (
                <div className="bg-white rounded-lg border border-slate-200 p-3">
                  <h2 className="text-sm font-semibold text-slate-800 mb-2 flex items-center gap-1">
                    <CreditCard className="w-4 h-4 text-slate-400" /> Paiements/année
                  </h2>
                  <div className="space-y-1">
                    {Object.entries(stats.paiementsParAnnee).sort(([a], [b]) => Number(b) - Number(a)).map(([annee, montant]) => (
                      <div key={annee} className="flex justify-between text-sm">
                        <span>{annee}</span>
                        <span className="font-medium text-green-600">{formatMontant(montant)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Paiements par type */}
              {Object.keys(stats.paiementsParType).length > 0 && (
                <div className="bg-white rounded-lg border border-slate-200 p-3">
                  <h2 className="text-sm font-semibold text-slate-800 mb-2 flex items-center gap-1">
                    <DollarSign className="w-4 h-4 text-slate-400" /> Paiements/type
                  </h2>
                  <div className="space-y-1">
                    {Object.entries(stats.paiementsParType).sort((a, b) => b[1] - a[1]).map(([type, montant]) => (
                      <div key={type} className="flex justify-between text-sm">
                        <span className="truncate mr-2">{type}</span>
                        <span className="font-medium whitespace-nowrap">{formatMontant(montant)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Livraisons par année */}
              {Object.keys(stats.livraisonsParAnnee).length > 0 && (
                <div className="bg-white rounded-lg border border-slate-200 p-3">
                  <h2 className="text-sm font-semibold text-slate-800 mb-2 flex items-center gap-1">
                    <Calendar className="w-4 h-4 text-slate-400" /> Livraisons prévues
                  </h2>
                  <div className="space-y-1">
                    {Object.entries(stats.livraisonsParAnnee).sort(([a], [b]) => Number(a) - Number(b)).map(([annee, data]) => (
                      <div key={annee} className="flex justify-between text-sm">
                        <span>{annee} <span className="text-slate-400">({data.count})</span></span>
                        <span className="font-medium">{formatMontantShort(data.total)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
              {/* Par langue */}
              <div className="bg-white rounded-lg border border-slate-200 p-3">
                <h2 className="text-sm font-semibold text-slate-800 mb-2 flex items-center gap-1">
                  <Globe className="w-4 h-4 text-slate-400" /> Par langue
                </h2>
                <div className="space-y-1">
                  {Object.entries(stats.parLangue).sort((a, b) => b[1].count - a[1].count).map(([langue, data]) => (
                    <div key={langue} className="flex justify-between text-sm">
                      <span>{langue}</span>
                      <span className="text-slate-600">{data.count} <span className="text-slate-400">({formatMontantShort(data.total)})</span></span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top éditeurs */}
              <div className="bg-white rounded-lg border border-slate-200 p-3">
                <h2 className="text-sm font-semibold text-slate-800 mb-2 flex items-center gap-1">
                  <Building className="w-4 h-4 text-slate-400" /> Top éditeurs
                </h2>
                <div className="space-y-1">
                  {stats.topEditeurs.map(([editeur, data], i) => (
                    <div key={editeur} className="flex justify-between text-sm">
                      <span className="truncate mr-2"><span className="text-primary-600 font-medium">{i + 1}.</span> {editeur}</span>
                      <span className="text-slate-600 whitespace-nowrap">{data.count}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Alertes */}
              <div className="bg-white rounded-lg border border-slate-200 p-3">
                <h2 className="text-sm font-semibold text-slate-800 mb-2 flex items-center gap-1">
                  <Truck className="w-4 h-4 text-slate-400" /> Infos
                </h2>
                <div className="space-y-1.5 text-sm">
                  {stats.fraisPortNonRenseignes > 0 && (
                    <div className="flex justify-between p-1.5 bg-red-50 rounded">
                      <span className="text-red-700">FP non réglés</span>
                      <span className="font-medium text-red-700">{stats.fraisPortNonRenseignes}</span>
                    </div>
                  )}
                  <div className="flex justify-between p-1.5 bg-blue-50 rounded">
                    <span className="text-blue-700">Taux livraison</span>
                    <span className="font-medium text-blue-700">{((stats.livrees / stats.nombreTotal) * 100).toFixed(0)}%</span>
                  </div>
                  {stats.totalFigurines > 0 && (
                    <>
                      <div className="flex justify-between p-1.5 bg-purple-50 rounded">
                        <span className="text-purple-700">Total figurines</span>
                        <span className="font-medium text-purple-700">{stats.totalFigurines.toLocaleString('fr-FR')}</span>
                      </div>
                      <div className="flex justify-between p-1.5 bg-purple-50 rounded">
                        <span className="text-purple-700">Prix/figurine</span>
                        <span className="font-medium text-purple-700">{formatMontant(stats.prixParFigurine)}</span>
                      </div>
                    </>
                  )}
                  {stats.totalFinancementGlobal > 0 && (
                    <div className="flex justify-between p-1.5 bg-green-50 rounded">
                      <span className="text-green-700">Financements totaux</span>
                      <span className="font-medium text-green-700">{formatMontantShort(stats.totalFinancementGlobal)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* NOUVELLES STATISTIQUES */}
            <h2 className="text-lg font-bold text-slate-800 mb-3 mt-6">📈 Analyses avancées</h2>

            {/* Campagnes par année + Périodes */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
              {/* Campagnes par année */}
              {Object.keys(stats.campagnesParAnnee).length > 0 && (
                <div className="bg-white rounded-lg border border-slate-200 p-3">
                  <h2 className="text-sm font-semibold text-slate-800 mb-2 flex items-center gap-1">
                    <Calendar className="w-4 h-4 text-slate-400" /> Campagnes par année
                  </h2>
                  <div className="space-y-1.5">
                    {Object.entries(stats.campagnesParAnnee).sort(([a], [b]) => Number(b) - Number(a)).map(([annee, count]) => {
                      const maxCount = Math.max(...Object.values(stats.campagnesParAnnee));
                      const pct = (count / maxCount) * 100;
                      return (
                        <div key={annee}>
                          <div className="flex justify-between text-sm mb-0.5">
                            <span className="font-medium">{annee}</span>
                            <span className="text-slate-600">{count} campagne{count > 1 ? 's' : ''}</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-1.5">
                            <div className="h-1.5 rounded-full bg-primary-500" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Mois les plus actifs */}
              <div className="bg-white rounded-lg border border-slate-200 p-3">
                <h2 className="text-sm font-semibold text-slate-800 mb-2">🗓️ Mois les plus actifs</h2>
                <div className="space-y-2">
                  {stats.topMois.filter(m => m.count > 0).map((m, i) => (
                    <div key={m.mois} className="flex items-center gap-2">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-yellow-400 text-yellow-900' : i === 1 ? 'bg-slate-300 text-slate-700' : 'bg-amber-600 text-white'}`}>
                        {i + 1}
                      </span>
                      <span className="text-sm flex-1">{m.mois}</span>
                      <span className="text-sm text-slate-600">{m.count} campagnes</span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 pt-3 border-t border-slate-100">
                  <h3 className="text-xs font-medium text-slate-500 mb-2">Répartition mensuelle</h3>
                  <div className="flex gap-0.5 h-8">
                    {Object.entries(stats.campagnesParMois).map(([mois, count]) => {
                      const maxMois = Math.max(...Object.values(stats.campagnesParMois));
                      const pct = maxMois > 0 ? (count / maxMois) * 100 : 0;
                      const moisNoms = ['', 'J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
                      return (
                        <div key={mois} className="flex-1 flex flex-col items-center justify-end" title={`${count} en ${moisNoms[parseInt(mois)]}`}>
                          <div className="w-full bg-primary-400 rounded-t" style={{ height: `${pct}%`, minHeight: count > 0 ? '4px' : '0' }} />
                          <span className="text-[8px] text-slate-400 mt-0.5">{moisNoms[parseInt(mois)]}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Jour de la semaine */}
              <div className="bg-white rounded-lg border border-slate-200 p-3">
                <h2 className="text-sm font-semibold text-slate-800 mb-2">📅 Jours préférés</h2>
                <div className="space-y-2 mb-3">
                  {stats.topJours.filter(j => j.count > 0).map((j, i) => (
                    <div key={j.jour} className="flex items-center gap-2">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-yellow-400 text-yellow-900' : i === 1 ? 'bg-slate-300 text-slate-700' : 'bg-amber-600 text-white'}`}>
                        {i + 1}
                      </span>
                      <span className="text-sm flex-1">{j.jour}</span>
                      <span className="text-sm text-slate-600">{j.count}</span>
                    </div>
                  ))}
                </div>
                <div className="pt-3 border-t border-slate-100">
                  <div className="flex gap-1 h-10">
                    {(() => {
                      // Réorganiser les jours: Lundi (1) à Dimanche (0)
                      const joursOrdre = [1, 2, 3, 4, 5, 6, 0];
                      const joursLabels = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
                      const joursData = joursOrdre.map(idx => stats.campagnesParJour[idx] || 0);
                      const maxJour = Math.max(...joursData, 1);

                      return joursLabels.map((label, i) => {
                        const count = joursData[i];
                        const pct = (count / maxJour) * 100;
                        return (
                          <div key={i} className="flex-1 flex flex-col items-center justify-end">
                            <div className="w-full bg-cyan-400 rounded-t" style={{ height: `${pct}%`, minHeight: count > 0 ? '4px' : '0' }} />
                            <span className="text-[9px] text-slate-500 mt-0.5">{label}</span>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
              </div>
            </div>

            {/* Distribution pledges + Top 5 + Évolution */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
              {/* Distribution des pledges */}
              <div className="bg-white rounded-lg border border-slate-200 p-3">
                <h2 className="text-sm font-semibold text-slate-800 mb-2">💰 Distribution des pledges</h2>
                <div className="space-y-1.5">
                  {Object.entries(stats.pledgeRanges).map(([range, count]) => {
                    const pct = (count / stats.nombreTotal) * 100;
                    const colors: Record<string, string> = {
                      '0-50': 'bg-green-400',
                      '50-100': 'bg-lime-400',
                      '100-200': 'bg-yellow-400',
                      '200-500': 'bg-orange-400',
                      '500+': 'bg-red-400',
                    };
                    return (
                      <div key={range}>
                        <div className="flex justify-between text-sm mb-0.5">
                          <span>{range}€</span>
                          <span className="text-slate-600">{count} ({pct.toFixed(0)}%)</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5">
                          <div className={`h-1.5 rounded-full ${colors[range]}`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Top 5 pledges */}
              <div className="bg-white rounded-lg border border-slate-200 p-3">
                <h2 className="text-sm font-semibold text-slate-800 mb-2">🏆 Top 5 plus gros pledges</h2>
                <div className="space-y-1.5">
                  {stats.top5Pledges.map((p, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${i === 0 ? 'bg-yellow-400 text-yellow-900' : i === 1 ? 'bg-slate-300 text-slate-700' : i === 2 ? 'bg-amber-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                        {i + 1}
                      </span>
                      <span className="text-sm truncate flex-1">{p.nom}</span>
                      <span className="text-sm font-medium text-primary-600 whitespace-nowrap">{formatMontant(p.total)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Évolution pledge moyen */}
              {stats.pledgeMoyenParAnnee.length > 0 && (
                <div className="bg-white rounded-lg border border-slate-200 p-3">
                  <h2 className="text-sm font-semibold text-slate-800 mb-2">📊 Évolution pledge moyen</h2>
                  <div className="space-y-1.5">
                    {stats.pledgeMoyenParAnnee.map((p) => (
                      <div key={p.annee} className="flex justify-between text-sm">
                        <span>{p.annee}</span>
                        <span className="font-medium">{formatMontant(p.moyenne)}</span>
                      </div>
                    ))}
                  </div>
                  {stats.pledgeMoyenParAnnee.length >= 2 && (
                    <div className="mt-2 pt-2 border-t border-slate-100">
                      <div className="text-xs text-slate-500">
                        {(() => {
                          const first = stats.pledgeMoyenParAnnee[0].moyenne;
                          const last = stats.pledgeMoyenParAnnee[stats.pledgeMoyenParAnnee.length - 1].moyenne;
                          const diff = ((last - first) / first) * 100;
                          return diff > 0
                            ? <span className="text-red-600">↑ +{diff.toFixed(0)}% depuis {stats.pledgeMoyenParAnnee[0].annee}</span>
                            : <span className="text-green-600">↓ {diff.toFixed(0)}% depuis {stats.pledgeMoyenParAnnee[0].annee}</span>;
                        })()}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Ratios et délais */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
              {/* Ratios financiers */}
              <div className="bg-white rounded-lg border border-slate-200 p-3">
                <h2 className="text-sm font-semibold text-slate-800 mb-2">📐 Ratios</h2>
                <div className="space-y-2">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-600">Add-ons / Pledge</span>
                      <span className="font-medium">{stats.ratioAddons.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div className="h-2 rounded-full bg-indigo-400" style={{ width: `${Math.min(stats.ratioAddons, 100)}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-600">Frais port / Pledge</span>
                      <span className="font-medium">{stats.ratioFraisPort.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div className="h-2 rounded-full bg-rose-400" style={{ width: `${Math.min(stats.ratioFraisPort, 100)}%` }} />
                    </div>
                  </div>
                  <div className="pt-2 border-t border-slate-100 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Taux annulation</span>
                      <span className={stats.campagnesAnnulees > 0 ? 'text-red-600 font-medium' : 'text-green-600'}>
                        {((stats.campagnesAnnulees / stats.nombreTotal) * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-slate-600">Taux revente</span>
                      <span className="text-orange-600">{((stats.campagnesRevendues / stats.nombreTotal) * 100).toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Délai de livraison */}
              <div className="bg-white rounded-lg border border-slate-200 p-3">
                <h2 className="text-sm font-semibold text-slate-800 mb-2">⏱️ Délais</h2>
                <div className="space-y-3">
                  {stats.delaiMoyenLivraison !== null && (
                    <div className="text-center p-3 bg-slate-50 rounded-lg">
                      <div className="text-3xl font-bold text-primary-600">{stats.delaiMoyenLivraison.toFixed(1)}</div>
                      <div className="text-xs text-slate-500">mois en moyenne entre fin de campagne et livraison</div>
                    </div>
                  )}
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Campagnes livrées</span>
                      <span className="font-medium">{stats.livrees}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">En attente</span>
                      <span className="font-medium">{stats.enAttente}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <div className="bg-white rounded-lg border border-slate-200 p-3">
                <h2 className="text-sm font-semibold text-slate-800 mb-2">🎯 Votre parcours</h2>
                <div className="space-y-3 text-sm">
                  <div className="p-2 bg-green-50 rounded">
                    <div className="text-xs text-green-600 mb-0.5">Première campagne</div>
                    {stats.premiereCampagne ? (
                      <>
                        <div className="font-medium text-green-800 truncate">{stats.premiereCampagne.nomJeu}</div>
                        <div className="text-xs text-green-600">
                          {stats.premiereCampagne.dateFinCampagne && new Date(stats.premiereCampagne.dateFinCampagne).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                        </div>
                      </>
                    ) : <span className="text-slate-400">-</span>}
                  </div>
                  <div className="p-2 bg-blue-50 rounded">
                    <div className="text-xs text-blue-600 mb-0.5">Dernière campagne</div>
                    {stats.derniereCampagne ? (
                      <>
                        <div className="font-medium text-blue-800 truncate">{stats.derniereCampagne.nomJeu}</div>
                        <div className="text-xs text-blue-600">
                          {stats.derniereCampagne.dateFinCampagne && new Date(stats.derniereCampagne.dateFinCampagne).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                        </div>
                      </>
                    ) : <span className="text-slate-400">-</span>}
                  </div>
                  <div className="text-center pt-2 border-t border-slate-100">
                    <span className="text-2xl font-bold text-primary-600">{stats.anneesActives}</span>
                    <span className="text-slate-500 ml-1">année{stats.anneesActives > 1 ? 's' : ''} d&apos;activité</span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

// Composant carte de statistique compacte
function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-2 flex items-center gap-2">
      <div className={`${color} text-white p-1.5 rounded`}>{icon}</div>
      <div className="min-w-0">
        <p className="text-xs text-slate-500 truncate">{label}</p>
        <p className="text-sm font-bold text-slate-800 truncate">{value}</p>
      </div>
    </div>
  );
}
