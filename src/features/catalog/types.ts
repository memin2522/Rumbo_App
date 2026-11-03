export type PerformanceLevelCode = 'N1' | 'N2' | 'N3';

export interface GrowthArea {
  id: number;
  code: string;
  name: string;
  symbolicName: string;
  sortOrder: number;
}

export interface EducationalPriority {
  id: number;
  growthAreaId: number;
  name: string;
  sortOrder: number;
}

export interface Competency {
  id: number;
  educationalPriorityId: number;
  description: string;
}

export interface PerformanceLevel {
  id: number;
  code: PerformanceLevelCode;
  name: string;
  adultRole: string;
}

export interface LeaderAction {
  id: number;
  performanceLevelId: number;
  description: string;
}

export interface Catalog {
  growthAreas: GrowthArea[];
  educationalPriorities: EducationalPriority[];
  competencies: Competency[];
  performanceLevels: PerformanceLevel[];
  leaderActions: LeaderAction[];
}