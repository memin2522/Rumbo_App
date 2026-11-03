import { router, Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import {
    ActivityIndicator,
    Button,
    Card,
    Chip,
    Divider,
    HelperText,
    IconButton,
    Text,
} from 'react-native-paper';

import { LevelBadge } from '@/components/LevelBadge';
import { catalogRepository, type Catalog } from '@/features/catalog';
import { nomadRepository, type Nomad } from '@/features/nomads';
import {
    computePhase,
    currentAreaLevels,
    progressionRepository,
    type BadgeAward,
    type ProgressionRecord,
} from '@/features/progression';
import { getErrorMessage } from '@/lib/errors';

interface ProfileData {
  nomad: Nomad;
  catalog: Catalog;
  records: ProgressionRecord[];
  badges: BadgeAward[];
}

export default function NomadProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [data, setData] = useState<ProfileData | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [nomad, catalog, records, badges] = await Promise.all([
        nomadRepository.getById(id),
        catalogRepository.getCatalog(),
        progressionRepository.listRecords(id),
        progressionRepository.listBadges(id),
      ]);
      if (!nomad) {
        setNotFound(true);
        setData(null);
        return;
      }
      setData({ nomad, catalog, records, badges });
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [id]);

  // Reload after recording progression, awarding a badge or editing.
  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  // Derived view: catalog lookups, current level per area and phase.
  const view = useMemo(() => {
    if (!data) return null;
    const { catalog } = data;
    const areaLevels = currentAreaLevels(data.badges);
    return {
      phase: computePhase(areaLevels),
      areaLevels,
      areaById: new Map(catalog.growthAreas.map((a) => [a.id, a])),
      levelById: new Map(catalog.performanceLevels.map((l) => [l.id, l])),
      priorityById: new Map(catalog.educationalPriorities.map((p) => [p.id, p])),
      competencyById: new Map(catalog.competencies.map((c) => [c.id, c])),
      actionById: new Map(catalog.leaderActions.map((a) => [a.id, a])),
    };
  }, [data]);

  if (loading && !data) {
    return <ActivityIndicator style={styles.loader} />;
  }

  if (notFound || !data || !view) {
    return (
      <View style={styles.container}>
        <Text>{notFound ? 'No se encontró el Nómada.' : 'No se pudo cargar la ficha.'}</Text>
        <HelperText type="error" visible={error !== null}>
          {error}
        </HelperText>
      </View>
    );
  }

  const { nomad, catalog, records } = data;
  const isActive = nomad.status === 'active';

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Stack.Screen
        options={{
          title: `${nomad.firstName} ${nomad.lastName}`,
          headerRight: () => (
            <IconButton
              icon="pencil"
              accessibilityLabel="Editar datos"
              onPress={() => router.push({ pathname: '/nomads/[id]/edit', params: { id } })}
            />
          ),
        }}
      />

      <HelperText type="error" visible={error !== null}>
        {error}
      </HelperText>

      {/* Phase */}
      <Card mode="outlined" style={styles.section}>
        <Card.Content style={styles.phase}>
          <Text variant="labelLarge">Fase de progresión</Text>
          <Text variant="titleLarge">{view.phase.name}</Text>
          {!isActive ? <Chip compact style={styles.retired}>Retirado</Chip> : null}
        </Card.Content>
      </Card>

      {/* Actions */}
      {isActive ? (
        <View style={styles.actions}>
          <Button
            mode="contained"
            icon="clipboard-text"
            onPress={() => router.push({ pathname: '/nomads/[id]/record', params: { id } })}
          >
            Registrar progresión
          </Button>
          <Button
            mode="outlined"
            icon="shield-star"
            onPress={() => router.push({ pathname: '/nomads/[id]/badge', params: { id } })}
          >
            Otorgar insignia de rumbo
          </Button>
        </View>
      ) : null}

      {/* Growth areas */}
      <Text variant="titleMedium" style={styles.heading}>
        Rumbos
      </Text>
      <Card mode="outlined" style={styles.section}>
        {catalog.growthAreas.map((area, index) => {
          const levelId = view.areaLevels.get(area.id);
          return (
            <View key={area.id}>
              {index > 0 ? <Divider /> : null}
              <View style={styles.areaRow}>
                <View style={styles.areaText}>
                  <Text variant="bodyLarge">{area.name}</Text>
                  <Text variant="bodySmall" style={styles.muted}>
                    {area.symbolicName}
                  </Text>
                </View>
                <LevelBadge level={levelId ? (view.levelById.get(levelId) ?? null) : null} />
              </View>
            </View>
          );
        })}
      </Card>

      {/* History */}
      <Text variant="titleMedium" style={styles.heading}>
        Historial de progresión
      </Text>
      {records.length === 0 ? (
        <Text style={styles.muted}>Aún no hay registros.</Text>
      ) : (
        records.map((record) => {
          const competency = view.competencyById.get(record.competencyId);
          const priority = competency
            ? view.priorityById.get(competency.educationalPriorityId)
            : undefined;
          const area = priority ? view.areaById.get(priority.growthAreaId) : undefined;
          const level = view.levelById.get(record.performanceLevelId) ?? null;
          const strategies = record.leaderActionIds
            .map((actionId) => view.actionById.get(actionId)?.description)
            .filter((d): d is string => d !== undefined);

          return (
            <Card key={record.id} mode="outlined" style={styles.record}>
              <Card.Content style={styles.recordContent}>
                <View style={styles.recordHeader}>
                  <View style={styles.areaText}>
                    <Text variant="titleSmall">{priority?.name ?? 'Competencia'}</Text>
                    <Text variant="bodySmall" style={styles.muted}>
                      {area?.name}
                    </Text>
                  </View>
                  <LevelBadge level={level} />
                </View>
                <Text variant="bodyMedium">{record.observedBehavior}</Text>
                {strategies.length > 0 || record.otherStrategy ? (
                  <Text variant="bodySmall" style={styles.muted}>
                    {'Estrategias: ' +
                      [...strategies, ...(record.otherStrategy ? [record.otherStrategy] : [])].join(
                        '; ',
                      )}
                  </Text>
                ) : null}
                <Text variant="bodySmall" style={styles.muted}>
                  {`${new Date(record.recordedAt).toLocaleDateString('es-CO')} · ${record.recordedByName}`}
                </Text>
              </Card.Content>
            </Card>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 32 },
  loader: { marginTop: 32 },
  section: { marginBottom: 16 },
  phase: { gap: 4 },
  retired: { alignSelf: 'flex-start', marginTop: 8 },
  actions: { gap: 8, marginBottom: 16 },
  heading: { marginBottom: 8 },
  areaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    gap: 12,
  },
  areaText: { flex: 1 },
  muted: { opacity: 0.7 },
  record: { marginBottom: 8 },
  recordContent: { gap: 6 },
  recordHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
});