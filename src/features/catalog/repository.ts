import type { Catalog } from './types';

export interface CatalogRepository {
  getCatalog(): Promise<Catalog>;
}