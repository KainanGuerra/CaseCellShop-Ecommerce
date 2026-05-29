export function useApiBase(): string {
  const config = useRuntimeConfig()
  if (import.meta.server) {
    const privateBase = (config as unknown as { apiBase?: string }).apiBase
    if (privateBase) return privateBase
  }
  return config.public.apiBase
}
