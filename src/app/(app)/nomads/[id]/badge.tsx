import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import {
  ActivityIndicator,
  Button,
  Card,
  Chip,
  HelperText,
  SegmentedButtons,
  Text,
} from 'react-native-paper';

import { LevelBadge } from '@/components/LevelBadge';
import { catalogRepository, type Catalog } from '@/features/catalog';
import {
  computePhase,
  currentAreaLevels,
  progressionRepository,
  type BadgeAward,
} from '@/features/progression';
import { getErrorMessage } from '@/lib/errors';
import { newId } from '@/lib/ids';

export default function AwardBadgeScreen() {
  const { id: nomadId } = useLocalSearchParams<{ id: string }>();
  // Generated once per form: a retry reuses it, so the badge is never duplicated.
  const [badgeId] = useState(newId);
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [badges, setBadges] = useState<BadgeAward[]>([]);
  const [areaId, setAreaId] = useState<number | null>(null);
  const [levelId, setLevelId] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([catalogRepository.getCatalog(), progressionRepository.listBadges(nomadId)])
      .then(([loadedCatalog, loadedBadges]) => {
        setCatalog(loadedCatalog);
        setBadges(loadedBadges);
      })
      .catch((e: unknown) => setError(getErrorMessage(e)));
  }, [nomadId]);

  const areaLevels = useMemo(() => currentAreaLevels(badges), [badges]);
  const currentPhase = useMemo(() => computePhase(areaLevels), [areaLevels]);

  // Preview of the phase the nomad would reach with this badge.
  const resultingPhase = useMemo(() => {
    if (areaId === null || levelId === null) return null;
    const next = new Map(areaLevels);
    next.set(areaId, levelId);
    return computePhase(next);
  }, [areaLevels, areaId, levelId]);

  const area = catalog?.growthAreas.find((a) => a.id === areaId);
  const level = catalog?.performanceLevels.find((l) => l.id === levelId);
  const currentLevelId = areaId !== null ? areaLevels.get(areaId) : undefined;
  const currentLevel = catalog?.performanceLevels.find((l) => l.id === currentLevelId) ?? null;
  const sameLevel = levelId !== null && levelId === currentLevelId;

  function handleAward() {
    setSubmitted(true);
    if (!area || !level || sameLevel) return;
    Alert.alert(
      'Otorgar insignia',
      `¿Otorgar el ${area.symbolicName} (${area.name}) en ${level.code} ${level.name}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Otorgar', onPress: () => void save() },
      ],
    );
  }

  async function save() {
    if (areaId === null || levelId === null) return;
    setSaving(true);
    setError(null);
    try {
      await progressionRepository.awardBadge({
        id: badgeId,
        nomadId,
        growthAreaId: areaId,
        performanceLevelId: levelId,
      });
      router.back();
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setSaving(false);
    }
  }

  if (!catalog) {
    return error ? (
      <View style={styles.container}>
        <HelperText type="error">{error}</HelperText>
      </View>
    ) : (
      <ActivityIndicator style={styles.loader} />
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text variant="bodySmall" style={styles.muted}>
        El nivel de cada rumbo lo define tu criterio, a partir de los comportamientos observados en
        sus competencias.
      </Text>

      {/* 1. Growth area */}
      <Text variant="titleSmall" style={styles.label}>
        Área de crecimiento
      </Text>
      <View style={styles.chips}>
        {catalog.growthAreas.map((a) => (
          <Chip
            key={a.id}
            mode="outlined"
            selected={a.id === areaId}
            onPress={() => setAreaId(a.id)}
          >
            {a.name}
          </Chip>
        ))}
      </View>
      {area ? (
        <View style={styles.currentRow}>
          <Text variant="bodyMedium">{`${area.symbolicName} · nivel actual:`}</Text>
          <LevelBadge level={currentLevel} />
        </View>
      ) : null}
      <HelperText type="error" visible={submitted && areaId === null}>
        Selecciona el área.
      </HelperText>

      {/* 2. Performance level */}
      <Text variant="titleSmall" style={styles.label}>
        Nuevo nivel
      </Text>
      <SegmentedButtons
        value={levelId?.toString() ?? ''}
        onValueChange={(value) => setLevelId(Number(value))}
        buttons={catalog.performanceLevels.map((l) => ({
          value: String(l.id),
          label: l.code,
        }))}
      />
      {level ? (
        <Text variant="bodySmall" style={styles.muted}>
          {level.name}
        </Text>
      ) : null}
      <HelperText type="error" visible={submitted && (levelId === null || sameLevel)}>
        {sameLevel ? 'El área ya tiene ese nivel.' : 'Selecciona el nivel.'}
      </HelperText>

      {/* 3. Phase preview */}
      <Card mode="outlined" style={styles.preview}>
        <Card.Content style={styles.previewContent}>
          <Text variant="labelLarge">Fase actual</Text>
          <Text variant="bodyLarge">{currentPhase.name}</Text>
          {resultingPhase && resultingPhase.code !== currentPhase.code ? (
            <>
              <Text variant="labelLarge" style={styles.previewNext}>
                Fase con esta insignia
              </Text>
              <Text variant="bodyLarge">{resultingPhase.name}</Text>
            </>
          ) : null}
        </Card.Content>
      </Card>

      <HelperText type="error" visible={error !== null}>
        {error}
      </HelperText>
      <Button mode="contained" onPress={handleAward} loading={saving} disabled={saving}>
        Otorgar insignia
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 32 },
  loader: { marginTop: 32 },
  muted: { opacity: 0.7, marginTop: 4 },
  label: { marginTop: 12, marginBottom: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  currentRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 },
  preview: { marginTop: 8, marginBottom: 8 },
  previewContent: { gap: 2 },
  previewNext: { marginTop: 8 },
});