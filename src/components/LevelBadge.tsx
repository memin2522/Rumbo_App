import { Chip } from 'react-native-paper';

import type { PerformanceLevel } from '@/features/catalog';

// Badge colors named in the Guía (p. 33-34): amarillo mostaza (N1),
// mandarina cálido (N2), rojo coral (N3). Hex values are approximations.
const LEVEL_COLORS: Record<number, { background: string; text: string }> = {
  1: { background: '#D4A72C', text: '#2B2200' },
  2: { background: '#F28C38', text: '#2B1300' },
  3: { background: '#E9636B', text: '#2D0A0C' },
};

interface LevelBadgeProps {
  level: PerformanceLevel | null;
}

export function LevelBadge({ level }: LevelBadgeProps) {
  if (!level) {
    return <Chip compact>Sin insignia</Chip>;
  }
  const colors = LEVEL_COLORS[level.id];
  return (
    <Chip compact style={{ backgroundColor: colors.background }} textStyle={{ color: colors.text }}>
      {`${level.code} ${level.name}`}
    </Chip>
  );
}