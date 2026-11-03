import { router, Stack, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import {
  ActivityIndicator,
  Chip,
  Divider,
  FAB,
  HelperText,
  IconButton,
  List,
  Switch,
  Text,
} from 'react-native-paper';

import { useAuth } from '@/context/AuthContext';
import { nomadRepository, type Nomad } from '@/features/nomads';
import { getErrorMessage } from '@/lib/errors';

export default function NomadListScreen() {
  const { leader, signOut } = useAuth();
  const [nomads, setNomads] = useState<Nomad[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showRetired, setShowRetired] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setNomads(await nomadRepository.list());
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  // Reload whenever the screen regains focus (after create/edit/delete).
  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const visible = useMemo(
    () => (showRetired ? nomads : nomads.filter((n) => n.status === 'active')),
    [nomads, showRetired],
  );

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerRight: () => (
            <IconButton icon="logout" accessibilityLabel="Cerrar sesión" onPress={signOut} />
          ),
        }}
      />

      <View style={styles.toolbar}>
        <Text variant="titleMedium">{leader?.communityName}</Text>
        <View style={styles.switchRow}>
          <Text variant="bodySmall">Mostrar retirados</Text>
          <Switch value={showRetired} onValueChange={setShowRetired} />
        </View>
      </View>
      <HelperText type="error" visible={error !== null}>
        {error}
      </HelperText>

      {loading && nomads.length === 0 ? (
        <ActivityIndicator style={styles.loader} />
      ) : (
        <FlatList
          data={visible}
          keyExtractor={(item) => item.id}
          ItemSeparatorComponent={Divider}
          refreshing={loading}
          onRefresh={load}
          ListEmptyComponent={
            <Text style={styles.empty}>No hay Nómadas registrados.</Text>
          }
          renderItem={({ item }) => (
            <List.Item
              title={`${item.lastName}, ${item.firstName}`}
              left={(props) => <List.Icon {...props} icon="account" />}
              right={() =>
                item.status === 'retired' ? (
                  <Chip compact style={styles.chip}>
                    Retirado
                  </Chip>
                ) : null
              }
              onPress={() =>
                router.push({ pathname: '/nomads/[id]', params: { id: item.id } })
              }
            />
          )}
          contentContainerStyle={styles.listContent}
        />
      )}

      <FAB
        icon="plus"
        label="Inscribir"
        style={styles.fab}
        onPress={() => router.push('/nomads/new')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  loader: { marginTop: 32 },
  empty: { textAlign: 'center', marginTop: 32, opacity: 0.7 },
  chip: { alignSelf: 'center' },
  listContent: { paddingBottom: 96 },
  fab: { position: 'absolute', right: 16, bottom: 24 },
});