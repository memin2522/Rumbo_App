import type { CatalogRepository } from './repository';
import { supabaseCatalogRepository } from './supabaseCatalogRepository';

export const catalogRepository: CatalogRepository = supabaseCatalogRepository;

export type { CatalogRepository } from './repository';
export type {
  Catalog,
  Competency,
  EducationalPriority,
  GrowthArea,
  LeaderAction,
  PerformanceLevel,
  PerformanceLevelCode,
} from './types';