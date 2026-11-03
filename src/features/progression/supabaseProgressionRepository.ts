import { supabase } from '@/lib/supabase';
import type { ProgressionRepository } from './repository';
import type { BadgeAward, ProgressionRecord } from './types';

// Postgres unique_violation: the row was already inserted by a previous attempt.
const UNIQUE_VIOLATION = '23505';

interface ProgressionRecordRow {
  id: string;
  nomad_id: string;
  competency_id: number;
  performance_level_id: number;
  observed_behavior: string;
  other_strategy: string | null;
  recorded_at: string;
  recorded_by: string;
  leader: { full_name: string } | null;
  applied_strategy: { leader_action_id: number }[];
}

interface BadgeRow {
  id: string;
  nomad_id: string;
  growth_area_id: number;
  performance_level_id: number;
  awarded_at: string;
  awarded_by: string;
  leader: { full_name: string } | null;
}

export const supabaseProgressionRepository: ProgressionRepository = {
  async listRecords(nomadId) {
    const { data, error } = await supabase
      .from('progression_record')
      .select(
        'id, nomad_id, competency_id, performance_level_id, observed_behavior, other_strategy, ' +
          'recorded_at, recorded_by, leader(full_name), applied_strategy(leader_action_id)',
      )
      .eq('nomad_id', nomadId)
      .order('recorded_at', { ascending: false });
    if (error) throw error;
    return (data as unknown as ProgressionRecordRow[]).map(
      (r): ProgressionRecord => ({
        id: r.id,
        nomadId: r.nomad_id,
        competencyId: r.competency_id,
        performanceLevelId: r.performance_level_id,
        observedBehavior: r.observed_behavior,
        otherStrategy: r.other_strategy,
        leaderActionIds: r.applied_strategy.map((s) => s.leader_action_id),
        recordedAt: r.recorded_at,
        recordedBy: r.recorded_by,
        recordedByName: r.leader?.full_name ?? '',
      }),
    );
  },

  async createRecord(input) {
    // Two inserts (record, then strategies) instead of one server-side
    // transaction, to match the table-by-table model of offline sync.
    // Both steps are idempotent on retry thanks to the client-side id.
    const { error: recordError } = await supabase.from('progression_record').insert({
      id: input.id,
      nomad_id: input.nomadId,
      competency_id: input.competencyId,
      performance_level_id: input.performanceLevelId,
      observed_behavior: input.observedBehavior.trim(),
      other_strategy: input.otherStrategy?.trim() || null,
      recorded_at: new Date().toISOString(),
    });
    if (recordError && recordError.code !== UNIQUE_VIOLATION) throw recordError;

    if (input.leaderActionIds.length === 0) return;

    const { error: strategyError } = await supabase.from('applied_strategy').insert(
      input.leaderActionIds.map((actionId) => ({
        progression_record_id: input.id,
        leader_action_id: actionId,
      })),
    );
    if (strategyError && strategyError.code !== UNIQUE_VIOLATION) throw strategyError;
  },

  async listBadges(nomadId) {
    const { data, error } = await supabase
      .from('badge_progress')
      .select(
        'id, nomad_id, growth_area_id, performance_level_id, awarded_at, awarded_by, leader(full_name)',
      )
      .eq('nomad_id', nomadId)
      .order('awarded_at', { ascending: false });
    if (error) throw error;
    return (data as unknown as BadgeRow[]).map(
      (r): BadgeAward => ({
        id: r.id,
        nomadId: r.nomad_id,
        growthAreaId: r.growth_area_id,
        performanceLevelId: r.performance_level_id,
        awardedAt: r.awarded_at,
        awardedBy: r.awarded_by,
        awardedByName: r.leader?.full_name ?? '',
      }),
    );
  },

  async awardBadge(input) {
    const { error } = await supabase.from('badge_progress').insert({
      id: input.id,
      nomad_id: input.nomadId,
      growth_area_id: input.growthAreaId,
      performance_level_id: input.performanceLevelId,
      awarded_at: new Date().toISOString(),
    });
    if (error && error.code !== UNIQUE_VIOLATION) throw error;
  },
};