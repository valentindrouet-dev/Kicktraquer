'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Header from '@/components/Header';
import { Campagne, JeuAVenir, Parametres, PARAMETRES_DEFAUT } from '@/types';
import { getCampagnes, getParametres, getJeuxAVenir } from '@/lib/storage';
import { getCampagnesSupabase, getParametresSupabase } from '@/lib/supabase-storage';
import { useAuth } from '@/contexts/AuthContext';
import { Printer, FileText } from 'lucide-react';

const MOIS_NOMS = [
  '', 'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

function formatMontant(montant: number, devise: string): string {
  const symbols: Record<string, string> = { EUR: '€', USD: '$', GBP: '£', CAD: 'CA$', AUD: 'AU$' };
  return `${montant.toFixed(2)} ${symbols[devise] || devise}`;
}

function formatDate(date?: string): string {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function totalAddons(c: Campagne): number {
  return (c.addons || []).reduce((s, a) => s + a.prix * a.quantite, 0);
}
function totalDu(c: Campagne): number {
  return c.prixPledge + c.fraisPort + totalAddons(c);
}
function totalPaye(c: Campagne): number {
  return (c.paiements || []).reduce((s, p) => s + p.montant, 0);
}

export default function RapportPage() {
  const { user, loading: authLoading } = useAuth();
  const [campagnes, setCampagnes] = useState<Campagne[]>([]);
  const [parametres, setParametres] = useState<Parametres>(PARAMETRES_DEFAUT);
  const [jeuxAVenir, setJeuxAVenir] = useState<JeuAVenir[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [avecDetails, setAvecDetails] = useState(true);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      if (user) {
        const [c, p] = await Promise.all([getCampagnesSupabase(), getParametresSupabase()]);
        setCampagnes(c);
        setParametres(p);
      } else {
        setCampagnes(getCampagnes());
        setParametres(getParametres());
      }
      setJeuxAVenir(getJeuxAVenir());
    } catch (e) {
      console.error('Erreur chargement rapport:', e);
    }
    setIsLoading(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  useEffect(() => {
    if (!authLoading) loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user?.id]);

  // Synthèse + regroupement par année de fin de campagne
  const synthese = useMemo(() => {
    const total = campagnes.length;
    let engage = 0, paye = 0, reventes = 0;
    const parStatut: Record<string, number> = {};
    const parAnnee: Record<string, Campagne[]> = {};

    campagnes.forEach((c) => {
      engage += totalDu(c);
      paye += totalPaye(c);
      if (c.prixRevente) reventes += c.prixRevente;
      parStatut[c.statut] = (parStatut[c.statut] || 0) + 1;

      const annee = c.dateFinCampagne
        ? String(new Date(c.dateFinCampagne).getFullYear())
        : 'Sans date';
      if (!parAnnee[annee]) parAnnee[annee] = [];
      parAnnee[annee].push(c);
    });

    const anneesTriees = Object.keys(parAnnee).sort((a, b) => {
      if (a === 'Sans date') return 1;
      if (b === 'Sans date') return -1;
      return Number(a) - Number(b);
    });

    anneesTriees.forEach((a) => {
      parAnnee[a].sort((x, y) =>
        (x.dateFinCampagne || '').localeCompare(y.dateFinCampagne || '')
      );
    });

    return {
      total,
      engage,
      paye,
      reste: engage - paye,
      reventes,
      livrees: campagnes.filter(c => c.statut === 'Livré').length,
      revendues: campagnes.filter(c => c.statut === 'Revendu').length,
      jdr: campagnes.filter(c => c.jdr).length,
      print3d: campagnes.filter(c => c.print3d).length,
      joues: campagnes.filter(c => c.dejaJoue).length,
      fpNonPayes: campagnes.filter(c => !c.fraisPortPayes).length,
      parStatut,
      parAnnee,
      anneesTriees,
    };
  }, [campagnes]);

  const devisePrincipale = campagnes[0]?.devise || 'EUR';

  if (isLoading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="no-print">
        <Header onDataChange={loadData} />
      </div>

      <main className="max-w-5xl mx-auto px-4 py-6">
        {/* Barre d'actions - masquée à l'impression */}
        <div className="no-print bg-white rounded-xl border border-slate-200 p-4 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary-600" />
                Rapport complet
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Utilisez « Enregistrer au format PDF » comme destination d&apos;impression.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={avecDetails}
                  onChange={(e) => setAvecDetails(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-primary-500 focus:ring-primary-500"
                />
                Fiches détaillées
              </label>
              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
              >
                <Printer className="w-4 h-4" />
                Imprimer / PDF
              </button>
            </div>
          </div>
        </div>

        {/* ---------- Document imprimable ---------- */}
        <div className="print-root bg-white rounded-xl border border-slate-200 p-6 print:border-0 print:rounded-none print:p-0">
          {/* En-tête */}
          <div className="border-b-2 border-slate-800 pb-3 mb-5">
            <h1 className="text-2xl font-bold text-slate-900">Kicktraquer — Rapport complet</h1>
            <p className="text-sm text-slate-500 mt-1">
              Généré le {new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
              {' · '}{synthese.total} campagne{synthese.total > 1 ? 's' : ''}
              {' · '}Source : {user ? 'compte synchronisé' : 'données locales'}
            </p>
          </div>

          {/* Synthèse */}
          <section className="avoid-break mb-6">
            <h2 className="text-base font-bold text-slate-800 border-b border-slate-300 pb-1 mb-3">
              1. Synthèse
            </h2>
            <div className="grid grid-cols-3 gap-x-6 gap-y-1.5 text-sm">
              <Ligne label="Campagnes" valeur={String(synthese.total)} />
              <Ligne label="Total engagé" valeur={formatMontant(synthese.engage, devisePrincipale)} />
              <Ligne label="Total payé" valeur={formatMontant(synthese.paye, devisePrincipale)} />
              <Ligne label="Reste à payer" valeur={formatMontant(synthese.reste, devisePrincipale)} />
              <Ligne label="Livrées" valeur={`${synthese.livrees} / ${synthese.total}`} />
              <Ligne label="Déjà joués" valeur={`${synthese.joues} / ${synthese.total}`} />
              <Ligne label="Revendues" valeur={String(synthese.revendues)} />
              <Ligne label="Récupéré (reventes)" valeur={formatMontant(synthese.reventes, devisePrincipale)} />
              <Ligne label="Frais de port dus" valeur={String(synthese.fpNonPayes)} />
              <Ligne label="JDR / Livres" valeur={String(synthese.jdr)} />
              <Ligne label="3D Print" valeur={String(synthese.print3d)} />
              <Ligne label="Jeux à venir" valeur={String(jeuxAVenir.length)} />
            </div>

            <div className="mt-4">
              <h3 className="text-sm font-semibold text-slate-700 mb-1.5">Répartition par statut</h3>
              <div className="grid grid-cols-4 gap-x-6 gap-y-1 text-sm">
                {Object.entries(synthese.parStatut)
                  .sort((a, b) => b[1] - a[1])
                  .map(([statut, n]) => (
                    <Ligne key={statut} label={statut} valeur={String(n)} />
                  ))}
              </div>
            </div>
          </section>

          {/* Tableau récapitulatif par année */}
          <section className="mb-6">
            <h2 className="text-base font-bold text-slate-800 border-b border-slate-300 pb-1 mb-3">
              2. Campagnes par année
            </h2>

            {synthese.anneesTriees.map((annee) => {
              const liste = synthese.parAnnee[annee];
              const engageAnnee = liste.reduce((s, c) => s + totalDu(c), 0);
              const livreesAnnee = liste.filter(c => c.statut === 'Livré' || c.statut === 'Revendu').length;

              return (
                <div key={annee} className="avoid-break mb-5">
                  <div className="flex items-baseline justify-between bg-slate-100 px-2 py-1 rounded mb-1.5">
                    <span className="font-bold text-slate-800">{annee}</span>
                    <span className="text-xs text-slate-600">
                      {liste.length} campagne{liste.length > 1 ? 's' : ''}
                      {' · '}{formatMontant(engageAnnee, devisePrincipale)}
                      {' · '}{livreesAnnee}/{liste.length} reçues
                    </span>
                  </div>
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-300 text-left text-slate-600">
                        <th className="py-1 pr-2 font-semibold">Jeu</th>
                        <th className="py-1 pr-2 font-semibold">Éditeur</th>
                        <th className="py-1 pr-2 font-semibold">Statut</th>
                        <th className="py-1 pr-2 font-semibold">Fin</th>
                        <th className="py-1 pr-2 font-semibold text-right">Pledge</th>
                        <th className="py-1 pr-2 font-semibold text-right">FP</th>
                        <th className="py-1 pr-2 font-semibold text-right">Add-ons</th>
                        <th className="py-1 pr-2 font-semibold text-right">Total</th>
                        <th className="py-1 font-semibold text-right">Payé</th>
                      </tr>
                    </thead>
                    <tbody>
                      {liste.map((c) => (
                        <tr key={c.id} className="border-b border-slate-100">
                          <td className="py-1 pr-2 font-medium text-slate-800">
                            {c.nomJeu}
                            {c.jdr && <span className="ml-1 text-[9px] text-purple-600">JDR</span>}
                            {c.print3d && <span className="ml-1 text-[9px] text-cyan-600">3D</span>}
                          </td>
                          <td className="py-1 pr-2 text-slate-600">{c.editeur}</td>
                          <td className="py-1 pr-2 text-slate-600">{c.statut}</td>
                          <td className="py-1 pr-2 text-slate-600">{formatDate(c.dateFinCampagne)}</td>
                          <td className="py-1 pr-2 text-right">{c.prixPledge.toFixed(2)}</td>
                          <td className="py-1 pr-2 text-right">{c.fraisPort.toFixed(2)}</td>
                          <td className="py-1 pr-2 text-right">{totalAddons(c).toFixed(2)}</td>
                          <td className="py-1 pr-2 text-right font-semibold">{totalDu(c).toFixed(2)}</td>
                          <td className="py-1 text-right">{totalPaye(c).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })}
          </section>

          {/* Fiches détaillées */}
          {avecDetails && (
            <section className="mb-6">
              <h2 className="text-base font-bold text-slate-800 border-b border-slate-300 pb-1 mb-3">
                3. Fiches détaillées
              </h2>
              {campagnes
                .slice()
                .sort((a, b) => a.nomJeu.localeCompare(b.nomJeu))
                .map((c) => (
                  <div key={c.id} className="avoid-break mb-4 pb-3 border-b border-slate-200">
                    <h3 className="font-bold text-slate-900 mb-1.5">
                      {c.nomJeu}
                      <span className="ml-2 text-xs font-normal text-slate-500">{c.editeur}</span>
                    </h3>

                    <div className="grid grid-cols-3 gap-x-6 gap-y-1 text-xs mb-2">
                      <Ligne label="Plateforme" valeur={c.plateforme} petit />
                      <Ligne label="Statut" valeur={c.statut} petit />
                      <Ligne label="Propriété" valeur={c.propriete || 'Perso'} petit />
                      <Ligne label="Niveau de pledge" valeur={c.niveauPledge || '—'} petit />
                      <Ligne label="Langue" valeur={c.langue || '—'} petit />
                      <Ligne label="Devise" valeur={c.devise} petit />
                      <Ligne label="Prix pledge" valeur={formatMontant(c.prixPledge, c.devise)} petit />
                      <Ligne
                        label="Frais de port"
                        valeur={`${formatMontant(c.fraisPort, c.devise)}${c.fraisPortPayes ? ' (payés)' : ' (dus)'}`}
                        petit
                      />
                      <Ligne label="Total add-ons" valeur={formatMontant(totalAddons(c), c.devise)} petit />
                      <Ligne label="Total dû" valeur={formatMontant(totalDu(c), c.devise)} petit />
                      <Ligne label="Total payé" valeur={formatMontant(totalPaye(c), c.devise)} petit />
                      <Ligne label="Reste à payer" valeur={formatMontant(totalDu(c) - totalPaye(c), c.devise)} petit />
                      <Ligne label="Fin de campagne" valeur={formatDate(c.dateFinCampagne)} petit />
                      <Ligne
                        label="Livraison prévue"
                        valeur={c.anneeLivraison ? `${c.moisLivraison ? MOIS_NOMS[c.moisLivraison] + ' ' : ''}${c.anneeLivraison}` : '—'}
                        petit
                      />
                      <Ligne label="Date d'ajout" valeur={formatDate(c.dateAjout)} petit />
                      {c.financementTotal ? (
                        <Ligne label="Financement total" valeur={formatMontant(c.financementTotal, c.devise)} petit />
                      ) : null}
                      {c.nombreFigurines ? (
                        <Ligne label="Figurines" valeur={String(c.nombreFigurines)} petit />
                      ) : null}
                      {c.prixRevente ? (
                        <Ligne label="Prix de revente" valeur={formatMontant(c.prixRevente, c.devise)} petit />
                      ) : null}
                      {c.idEngagement ? <Ligne label="ID engagement" valeur={c.idEngagement} petit /> : null}
                      <Ligne label="Déjà joué" valeur={c.dejaJoue ? 'Oui' : 'Non'} petit />
                      {c.jdr ? <Ligne label="JDR / Livre" valeur="Oui" petit /> : null}
                      {c.print3d ? <Ligne label="3D Print" valeur="Oui" petit /> : null}
                    </div>

                    {(c.urlCampagne || c.urlBGG) && (
                      <div className="text-[10px] text-slate-500 mb-2 break-all">
                        {c.urlCampagne && <div>Campagne : {c.urlCampagne}</div>}
                        {c.urlBGG && <div>BGG : {c.urlBGG}</div>}
                      </div>
                    )}

                    {(c.addons || []).length > 0 && (
                      <div className="mb-2">
                        <h4 className="text-xs font-semibold text-slate-700 mb-1">
                          Add-ons ({c.addons.length})
                        </h4>
                        <table className="w-full text-[11px] border-collapse">
                          <thead>
                            <tr className="border-b border-slate-200 text-left text-slate-500">
                              <th className="py-0.5 pr-2 font-medium">Nom</th>
                              <th className="py-0.5 pr-2 font-medium">Langue</th>
                              <th className="py-0.5 pr-2 font-medium text-right">Qté</th>
                              <th className="py-0.5 pr-2 font-medium text-right">P.U.</th>
                              <th className="py-0.5 font-medium text-right">Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {c.addons.map((a) => (
                              <tr key={a.id}>
                                <td className="py-0.5 pr-2">{a.nom || '—'}</td>
                                <td className="py-0.5 pr-2 text-slate-500">{a.langue || '—'}</td>
                                <td className="py-0.5 pr-2 text-right">{a.quantite}</td>
                                <td className="py-0.5 pr-2 text-right">{a.prix.toFixed(2)}</td>
                                <td className="py-0.5 text-right">{(a.prix * a.quantite).toFixed(2)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {(c.paiements || []).length > 0 && (
                      <div className="mb-2">
                        <h4 className="text-xs font-semibold text-slate-700 mb-1">
                          Paiements ({c.paiements.length})
                        </h4>
                        <table className="w-full text-[11px] border-collapse">
                          <thead>
                            <tr className="border-b border-slate-200 text-left text-slate-500">
                              <th className="py-0.5 pr-2 font-medium">Date</th>
                              <th className="py-0.5 pr-2 font-medium">Type</th>
                              <th className="py-0.5 pr-2 font-medium">Notes</th>
                              <th className="py-0.5 font-medium text-right">Montant</th>
                            </tr>
                          </thead>
                          <tbody>
                            {c.paiements
                              .slice()
                              .sort((a, b) => a.date.localeCompare(b.date))
                              .map((p) => (
                                <tr key={p.id}>
                                  <td className="py-0.5 pr-2">{formatDate(p.date)}</td>
                                  <td className="py-0.5 pr-2">{p.type}</td>
                                  <td className="py-0.5 pr-2 text-slate-500">{p.notes || ''}</td>
                                  <td className="py-0.5 text-right">{p.montant.toFixed(2)}</td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {c.notes && (
                      <div className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded whitespace-pre-wrap">
                        <span className="font-semibold text-slate-700">Notes : </span>
                        {c.notes}
                      </div>
                    )}
                  </div>
                ))}
            </section>
          )}

          {/* Jeux à venir */}
          {jeuxAVenir.length > 0 && (
            <section className="avoid-break mb-6">
              <h2 className="text-base font-bold text-slate-800 border-b border-slate-300 pb-1 mb-3">
                {avecDetails ? '4' : '3'}. Jeux à venir ({jeuxAVenir.length})
              </h2>
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-300 text-left text-slate-600">
                    <th className="py-1 pr-2 font-semibold">Jeu</th>
                    <th className="py-1 pr-2 font-semibold">Éditeur</th>
                    <th className="py-1 pr-2 font-semibold">Date prévue</th>
                    <th className="py-1 font-semibold">Ajouté le</th>
                  </tr>
                </thead>
                <tbody>
                  {jeuxAVenir.map((j) => (
                    <tr key={j.id} className="border-b border-slate-100">
                      <td className="py-1 pr-2 font-medium text-slate-800">{j.nomJeu}</td>
                      <td className="py-1 pr-2 text-slate-600">{j.editeur}</td>
                      <td className="py-1 pr-2 text-slate-600">
                        {j.dateDebut ? formatDate(j.dateDebut) : j.anneePrevue ? String(j.anneePrevue) : '—'}
                      </td>
                      <td className="py-1 text-slate-600">{formatDate(j.dateAjout)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}

          {/* Paramètres */}
          <section className="avoid-break">
            <h2 className="text-base font-bold text-slate-800 border-b border-slate-300 pb-1 mb-3">
              Annexe — Paramètres
            </h2>
            <div className="text-xs space-y-1 text-slate-600">
              <div><span className="font-semibold text-slate-700">Plateformes :</span> {parametres.plateformes.join(', ')}</div>
              <div><span className="font-semibold text-slate-700">Statuts :</span> {parametres.statuts.join(', ')}</div>
              <div><span className="font-semibold text-slate-700">Devises :</span> {parametres.devises.join(', ')}</div>
              <div><span className="font-semibold text-slate-700">Types de paiement :</span> {parametres.typesPaiement.join(', ')}</div>
              <div><span className="font-semibold text-slate-700">Langues :</span> {parametres.langues.filter(Boolean).join(', ')}</div>
              <div><span className="font-semibold text-slate-700">Propriétés :</span> {parametres.proprietes.join(', ')}</div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

function Ligne({ label, valeur, petit }: { label: string; valeur: string; petit?: boolean }) {
  return (
    <div className={`flex justify-between gap-2 ${petit ? 'text-xs' : 'text-sm'}`}>
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-slate-800 text-right">{valeur}</span>
    </div>
  );
}
