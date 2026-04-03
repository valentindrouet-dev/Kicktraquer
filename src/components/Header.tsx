'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Rocket, Settings, Download, Upload, Plus, LogIn, LogOut, User, Cloud, CloudOff } from 'lucide-react';
import { exportData, importData } from '@/lib/storage';
import { useAuth } from '@/contexts/AuthContext';
import AuthModal from './AuthModal';
import MigrationModal from './MigrationModal';

interface HeaderProps {
  onAjouter?: () => void;
  onDataChange?: () => void;
}

export default function Header({ onAjouter, onDataChange }: HeaderProps) {
  const pathname = usePathname();
  const { user, isConfigured, signOut, loading } = useAuth();
  const [showImportModal, setShowImportModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showMigrationModal, setShowMigrationModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

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

  const handleSignOut = async () => {
    await signOut();
    setShowUserMenu(false);
    onDataChange?.();
  };

  const handleAuthSuccess = () => {
    setShowAuthModal(false);
    // Proposer la migration si l'utilisateur vient de se connecter
    setShowMigrationModal(true);
  };

  const handleMigrationSuccess = () => {
    onDataChange?.();
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
                href="/a-venir"
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  pathname === '/a-venir'
                    ? 'bg-slate-700 text-white'
                    : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                À venir
              </Link>
              <Link
                href="/paiements"
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  pathname === '/paiements'
                    ? 'bg-slate-700 text-white'
                    : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                Paiements
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
              {/* Indicateur de mode avec tooltip */}
              {!loading && (
                <div className="relative group">
                  <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-700 cursor-help">
                    {user ? (
                      <>
                        <Cloud className="w-4 h-4 text-green-400" />
                        <span className="text-xs text-green-400">Sync</span>
                      </>
                    ) : (
                      <>
                        <CloudOff className="w-4 h-4 text-amber-400" />
                        <span className="text-xs text-amber-400">Local</span>
                      </>
                    )}
                  </div>
                  {/* Tooltip */}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-64 p-3 bg-white rounded-lg shadow-lg border border-slate-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                    {user ? (
                      <>
                        <div className="flex items-center gap-2 text-green-600 font-medium mb-1">
                          <Cloud className="w-4 h-4" />
                          Synchronisation activée
                        </div>
                        <p className="text-xs text-slate-600">
                          Vos données sont synchronisées sur tous vos appareils.
                        </p>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center gap-2 text-amber-600 font-medium mb-1">
                          <CloudOff className="w-4 h-4" />
                          Mode local
                        </div>
                        <p className="text-xs text-slate-600">
                          Données stockées uniquement sur cet appareil. Connectez-vous pour synchroniser.
                        </p>
                      </>
                    )}
                    <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-l border-t border-slate-200 transform rotate-45" />
                  </div>
                </div>
              )}

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

              {/* Bouton utilisateur */}
              {!loading && isConfigured && (
                user ? (
                  <div className="relative">
                    <button
                      onClick={() => setShowUserMenu(!showUserMenu)}
                      className="flex items-center gap-2 p-2 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                      title={user.email || 'Compte'}
                    >
                      <User className="w-5 h-5" />
                    </button>

                    {showUserMenu && (
                      <>
                        <div
                          className="fixed inset-0 z-10"
                          onClick={() => setShowUserMenu(false)}
                        />
                        <div className="absolute right-0 top-full mt-1 w-64 bg-white rounded-lg shadow-lg border border-slate-200 z-20 py-1">
                          <div className="px-4 py-2 border-b border-slate-100">
                            <p className="text-sm text-slate-500">Connecté en tant que</p>
                            <p className="text-sm font-medium text-slate-800 truncate">{user.email}</p>
                          </div>
                          <button
                            onClick={() => {
                              setShowUserMenu(false);
                              setShowMigrationModal(true);
                            }}
                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                          >
                            <Upload className="w-4 h-4" />
                            Migrer les données locales
                          </button>
                          <button
                            onClick={handleSignOut}
                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <LogOut className="w-4 h-4" />
                            Se déconnecter
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={() => setShowAuthModal(true)}
                    className="flex items-center gap-2 px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                    title="Se connecter"
                  >
                    <LogIn className="w-5 h-5" />
                    <span className="text-sm font-medium hidden sm:inline">Connexion</span>
                  </button>
                )
              )}

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

      {/* Modal Auth */}
      {showAuthModal && (
        <AuthModal
          onClose={() => setShowAuthModal(false)}
          onSuccess={handleAuthSuccess}
        />
      )}

      {/* Modal Migration */}
      {showMigrationModal && (
        <MigrationModal
          onClose={() => setShowMigrationModal(false)}
          onSuccess={handleMigrationSuccess}
        />
      )}
    </>
  );
}
