import { supabase } from '@/lib/supabase';
import type { NomadRepository } from './repository';
import type { Nomad, NomadInput, NomadStatus } from './types';

const COLUMNS =
  'id, community_id, first_name, last_name, status, retired_at, created_at, updated_at';

interface NomadRow {
  id: string;
  community_id: string;
  first_name: string;
  last_name: string;
  status: NomadStatus;
  retired_at: string | null;
  created_at: string;
  updated_at: string;
}

function toNomad(row: NomadRow): Nomad {
  return {
    id: row.id,
    communityId: row.community_id,
    firstName: row.first_name,
    lastName: row.last_name,
    status: row.status,
    retiredAt: row.retired_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toNameColumns(input: NomadInput) {
  return {
    first_name: input.firstName.trim(),
    last_name: input.lastName.trim(),
  };
}

async function updateRow(id: string, changes: Record<string, unknown>): Promise<Nomad> {
  const { data, error } = await supabase
    .from('nomad')
    .update(changes)
    .eq('id', id)
    .select(COLUMNS)
    .single();
  if (error) throw error;
  return toNomad(data as NomadRow);
}

export const supabaseNomadRepository: NomadRepository = {
  async list() {
    const { data, error } = await supabase
      .from('nomad')
      .select(COLUMNS)
      .order('last_name')
      .order('first_name');
    if (error) throw error;
    return (data as NomadRow[]).map(toNomad);
  },

  async getById(id) {
    const { data, error } = await supabase
      .from('nomad')
      .select(COLUMNS)
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return data ? toNomad(data as NomadRow) : null;
  },

  async create(communityId, input) {
    // created_by / updated_by are filled by the set_audit_fields trigger.
    const { data, error } = await supabase
      .from('nomad')
      .insert({ community_id: communityId, ...toNameColumns(input) })
      .select(COLUMNS)
      .single();
    if (error) throw error;
    return toNomad(data as NomadRow);
  },

  update(id, input) {
    return updateRow(id, toNameColumns(input));
  },

  retire(id) {
    return updateRow(id, { status: 'retired', retired_at: new Date().toISOString() });
  },

  reactivate(id) {
    return updateRow(id, { status: 'active', retired_at: null });
  },

  async remove(id) {
    const { error, count } = await supabase
      .from('nomad')
      .delete({ count: 'exact' })
      .eq('id', id);
    if (error) throw error;
    if (count === 0) throw new Error('Nomad not found or not accessible');
  },
};