'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Rocket, Settings, Download, Upload, Plus, LogIn, LogOut, User, Cloud, CloudOff, FileText } from 'lucide-react';
import { buildBackup, restoreBackup } from '@/lib/backup';
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
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const handleExport = async () => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      // Sauvegarde depuis la source réelle : Supabase si connecté, sinon local
      const backup = await buildBackup(!!user);
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `kicktraquer-sauvegarde-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Erreur export:', err);
      alert('Erreur lors de l\'export. Réessayez.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        const result = await restoreBackup(content, !!user);
        if (result.campagnes > 0 || result.jeuxAVenir > 0) {
          setShowImportModal(false);
          onDataChange?.();
        }
        alert(
          result.errors.length > 0
            ? `${result.message}\n\n${result.errors.slice(0, 5).join('\n')}`
            : result.message
        );
      } catch (err) {
        console.error('Erreur import:', err);
        alert('Erreur lors de l\'importation.');
      } finally {
        setIsImporting(false);
        e.target.value = '';
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
                disabled={isExporting}
                className="p-2 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50"
                title={user ? 'Sauvegarder toutes les données (depuis le cloud)' : 'Sauvegarder toutes les données (locales)'}
              >
                <Download className={`w-5 h-5 ${isExporting ? 'animate-pulse' : ''}`} />
              </button>
              <button
                onClick={() => setShowImportModal(true)}
                className="p-2 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                title="Restaurer une sauvegarde"
              >
                <Upload className="w-5 h-5" />
              </button>
              <Link
                href="/rapport"
                className={`p-2 rounded-lg transition-colors ${
                  pathname === '/rapport'
                    ? 'bg-slate-700 text-white'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700'
                }`}
                title="Rapport complet (PDF)"
              >
                <FileText className="w-5 h-5" />
              </Link>
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
            <h2 className="text-xl font-bold mb-4">Restaurer une sauvegarde</h2>
            <p className="text-slate-600 mb-2">
              Sélectionnez un fichier de sauvegarde JSON exporté précédemment.
            </p>
            <p className="text-sm text-slate-500 mb-4">
              Rien n&apos;est supprimé : les campagnes de la sauvegarde sont ajoutées
              ou mises à jour, celles absentes du fichier sont conservées.
              {user && ' La restauration se fait dans votre compte cloud.'}
            </p>
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              disabled={isImporting}
              className="w-full p-2 border border-slate-300 rounded-lg mb-4 disabled:opacity-50"
            />
            {isImporting && (
              <p className="text-sm text-primary-600 mb-2">Restauration en cours…</p>
            )}
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
