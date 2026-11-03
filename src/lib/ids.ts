import { randomUUID } from 'expo-crypto';

// Client-side UUIDs: records get their id before reaching the server,
// which retries need now and offline sync (PowerSync) will need later.
export function newId(): string {
  return randomUUID();
}