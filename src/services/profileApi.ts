import { supabase } from './supabase';
import { Profile, ProfileInput } from '../types/profile';

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function upsertProfile(
  userId: string,
  profile: Partial<ProfileInput>
): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .upsert({ id: userId, ...profile })
    .select()
    .single();

  if (error) throw error;
  return data;
}
