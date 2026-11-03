export function getErrorMessage(error: unknown): string {
  const raw =
    error !== null &&
    typeof error === 'object' &&
    'message' in error &&
    typeof error.message === 'string'
      ? error.message
      : '';

  if (__DEV__ && raw) {
    console.warn('[backend error]', raw);
  }

  if (raw.includes('Invalid login credentials')) {
    return 'Correo o contraseña incorrectos.';
  }
  if (raw.includes('Network request failed') || raw.includes('Failed to fetch')) {
    return 'Sin conexión. Verifica tu red e intenta de nuevo.';
  }
  return 'No se pudo completar la operación. Intenta de nuevo.';
}