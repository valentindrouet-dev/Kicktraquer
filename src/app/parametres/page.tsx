'use client';

import { useState, useEffect, useCallback } from 'react';
import Header from '@/components/Header';
import { Parametres, PARAMETRES_DEFAUT } from '@/types';
import { getParametres, saveParametres } from '@/lib/storage';
import { getParametresSupabase, saveParametresSupabase } from '@/lib/supabase-storage';
import { useAuth } from '@/contexts/AuthContext';
import { Plus, Trash2, RotateCcw, Save, GripVertical } from 'lucide-react';

type ParametreKey = keyof Parametres;

interface ListEditorProps {
  title: string;
  items: string[];
  onChange: (items: string[]) => void;
}

function ListEditor({ title, items, onChange }: ListEditorProps) {
  const [newItem, setNewItem] = useState('');

  const handleAdd = () => {
    if (newItem.trim() && !items.includes(newItem.trim())) {
      onChange([...items, newItem.trim()]);
      setNewItem('');
    }
  };

  const handleRemove = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  };

  const moveItem = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= items.length) return;
    const newItems = [...items];
    const [removed] = newItems.splice(fromIndex, 1);
    newItems.splice(toIndex, 0, removed);
    onChange(newItems);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <h3 className="text-lg font-semibold text-slate-800 mb-4">{title}</h3>

      {/* Ajout */}
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ajouter..."
          className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        />
        <button
          onClick={handleAdd}
          disabled={!newItem.trim()}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {/* Liste */}
      <div className="space-y-2">
        {items.map((item, index) => (
          <div
            key={`${item}-${index}`}
            className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg group"
          >
            <div className="flex flex-col">
              <button
                onClick={() => moveItem(index, index - 1)}
                disabled={index === 0}
                className="p-0.5 text-slate-400 hover:text-slate-600 disabled:opacity-30"
              >
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 15l-6-6-6 6" />
                </svg>
              </button>
              <button
                onClick={() => moveItem(index, index + 1)}
                disabled={index === items.length - 1}
                className="p-0.5 text-slate-400 hover:text-slate-600 disabled:opacity-30"
              >
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>
            </div>
            <GripVertical className="w-4 h-4 text-slate-400" />
            <span className="flex-1 text-slate-700">{item}</span>
            <button
              onClick={() => handleRemove(index)}
              className="p-1 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
        {items.length === 0 && (
          <p className="text-slate-500 text-sm italic text-center py-4">
            Aucun élément
          </p>
        )}
      </div>
    </div>
  );
}

export default function ParametresPage() {
  const { user, loading: authLoading } = useAuth();
  const [parametres, setParametres] = useState<Parametres>(PARAMETRES_DEFAUT);
  const [isLoading, setIsLoading] = useState(true);
  const [hasChanges, setHasChanges] = useState(false);
  const [savedMessage, setSavedMessage] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      if (user) {
        const p = await getParametresSupabase();
        setParametres(p);
      } else {
        const p = getParametres();
        setParametres(p);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des paramètres:', error);
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

  const handleChange = (key: ParametreKey, value: string[]) => {
    setParametres({ ...parametres, [key]: value });
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      if (user) {
        await saveParametresSupabase(parametres);
      } else {
        saveParametres(parametres);
      }
      setHasChanges(false);
      setSavedMessage(true);
      setTimeout(() => setSavedMessage(false), 2000);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      alert('Erreur lors de la sauvegarde des paramètres');
    }
  };

  const handleReset = async () => {
    if (confirm('Êtes-vous sûr de vouloir réinitialiser tous les paramètres par défaut ?')) {
      setParametres(PARAMETRES_DEFAUT);
      if (user) {
        await saveParametresSupabase(PARAMETRES_DEFAUT);
      } else {
        saveParametres(PARAMETRES_DEFAUT);
      }
      setHasChanges(false);
    }
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
      <Header />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-slate-800">Paramètres</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Réinitialiser
            </button>
            <button
              onClick={handleSave}
              disabled={!hasChanges}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                hasChanges
                  ? 'bg-primary-600 text-white hover:bg-primary-700'
                  : 'bg-slate-200 text-slate-500 cursor-not-allowed'
              }`}
            >
              <Save className="w-4 h-4" />
              {savedMessage ? 'Enregistré !' : 'Enregistrer'}
            </button>
          </div>
        </div>

        {hasChanges && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-6">
            <p className="text-sm text-amber-800">
              Vous avez des modifications non enregistrées.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ListEditor
            title="Plateformes"
            items={parametres.plateformes}
            onChange={(items) => handleChange('plateformes', items)}
          />

          <ListEditor
            title="Statuts"
            items={parametres.statuts}
            onChange={(items) => handleChange('statuts', items)}
          />

          <ListEditor
            title="Devises"
            items={parametres.devises}
            onChange={(items) => handleChange('devises', items)}
          />

          <ListEditor
            title="Types de paiement"
            items={parametres.typesPaiement}
            onChange={(items) => handleChange('typesPaiement', items)}
          />

          <ListEditor
            title="Langues"
            items={parametres.langues || ['', 'Français', 'Anglais']}
            onChange={(items) => handleChange('langues', items)}
          />

          <ListEditor
            title="Propriétés"
            items={parametres.proprietes || ['Perso', 'BGG']}
            onChange={(items) => handleChange('proprietes', items)}
          />
        </div>

        <div className="mt-8 bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">
            À propos de Kicktraquer
          </h3>
          <p className="text-slate-600 mb-4">
            Kicktraquer est une application de suivi de vos campagnes de financement participatif.
            Elle vous permet de gérer vos pledges, suivre vos paiements et visualiser des statistiques.
          </p>
          <div className="flex items-center gap-4 text-sm text-slate-500">
            <span>Version 1.0.0</span>
            <span>•</span>
            <span>Mode local (données stockées sur cet appareil)</span>
          </div>
        </div>
      </main>
    </div>
  );
}
