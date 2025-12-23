import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

console.log('[Supabase] URL:', supabaseUrl);
console.log('[Supabase] Key length:', supabaseAnonKey.length);

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  db: {
    schema: 'public',
  },
  global: {
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
    },
  },
});

// Tipos para el caché
export interface CampamentoCache {
  id: number;
  cache_key: string;
  data: unknown;
  created_at: string;
  updated_at: string;
}

// Tipos para roles de usuario
export type UserRole = 'super_admin' | 'campamento' | 'compensaciones';

export interface UserRoleRecord {
  id: number;
  user_id: string;
  email: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

// Funciones de caché
export async function getCachedData<T>(cacheKey: string): Promise<T | null> {
  try {
    console.log(`[Supabase Cache] Buscando caché para: ${cacheKey}`);
    // Usar .maybeSingle() en lugar de .single() para evitar error cuando no hay datos
    const { data, error, status } = await supabase
      .from('campamento_cache')
      .select('data')
      .eq('cache_key', cacheKey)
      .maybeSingle();

    if (error) {
      console.log(`[Supabase Cache] Error (${status}):`, error.message, error.code);
      return null;
    }

    if (!data) {
      console.log(`[Supabase Cache] No hay caché para: ${cacheKey} (primera vez)`);
      return null;
    }

    console.log(`[Supabase Cache] Datos encontrados para: ${cacheKey}`);
    return data.data as T;
  } catch (err) {
    console.error('[Supabase Cache] Error inesperado en getCachedData:', err);
    return null;
  }
}

export async function setCachedData<T>(cacheKey: string, cacheData: T): Promise<boolean> {
  try {
    console.log(`[Supabase Cache] Guardando caché para: ${cacheKey}`);
    const { error, status } = await supabase
      .from('campamento_cache')
      .upsert({
        cache_key: cacheKey,
        data: cacheData,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'cache_key',
      });

    if (error) {
      console.error(`[Supabase Cache] Error al guardar (${status}):`, error.message, error.code);
      return false;
    }

    console.log(`[Supabase Cache] Datos guardados exitosamente para: ${cacheKey}`);
    return true;
  } catch (err) {
    console.error('[Supabase Cache] Error inesperado en setCachedData:', err);
    return false;
  }
}

export async function deleteCachedData(cacheKey: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('campamento_cache')
      .delete()
      .eq('cache_key', cacheKey);

    return !error;
  } catch (err) {
    console.error('[Supabase Cache] Error en deleteCachedData:', err);
    return false;
  }
}

export async function getCacheInfo(cacheKey: string): Promise<{ exists: boolean; updatedAt: string | null }> {
  try {
    // Usar .maybeSingle() para evitar error 406 cuando no hay datos
    const { data, error } = await supabase
      .from('campamento_cache')
      .select('updated_at')
      .eq('cache_key', cacheKey)
      .maybeSingle();

    if (error || !data) {
      return { exists: false, updatedAt: null };
    }

    return { exists: true, updatedAt: data.updated_at };
  } catch (err) {
    console.error('[Supabase Cache] Error en getCacheInfo:', err);
    return { exists: false, updatedAt: null };
  }
}

// Funciones de roles de usuario
export async function getUserRole(userId: string): Promise<UserRole | null> {
  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .single();

  if (error || !data) {
    return null;
  }

  return data.role as UserRole;
}

export async function getUserRoleByEmail(email: string): Promise<UserRole | null> {
  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('email', email)
    .single();

  if (error || !data) {
    return null;
  }

  return data.role as UserRole;
}

// Verificar permisos
export function hasAccessTo(role: UserRole | null, module: 'campamento' | 'compensaciones'): boolean {
  if (!role) return false;
  if (role === 'super_admin') return true;
  return role === module;
}
