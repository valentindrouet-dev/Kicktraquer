'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Rocket, Settings, Download, Upload, Plus } from 'lucide-react';
import { exportData, importData } from '@/lib/storage';

interface HeaderProps {
  onAjouter?: () => void;
  onDataChange?: () => void;
}

export default function Header({ onAjouter, onDataChange }: HeaderProps) {
  const pathname = usePathname();
  const [showImportModal, setShowImportModal] = useState(false);

  const handleExport = () => {
    const data = exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kicktraquer-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (importData(content)) {
        setShowImportModal(false);
        onDataChange?.();
        alert('Importation réussie !');
      } else {
        alert('Erreur lors de l\'importation. Vérifiez le format du fichier.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <>
      <header className="bg-slate-800 text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <Rocket className="w-8 h-8 text-green-400" />
              <span className="text-xl font-bold">Kicktraquer</span>
            </Link>

            {/* Navigation */}
            <nav className="flex items-center gap-1">
              <Link
                href="/"
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  pathname === '/'
                    ? 'bg-slate-700 text-white'
                    : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                Campagnes
              </Link>
              <Link
                href="/statistiques"
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  pathname === '/statistiques'
                    ? 'bg-slate-700 text-white'
                    : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                Statistiques
              </Link>
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleExport}
                className="p-2 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                title="Exporter les données"
              >
                <Download className="w-5 h-5" />
              </button>
              <button
                onClick={() => setShowImportModal(true)}
                className="p-2 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                title="Importer des données"
              >
                <Upload className="w-5 h-5" />
              </button>
              <Link
                href="/parametres"
                className={`p-2 rounded-lg transition-colors ${
                  pathname === '/parametres'
                    ? 'bg-slate-700 text-white'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700'
                }`}
                title="Paramètres"
              >
                <Settings className="w-5 h-5" />
              </Link>
              {onAjouter && (
                <button
                  onClick={onAjouter}
                  className="flex items-center gap-2 px-4 py-2 bg-white text-slate-800 rounded-lg font-medium hover:bg-slate-100 transition-colors ml-2"
                >
                  <Plus className="w-5 h-5" />
                  Ajouter
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Modal Import */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <h2 className="text-xl font-bold mb-4">Importer des données</h2>
            <p className="text-slate-600 mb-4">
              Sélectionnez un fichier JSON exporté précédemment.
              Attention : cela remplacera toutes vos données actuelles.
            </p>
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              className="w-full p-2 border border-slate-300 rounded-lg mb-4"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
