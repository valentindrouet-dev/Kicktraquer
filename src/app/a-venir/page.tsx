'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Header from '@/components/Header';
import { JeuAVenir } from '@/types';
import { getJeuxAVenir, addJeuAVenir, updateJeuAVenir, deleteJeuAVenir } from '@/lib/storage';
import { Plus, X, Pencil, Trash2, ExternalLink, Calendar } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

export default function AVenirPage() {
  const [jeux, setJeux] = useState<JeuAVenir[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingJeu, setEditingJeu] = useState<JeuAVenir | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    nomJeu: '',
    editeur: '',
    dateDebut: '',
    anneePrevue: '',
    urlCampagne: '',
    imageUrl: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setIsLoading(true);
    const data = getJeuxAVenir();
    // Trier par date/année (les plus proches en premier)
    data.sort((a, b) => {
      const dateA = a.dateDebut || (a.anneePrevue ? `${a.anneePrevue}-12-31` : null);
      const dateB = b.dateDebut || (b.anneePrevue ? `${b.anneePrevue}-12-31` : null);
      if (!dateA && !dateB) return 0;
      if (!dateA) return 1;
      if (!dateB) return -1;
      return dateA.localeCompare(dateB);
    });
    setJeux(data);
    setIsLoading(false);
  };

  const handleOpenModal = (jeu?: JeuAVenir) => {
    if (jeu) {
      setEditingJeu(jeu);
      setFormData({
        nomJeu: jeu.nomJeu,
        editeur: jeu.editeur,
        dateDebut: jeu.dateDebut || '',
        anneePrevue: jeu.anneePrevue?.toString() || '',
        urlCampagne: jeu.urlCampagne || '',
        imageUrl: jeu.imageUrl || '',
      });
    } else {
      setEditingJeu(null);
      setFormData({ nomJeu: '', editeur: '', dateDebut: '', anneePrevue: '', urlCampagne: '', imageUrl: '' });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingJeu(null);
    setFormData({ nomJeu: '', editeur: '', dateDebut: '', anneePrevue: '', urlCampagne: '', imageUrl: '' });
  };

  const handleSave = () => {
    if (!formData.nomJeu.trim()) return;

    const jeu: JeuAVenir = {
      id: editingJeu?.id || uuidv4(),
      nomJeu: formData.nomJeu.trim(),
      editeur: formData.editeur.trim(),
      dateDebut: formData.dateDebut || undefined,
      anneePrevue: formData.anneePrevue ? parseInt(formData.anneePrevue, 10) : undefined,
      urlCampagne: formData.urlCampagne.trim() || undefined,
      imageUrl: formData.imageUrl.trim() || undefined,
      dateAjout: editingJeu?.dateAjout || new Date().toISOString().split('T')[0],
    };

    if (editingJeu) {
      updateJeuAVenir(jeu);
    } else {
      addJeuAVenir(jeu);
    }

    handleCloseModal();
    loadData();
  };

  const handleDelete = (id: string) => {
    deleteJeuAVenir(id);
    setShowDeleteConfirm(null);
    loadData();
  };

  const formatDate = (jeu: JeuAVenir) => {
    if (jeu.dateDebut) {
      return new Date(jeu.dateDebut).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
    }
    if (jeu.anneePrevue) {
      return jeu.anneePrevue.toString();
    }
    return 'Non définie';
  };

  const getDaysUntil = (jeu: JeuAVenir) => {
    if (!jeu.dateDebut) return null; // Pas de countdown pour les dates imprécises
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(jeu.dateDebut);
    const diff = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  // Générer les options d'années (année actuelle + 5 ans)
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 6 }, (_, i) => currentYear + i);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />

      <main className="max-w-5xl mx-auto px-3 sm:px-4 lg:px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-slate-800">À venir</h1>
            <p className="text-sm text-slate-500">{jeux.length} jeu{jeux.length > 1 ? 'x' : ''} en attente</p>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 px-3 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors text-sm"
          >
            <Plus className="w-4 h-4" />
            Ajouter
          </button>
        </div>

        {jeux.length === 0 ? (
          <div className="bg-white rounded-lg border border-slate-200 p-8 text-center">
            <div className="text-4xl mb-3">👀</div>
            <h3 className="text-base font-medium text-slate-800 mb-1">Aucun jeu en attente</h3>
            <p className="text-sm text-slate-500 mb-4">Ajoutez les campagnes que vous guettez !</p>
            <button
              onClick={() => handleOpenModal()}
              className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors text-sm"
            >
              Ajouter un jeu
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {jeux.map((jeu) => {
              const daysUntil = getDaysUntil(jeu);
              return (
                <div
                  key={jeu.id}
                  className="bg-white rounded-lg border border-slate-200 overflow-hidden hover:shadow-md transition-shadow"
                >
                  {/* Image */}
                  <div className="relative h-32 bg-gradient-to-br from-cyan-50 to-cyan-100">
                    {jeu.imageUrl ? (
                      <Image
                        src={jeu.imageUrl}
                        alt={jeu.nomJeu}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-4xl">🎲</span>
                      </div>
                    )}
                    {/* Badge countdown ou année */}
                    <div className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-xs font-medium ${
                      daysUntil !== null ? (
                        daysUntil <= 0 ? 'bg-green-500 text-white' :
                        daysUntil <= 7 ? 'bg-orange-500 text-white' :
                        daysUntil <= 30 ? 'bg-yellow-500 text-white' :
                        'bg-cyan-500 text-white'
                      ) : (
                        jeu.anneePrevue ? 'bg-slate-500 text-white' : 'bg-slate-300 text-slate-700'
                      )
                    }`}>
                      {daysUntil !== null ? (
                        daysUntil <= 0 ? 'Maintenant !' : daysUntil === 1 ? 'Demain' : `J-${daysUntil}`
                      ) : (
                        jeu.anneePrevue ? jeu.anneePrevue : '?'
                      )}
                    </div>
                    {/* Actions */}
                    <div className="absolute top-2 right-2 flex gap-1">
                      {jeu.urlCampagne && (
                        <a
                          href={jeu.urlCampagne}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 bg-white/90 rounded-full hover:bg-white transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ExternalLink className="w-3.5 h-3.5 text-slate-600" />
                        </a>
                      )}
                      <button
                        onClick={() => handleOpenModal(jeu)}
                        className="p-1.5 bg-white/90 rounded-full hover:bg-white transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5 text-slate-600" />
                      </button>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-3">
                    <h3 className="font-semibold text-slate-800 truncate text-sm" title={jeu.nomJeu}>
                      {jeu.nomJeu}
                    </h3>
                    <p className="text-xs text-slate-500 truncate">{jeu.editeur || 'Éditeur inconnu'}</p>

                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
                      <div className="flex items-center gap-1 text-xs text-slate-500">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{formatDate(jeu)}</span>
                      </div>
                      {showDeleteConfirm === jeu.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleDelete(jeu.id)}
                            className="px-2 py-0.5 bg-red-600 text-white text-xs rounded hover:bg-red-700"
                          >
                            Oui
                          </button>
                          <button
                            onClick={() => setShowDeleteConfirm(null)}
                            className="px-2 py-0.5 bg-slate-200 text-slate-700 text-xs rounded hover:bg-slate-300"
                          >
                            Non
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setShowDeleteConfirm(jeu.id)}
                          className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-800">
                {editingJeu ? 'Modifier' : 'Ajouter un jeu'}
              </h2>
              <button onClick={handleCloseModal} className="p-1 hover:bg-slate-100 rounded">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Nom du jeu *
                </label>
                <input
                  type="text"
                  value={formData.nomJeu}
                  onChange={(e) => setFormData({ ...formData, nomJeu: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Éditeur
                </label>
                <input
                  type="text"
                  value={formData.editeur}
                  onChange={(e) => setFormData({ ...formData, editeur: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Date de début
                  </label>
                  <input
                    type="date"
                    value={formData.dateDebut}
                    onChange={(e) => setFormData({ ...formData, dateDebut: e.target.value, anneePrevue: '' })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Ou année prévue
                  </label>
                  <select
                    value={formData.anneePrevue}
                    onChange={(e) => setFormData({ ...formData, anneePrevue: e.target.value, dateDebut: '' })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                  >
                    <option value="">-</option>
                    {yearOptions.map((year) => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
              </div>
              <p className="text-xs text-slate-500 -mt-2">
                Renseignez soit une date précise, soit juste l'année si inconnue
              </p>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  URL de la page
                </label>
                <input
                  type="url"
                  value={formData.urlCampagne}
                  onChange={(e) => setFormData({ ...formData, urlCampagne: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                  placeholder="https://..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  URL de l'image
                </label>
                <input
                  type="url"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                  placeholder="https://..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors"
                >
                  {editingJeu ? 'Enregistrer' : 'Ajouter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
