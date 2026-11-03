export interface ProgressionRecord {
  id: string;
  nomadId: string;
  competencyId: number;
  performanceLevelId: number;
  observedBehavior: string;
  otherStrategy: string | null;
  leaderActionIds: number[];
  recordedAt: string;
  recordedBy: string;
  recordedByName: string;
}

export interface NewProgressionRecord {
  id: string;
  nomadId: string;
  competencyId: number;
  performanceLevelId: number;
  observedBehavior: string;
  otherStrategy: string | null;
  leaderActionIds: number[];
}

export interface BadgeAward {
  id: string;
  nomadId: string;
  growthAreaId: number;
  performanceLevelId: number;
  awardedAt: string;
  awardedBy: string;
  awardedByName: string;
}

export interface NewBadgeAward {
  id: string;
  nomadId: string;
  growthAreaId: number;
  performanceLevelId: number;
}