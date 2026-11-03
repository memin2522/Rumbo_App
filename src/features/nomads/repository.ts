import type { Nomad, NomadInput } from './types';

export interface NomadRepository {
  list(): Promise<Nomad[]>;
  getById(id: string): Promise<Nomad | null>;
  create(communityId: string, input: NomadInput): Promise<Nomad>;
  update(id: string, input: NomadInput): Promise<Nomad>;
  retire(id: string): Promise<Nomad>;
  reactivate(id: string): Promise<Nomad>;
  remove(id: string): Promise<void>;
}