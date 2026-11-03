import { supabase } from '@/lib/supabase';
import type { CatalogRepository } from './repository';
import type {
  Catalog,
  Competency,
  EducationalPriority,
  GrowthArea,
  LeaderAction,
  PerformanceLevel,
  PerformanceLevelCode,
} from './types';

interface GrowthAreaRow {
  id: number;
  code: string;
  name: string;
  symbolic_name: string;
  sort_order: number;
}

interface EducationalPriorityRow {
  id: number;
  growth_area_id: number;
  name: string;
  sort_order: number;
}

interface CompetencyRow {
  id: number;
  educational_priority_id: number;
  description: string;
}

interface PerformanceLevelRow {
  id: number;
  code: PerformanceLevelCode;
  name: string;
  adult_role: string;
}

interface LeaderActionRow {
  id: number;
  performance_level_id: number;
  description: string;
}

async function loadCatalog(): Promise<Catalog> {
  const [areas, priorities, competencies, levels, actions] = await Promise.all([
    supabase.from('growth_area').select('id, code, name, symbolic_name, sort_order').order('sort_order'),
    supabase.from('educational_priority').select('id, growth_area_id, name, sort_order').order('sort_order'),
    supabase.from('competency').select('id, educational_priority_id, description').order('id'),
    supabase.from('performance_level').select('id, code, name, adult_role').order('id'),
    supabase.from('leader_action').select('id, performance_level_id, description').order('id'),
  ]);

  for (const result of [areas, priorities, competencies, levels, actions]) {
    if (result.error) throw result.error;
  }

  return {
    growthAreas: (areas.data as GrowthAreaRow[]).map(
      (r): GrowthArea => ({
        id: r.id,
        code: r.code,
        name: r.name,
        symbolicName: r.symbolic_name,
        sortOrder: r.sort_order,
      }),
    ),
    educationalPriorities: (priorities.data as EducationalPriorityRow[]).map(
      (r): EducationalPriority => ({
        id: r.id,
        growthAreaId: r.growth_area_id,
        name: r.name,
        sortOrder: r.sort_order,
      }),
    ),
    competencies: (competencies.data as CompetencyRow[]).map(
      (r): Competency => ({
        id: r.id,
        educationalPriorityId: r.educational_priority_id,
        description: r.description,
      }),
    ),
    performanceLevels: (levels.data as PerformanceLevelRow[]).map(
      (r): PerformanceLevel => ({
        id: r.id,
        code: r.code,
        name: r.name,
        adultRole: r.adult_role,
      }),
    ),
    leaderActions: (actions.data as LeaderActionRow[]).map(
      (r): LeaderAction => ({
        id: r.id,
        performanceLevelId: r.performance_level_id,
        description: r.description,
      }),
    ),
  };
}

let cached: Promise<Catalog> | null = null;

export const supabaseCatalogRepository: CatalogRepository = {
  getCatalog() {
    if (!cached) {
      cached = loadCatalog().catch((error: unknown) => {
        cached = null;
        throw error;
      });
    }
    return cached;
  },
};