import type { NomadRepository } from './repository';
import { supabaseNomadRepository } from './supabaseNomadRepository';

// Single switch point: replace with the PowerSync implementation later.
export const nomadRepository: NomadRepository = supabaseNomadRepository;

export type { NomadRepository } from './repository';
export type { Nomad, NomadInput, NomadStatus } from './types';