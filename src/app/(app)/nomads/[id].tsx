import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Button, Divider, HelperText, Text } from 'react-native-paper';

import { NomadForm } from '@/components/NomadForm';
import { nomadRepository, type Nomad, type NomadInput } from '@/features/nomads';
import { getErrorMessage } from '@/lib/errors';

export default function EditNomadScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [nomad, setNomad] = useState<Nomad | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    nomadRepository
      .getById(id)
      .then((result) => {
        if (!cancelled) setNomad(result);
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(getErrorMessage(e));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const run = useCallback(async (action: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await action();
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setBusy(false);
    }
  }, []);

  async function handleUpdate(input: NomadInput) {
    await run(async () => {
      await nomadRepository.update(id, input);
      router.back();
    });
  }

  function handleToggleStatus() {
    if (!nomad) return;
    if (nomad.status === 'retired') {
      void run(async () => setNomad(await nomadRepository.reactivate(id)));
      return;
    }
    Alert.alert(
      'Retirar Nómada',
      'El Nómada dejará de aparecer en la lista de activos. Su información se conserva y puede reactivarse.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Retirar',
          onPress: () => void run(async () => setNomad(await nomadRepository.retire(id))),
        },
      ],
    );
  }

  function handleDelete() {
    Alert.alert(
      'Eliminar Nómada',
      'Se eliminará de forma permanente toda la información del Nómada, incluida su progresión. Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () =>
            void run(async () => {
              await nomadRepository.remove(id);
              router.back();
            }),
        },
      ],
    );
  }

  if (loading) {
    return <ActivityIndicator style={styles.loader} />;
  }

  if (!nomad) {
    return (
      <View style={styles.container}>
        <Text>No se encontró el Nómada.</Text>
        <HelperText type="error" visible={error !== null}>
          {error}
        </HelperText>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      {nomad.status === 'retired' && nomad.retiredAt ? (
        <Text variant="bodyMedium" style={styles.status}>
          Retirado el {new Date(nomad.retiredAt).toLocaleDateString('es-CO')}
        </Text>
      ) : null}

      <NomadForm
        initialValues={{ firstName: nomad.firstName, lastName: nomad.lastName }}
        submitLabel="Guardar cambios"
        onSubmit={handleUpdate}
      />

      <HelperText type="error" visible={error !== null}>
        {error}
      </HelperText>

      <Divider style={styles.divider} />

      <View style={styles.actions}>
        <Button mode="outlined" onPress={handleToggleStatus} disabled={busy}>
          {nomad.status === 'retired' ? 'Reactivar' : 'Retirar'}
        </Button>
        <Button mode="text" textColor="#B3261E" onPress={handleDelete} disabled={busy}>
          Eliminar definitivamente
        </Button>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  loader: { marginTop: 32 },
  status: { marginBottom: 12, opacity: 0.7 },
  divider: { marginVertical: 16 },
  actions: { gap: 8 },
});