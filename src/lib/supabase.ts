import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
  const { data, error } = await supabase
    .from('campamento_cache')
    .select('data')
    .eq('cache_key', cacheKey)
    .single();

  if (error || !data) {
    return null;
  }

  return data.data as T;
}

export async function setCachedData<T>(cacheKey: string, cacheData: T): Promise<boolean> {
  const { error } = await supabase
    .from('campamento_cache')
    .upsert({
      cache_key: cacheKey,
      data: cacheData,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'cache_key',
    });

  return !error;
}

export async function deleteCachedData(cacheKey: string): Promise<boolean> {
  const { error } = await supabase
    .from('campamento_cache')
    .delete()
    .eq('cache_key', cacheKey);

  return !error;
}

export async function getCacheInfo(cacheKey: string): Promise<{ exists: boolean; updatedAt: string | null }> {
  const { data, error } = await supabase
    .from('campamento_cache')
    .select('updated_at')
    .eq('cache_key', cacheKey)
    .single();

  if (error || !data) {
    return { exists: false, updatedAt: null };
  }

  return { exists: true, updatedAt: data.updated_at };
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
