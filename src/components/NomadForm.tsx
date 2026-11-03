import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, HelperText, Text, TextInput } from 'react-native-paper';

import type { NomadInput } from '@/features/nomads';

const MAX_NAME_LENGTH = 80;

interface NomadFormProps {
  initialValues?: NomadInput;
  submitLabel: string;
  onSubmit: (input: NomadInput) => Promise<void>;
}

export function NomadForm({ initialValues, submitLabel, onSubmit }: NomadFormProps) {
  const [firstName, setFirstName] = useState(initialValues?.firstName ?? '');
  const [lastName, setLastName] = useState(initialValues?.lastName ?? '');
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);

  const firstNameMissing = firstName.trim().length === 0;
  const lastNameMissing = lastName.trim().length === 0;

  async function handleSubmit() {
    setSubmitted(true);
    if (firstNameMissing || lastNameMissing) return;
    setSaving(true);
    try {
      await onSubmit({ firstName, lastName });
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={styles.container}>
      <TextInput
        label="Nombres"
        mode="outlined"
        value={firstName}
        onChangeText={setFirstName}
        maxLength={MAX_NAME_LENGTH}
        autoCapitalize="words"
        error={submitted && firstNameMissing}
      />
      <HelperText type="error" visible={submitted && firstNameMissing}>
        Ingresa los nombres.
      </HelperText>

      <TextInput
        label="Apellidos"
        mode="outlined"
        value={lastName}
        onChangeText={setLastName}
        maxLength={MAX_NAME_LENGTH}
        autoCapitalize="words"
        error={submitted && lastNameMissing}
      />
      <HelperText type="error" visible={submitted && lastNameMissing}>
        Ingresa los apellidos.
      </HelperText>

      <Text variant="bodySmall" style={styles.notice}>
        Registra solo Nómadas inscritos en la ASC. No incluyas otros datos personales.
      </Text>

      <Button mode="contained" onPress={handleSubmit} loading={saving} disabled={saving}>
        {submitLabel}
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 4 },
  notice: { marginBottom: 16, opacity: 0.7 },
});