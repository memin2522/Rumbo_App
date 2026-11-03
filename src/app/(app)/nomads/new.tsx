import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { HelperText } from 'react-native-paper';

import { NomadForm } from '@/components/NomadForm';
import { useAuth } from '@/context/AuthContext';
import { nomadRepository, type NomadInput } from '@/features/nomads';
import { getErrorMessage } from '@/lib/errors';

export default function NewNomadScreen() {
  const { leader } = useAuth();
  const [error, setError] = useState<string | null>(null);

  async function handleCreate(input: NomadInput) {
    if (!leader) return;
    setError(null);
    try {
      await nomadRepository.create(leader.communityId, input);
      router.back();
    } catch (e) {
      setError(getErrorMessage(e));
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <NomadForm submitLabel="Inscribir" onSubmit={handleCreate} />
      <HelperText type="error" visible={error !== null}>
        {error}
      </HelperText>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
});