export type NomadStatus = 'active' | 'retired';

export interface Nomad {
  id: string;
  communityId: string;
  firstName: string;
  lastName: string;
  status: NomadStatus;
  retiredAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface NomadInput {
  firstName: string;
  lastName: string;
}