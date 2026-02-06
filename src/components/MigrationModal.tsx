'use client';

import { useState } from 'react';
import { X, Upload, Check, AlertTriangle, Loader2 } from 'lucide-react';
import { getAppData } from '@/lib/storage';
import { migrateLocalDataToSupabase } from '@/lib/supabase-storage';

interface MigrationModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function MigrationModal({ onClose, onSuccess }: MigrationModalProps) {
  const [step, setStep] = useState<'confirm' | 'migrating' | 'done' | 'error'>('confirm');
  const [result, setResult] = useState<{ count: number; errors: string[] } | null>(null);

  const localData = getAppData();
  const campagneCount = localData.campagnes.length;

  const handleMigrate = async () => {
    setStep('migrating');

    try {
      const migrationResult = await migrateLocalDataToSupabase(
        localData.campagnes,
        localData.parametres
      );

      setResult({ count: migrationResult.count, errors: migrationResult.errors });

      if (migrationResult.success) {
        setStep('done');
      } else if (migrationResult.count > 0) {
        setStep('done'); // Partiel mais réussi en partie
      } else {
        setStep('error');
      }
    } catch (e) {
      setResult({ count: 0, errors: ['Erreur inattendue lors de la migration'] });
      setStep('error');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <h2 className="text-xl font-semibold text-slate-800">
            Migration des données
          </h2>
          {step !== 'migrating' && (
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 'confirm' && (
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <Upload className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-medium text-blue-800">Prêt à migrer</h3>
                  <p className="text-sm text-blue-700 mt-1">
                    Nous avons trouvé <strong>{campagneCount} campagne{campagneCount > 1 ? 's' : ''}</strong> dans votre stockage local.
                    Ces données seront copiées vers votre compte Supabase.
                  </p>
                </div>
              </div>

              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-amber-800">Important</h4>
                    <ul className="text-sm text-amber-700 mt-1 list-disc list-inside space-y-1">
                      <li>Les données locales ne seront pas supprimées</li>
                      <li>Vous pouvez toujours exporter une sauvegarde JSON</li>
                      <li>La migration peut prendre quelques secondes</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={onClose}
                  className="flex-1 py-2.5 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleMigrate}
                  className="flex-1 py-2.5 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
                >
                  Migrer maintenant
                </button>
              </div>
            </div>
          )}

          {step === 'migrating' && (
            <div className="text-center py-8">
              <Loader2 className="w-12 h-12 text-primary-600 animate-spin mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-800">Migration en cours...</h3>
              <p className="text-slate-600 mt-2">Veuillez patienter, ne fermez pas cette fenêtre.</p>
            </div>
          )}

          {step === 'done' && result && (
            <div className="space-y-4">
              <div className="text-center py-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-lg font-medium text-slate-800">Migration terminée !</h3>
                <p className="text-slate-600 mt-2">
                  {result.count} campagne{result.count > 1 ? 's' : ''} migré{result.count > 1 ? 'es' : 'e'} avec succès.
                </p>
              </div>

              {result.errors.length > 0 && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <h4 className="font-medium text-amber-800 mb-2">
                    Quelques erreurs ({result.errors.length})
                  </h4>
                  <ul className="text-sm text-amber-700 space-y-1">
                    {result.errors.slice(0, 5).map((err, i) => (
                      <li key={i}>• {err}</li>
                    ))}
                    {result.errors.length > 5 && (
                      <li>• ... et {result.errors.length - 5} autres erreurs</li>
                    )}
                  </ul>
                </div>
              )}

              <button
                onClick={() => {
                  onSuccess();
                  onClose();
                }}
                className="w-full py-2.5 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
              >
                Continuer
              </button>
            </div>
          )}

          {step === 'error' && result && (
            <div className="space-y-4">
              <div className="text-center py-4">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="w-8 h-8 text-red-600" />
                </div>
                <h3 className="text-lg font-medium text-slate-800">Erreur de migration</h3>
                <p className="text-slate-600 mt-2">
                  La migration a échoué. Vos données locales sont toujours intactes.
                </p>
              </div>

              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <ul className="text-sm text-red-700 space-y-1">
                  {result.errors.map((err, i) => (
                    <li key={i}>• {err}</li>
                  ))}
                </ul>
              </div>

              <button
                onClick={onClose}
                className="w-full py-2.5 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors"
              >
                Fermer
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
