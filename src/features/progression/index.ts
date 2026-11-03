import type { ProgressionRepository } from './repository';
import { supabaseProgressionRepository } from './supabaseProgressionRepository';

export const progressionRepository: ProgressionRepository = supabaseProgressionRepository;

export { computePhase, currentAreaLevels } from './phase';
export type { Phase, PhaseCode } from './phase';
export type { ProgressionRepository } from './repository';
export type { BadgeAward, NewBadgeAward, NewProgressionRecord, ProgressionRecord } from './types';
