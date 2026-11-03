import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import {
  ActivityIndicator,
  Button,
  Checkbox,
  Chip,
  HelperText,
  RadioButton,
  SegmentedButtons,
  Text,
  TextInput,
} from 'react-native-paper';

import { catalogRepository, type Catalog } from '@/features/catalog';
import { progressionRepository } from '@/features/progression';
import { getErrorMessage } from '@/lib/errors';
import { newId } from '@/lib/ids';

const MAX_BEHAVIOR_LENGTH = 1000;
const MAX_OTHER_STRATEGY_LENGTH = 500;

export default function RecordProgressionScreen() {
  const { id: nomadId } = useLocalSearchParams<{ id: string }>();
  // Generated once per form: a retry after a failure reuses it,
  // so the record is never duplicated.
  const [recordId] = useState(newId);
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [areaId, setAreaId] = useState<number | null>(null);
  const [competencyId, setCompetencyId] = useState<number | null>(null);
  const [levelId, setLevelId] = useState<number | null>(null);
  const [behavior, setBehavior] = useState('');
  const [actionIds, setActionIds] = useState<number[]>([]);
  const [otherStrategy, setOtherStrategy] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    catalogRepository
      .getCatalog()
      .then(setCatalog)
      .catch((e: unknown) => setError(getErrorMessage(e)));
  }, []);

  // Competencies of the selected area, in the order of the Guía.
  const competencyOptions = useMemo(() => {
    if (!catalog || areaId === null) return [];
    return catalog.educationalPriorities
      .filter((p) => p.growthAreaId === areaId)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .flatMap((priority) =>
        catalog.competencies
          .filter((c) => c.educationalPriorityId === priority.id)
          .map((competency) => ({ competency, priorityName: priority.name })),
      );
  }, [catalog, areaId]);

  const selectedCompetency = competencyOptions.find(
    (o) => o.competency.id === competencyId,
  )?.competency;
  const selectedLevel = catalog?.performanceLevels.find((l) => l.id === levelId);
  const levelActions =
    catalog && levelId !== null
      ? catalog.leaderActions.filter((a) => a.performanceLevelId === levelId)
      : [];

  const competencyMissing = competencyId === null;
  const levelMissing = levelId === null;
  const behaviorMissing = behavior.trim().length === 0;

  function selectArea(id: number) {
    setAreaId(id);
    setCompetencyId(null);
  }

  function selectLevel(value: string) {
    setLevelId(Number(value));
    // Leader actions belong to a level: changing the level clears them.
    setActionIds([]);
  }

  function toggleAction(id: number) {
    setActionIds((current) =>
      current.includes(id) ? current.filter((a) => a !== id) : [...current, id],
    );
  }

  async function handleSave() {
    setSubmitted(true);
    if (competencyId === null || levelId === null || behaviorMissing) return;
    setSaving(true);
    setError(null);
    try {
      await progressionRepository.createRecord({
        id: recordId,
        nomadId,
        competencyId,
        performanceLevelId: levelId,
        observedBehavior: behavior,
        otherStrategy: otherStrategy.trim() || null,
        leaderActionIds: actionIds,
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
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      {/* 1. Growth area */}
      <Text variant="titleSmall" style={styles.label}>
        Área de crecimiento
      </Text>
      <View style={styles.chips}>
        {catalog.growthAreas.map((area) => (
          <Chip
            key={area.id}
            mode="outlined"
            selected={area.id === areaId}
            onPress={() => selectArea(area.id)}
          >
            {area.name}
          </Chip>
        ))}
      </View>

      {/* 2. Competency */}
      {areaId !== null ? (
        <>
          <Text variant="titleSmall" style={styles.label}>
            Competencia
          </Text>
          <RadioButton.Group
            value={competencyId?.toString() ?? ''}
            onValueChange={(value) => setCompetencyId(Number(value))}
          >
            {competencyOptions.map(({ competency, priorityName }) => (
              <RadioButton.Item
                key={competency.id}
                label={priorityName}
                value={String(competency.id)}
                style={styles.compactItem}
              />
            ))}
          </RadioButton.Group>
          {selectedCompetency ? (
            <Text variant="bodySmall" style={styles.description}>
              {selectedCompetency.description}
            </Text>
          ) : null}
        </>
      ) : null}
      <HelperText type="error" visible={submitted && competencyMissing}>
        Selecciona el área y la competencia.
      </HelperText>

      {/* 3. Performance level */}
      <Text variant="titleSmall" style={styles.label}>
        Nivel de desempeño
      </Text>
      <SegmentedButtons
        value={levelId?.toString() ?? ''}
        onValueChange={selectLevel}
        buttons={catalog.performanceLevels.map((level) => ({
          value: String(level.id),
          label: level.code,
        }))}
      />
      {selectedLevel ? (
        <Text variant="bodySmall" style={styles.description}>
          {`${selectedLevel.name} · Papel del adulto: ${selectedLevel.adultRole}`}
        </Text>
      ) : null}
      <HelperText type="error" visible={submitted && levelMissing}>
        Selecciona el nivel.
      </HelperText>

      {/* 4. Observed behavior */}
      <TextInput
        label="Comportamiento observado"
        mode="outlined"
        multiline
        numberOfLines={4}
        value={behavior}
        onChangeText={setBehavior}
        maxLength={MAX_BEHAVIOR_LENGTH}
        error={submitted && behaviorMissing}
      />
      <HelperText type={submitted && behaviorMissing ? 'error' : 'info'} visible>
        {submitted && behaviorMissing
          ? 'Describe el comportamiento observado.'
          : 'Describe lo observado. No incluyas datos de salud ni otros datos sensibles.'}
      </HelperText>

      {/* 5. Leader actions */}
      {levelActions.length > 0 ? (
        <>
          <Text variant="titleSmall" style={styles.label}>
            {`Estrategias aplicadas (${selectedLevel?.adultRole ?? ''})`}
          </Text>
          {levelActions.map((action) => (
            <Checkbox.Item
              key={action.id}
              label={action.description}
              status={actionIds.includes(action.id) ? 'checked' : 'unchecked'}
              onPress={() => toggleAction(action.id)}
              style={styles.compactItem}
            />
          ))}
        </>
      ) : null}

      <TextInput
        label="Otra estrategia (opcional)"
        mode="outlined"
        multiline
        value={otherStrategy}
        onChangeText={setOtherStrategy}
        maxLength={MAX_OTHER_STRATEGY_LENGTH}
        style={styles.otherStrategy}
      />

      <HelperText type="error" visible={error !== null}>
        {error}
      </HelperText>
      <Button mode="contained" onPress={handleSave} loading={saving} disabled={saving}>
        Guardar registro
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 32 },
  loader: { marginTop: 32 },
  label: { marginTop: 8, marginBottom: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  compactItem: { paddingVertical: 2 },
  description: { opacity: 0.7, marginTop: 4 },
  otherStrategy: { marginTop: 8 },
});