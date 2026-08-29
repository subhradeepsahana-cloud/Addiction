import { localStore, Collections, makeLocalId } from '@/lib/localStore';
import { writeLocalAndSync, requireUserId } from './base';
import type { Craving, InterventionType, TriggerTag } from '@/types/domain';

export async function startCraving(intensityBefore: number, trigger: TriggerTag | null, notes?: string | null): Promise<Craving> {
  const userId = requireUserId();
  const craving: Craving = {
    id: makeLocalId(),
    userId,
    startedAt: new Date().toISOString(),
    intensityBefore,
    intensityAfter: null,
    trigger,
    notes: notes ?? null,
    outcome: null,
    interventionsUsed: [],
    completedAt: null,
  };
  return writeLocalAndSync(Collections.cravings, craving, 'cravings', toCravingRow);
}

export async function recordInterventionUsed(cravingId: string, type: InterventionType): Promise<Craving | null> {
  const craving = await localStore.get<Craving>(Collections.cravings, cravingId);
  if (!craving) return null;
  const interventionsUsed = craving.interventionsUsed.includes(type) ? craving.interventionsUsed : [...craving.interventionsUsed, type];
  return localStore.update<Craving>(Collections.cravings, cravingId, { interventionsUsed });
}

export async function completeCraving(
  cravingId: string,
  intensityAfter: number,
  outcome: Craving['outcome']
): Promise<Craving | null> {
  const updated = await localStore.update<Craving>(Collections.cravings, cravingId, {
    intensityAfter,
    outcome,
    completedAt: new Date().toISOString(),
  });

  if (updated) {
    const { getSupabase } = await import('@/lib/supabase');
    const supabase = getSupabase();
    const userId = requireUserId();
    if (supabase) {
      try {
        await supabase
          .from('cravings')
          .update({
            intensity_after: updated.intensityAfter,
            outcome: updated.outcome,
            interventions_used: updated.interventionsUsed,
            completed_at: updated.completedAt,
          })
          .eq('id', cravingId)
          .eq('user_id', userId);
      } catch {
        // non-fatal; local record is authoritative
      }
    }
  }

  return updated;
}

export async function updateCravingNotes(cravingId: string, notes: string): Promise<Craving | null> {
  const updated = await localStore.update<Craving>(Collections.cravings, cravingId, { notes });
  if (updated) {
    const { getSupabase } = await import('@/lib/supabase');
    const supabase = getSupabase();
    if (supabase) {
      try {
        await supabase.from('cravings').update({ notes }).eq('id', cravingId).eq('user_id', updated.userId);
      } catch {
        // non-fatal
      }
    }
  }
  return updated;
}

export async function getCravings(): Promise<Craving[]> {
  const cravings = await localStore.list<Craving>(Collections.cravings);
  return cravings.sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
}

function toCravingRow(c: Craving) {
  return {
    id: c.id,
    user_id: c.userId,
    started_at: c.startedAt,
    intensity_before: c.intensityBefore,
    intensity_after: c.intensityAfter,
    trigger: c.trigger,
    notes: c.notes,
    outcome: c.outcome,
    interventions_used: c.interventionsUsed,
    completed_at: c.completedAt,
  };
}
