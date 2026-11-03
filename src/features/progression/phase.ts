import type { BadgeAward } from './types';

export type PhaseCode = 'aspirante' | 'caminante' | 'pionero' | 'visionario' | 'lider';

export interface Phase {
  code: PhaseCode;
  name: string;
}

// Phase names from the Guía de Dirigente de Comunidad (p. 34, 36-37).
const PHASE_NAMES: Record<PhaseCode, string> = {
  aspirante: 'Aspirante',
  caminante: 'Nómada Caminante de los Bosques',
  pionero: 'Nómada Pionero de la Montaña',
  visionario: 'Nómada Visionario de los Ríos',
  lider: 'Nómada Líder del Sol',
};

// Phase rules (Guía, p. 36-37), expressed as the minimum number of growth
// areas at or above each performance level (1 = N1, 2 = N2, 3 = N3).
// An area at a higher level has already passed the lower ones, so it counts
// towards them too: "3 en Exploración y 1 en Aplicación" means at least
// 4 areas at N1 or above, of which at least 1 is at N2 or above.
const PHASE_REQUIREMENTS: { code: PhaseCode; minAreas: Record<1 | 2 | 3, number> }[] = [
  { code: 'lider', minAreas: { 1: 6, 2: 6, 3: 6 } },
  { code: 'visionario', minAreas: { 1: 6, 2: 6, 3: 3 } },
  { code: 'pionero', minAreas: { 1: 6, 2: 3, 3: 0 } },
  { code: 'caminante', minAreas: { 1: 4, 2: 1, 3: 0 } },
];

// Current level of each growth area: the most recently awarded badge,
// which reflects the leader's current judgment.
export function currentAreaLevels(badges: BadgeAward[]): Map<number, number> {
  const latest = new Map<number, BadgeAward>();
  for (const badge of badges) {
    const previous = latest.get(badge.growthAreaId);
    if (!previous || Date.parse(badge.awardedAt) > Date.parse(previous.awardedAt)) {
      latest.set(badge.growthAreaId, badge);
    }
  }
  return new Map([...latest].map(([areaId, badge]) => [areaId, badge.performanceLevelId]));
}

export function computePhase(areaLevels: Map<number, number>): Phase {
  const levels = [...areaLevels.values()];
  const countAtOrAbove = (level: number) => levels.filter((l) => l >= level).length;

  const reached = PHASE_REQUIREMENTS.find(
    ({ minAreas }) =>
      countAtOrAbove(1) >= minAreas[1] &&
      countAtOrAbove(2) >= minAreas[2] &&
      countAtOrAbove(3) >= minAreas[3],
  );
  const code = reached?.code ?? 'aspirante';
  return { code, name: PHASE_NAMES[code] };
}