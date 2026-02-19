import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

/**
 * API Keep-alive endpoint.
 * Effectue un ping léger sur Supabase pour maintenir le projet actif.
 * Appelé par GitHub Actions tous les 4 jours.
 */
export async function GET() {
  // Vérifier que Supabase est configuré
  if (!isSupabaseConfigured() || !supabase) {
    return NextResponse.json(
      { success: false, error: 'Supabase non configuré' },
      { status: 503 }
    );
  }

  try {
    // Ping léger : COUNT sur la table campagnes
    const { count, error } = await supabase
      .from('campagnes')
      .select('id', { count: 'exact', head: true });

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Keep-alive ping successful',
      timestamp: new Date().toISOString(),
      campaignsCount: count
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Erreur interne' },
      { status: 500 }
    );
  }
}
