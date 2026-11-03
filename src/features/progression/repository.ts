import type { BadgeAward, NewBadgeAward, NewProgressionRecord, ProgressionRecord } from './types';

export interface ProgressionRepository {
  listRecords(nomadId: string): Promise<ProgressionRecord[]>;
  createRecord(input: NewProgressionRecord): Promise<void>;
  listBadges(nomadId: string): Promise<BadgeAward[]>;
  awardBadge(input: NewBadgeAward): Promise<void>;
}