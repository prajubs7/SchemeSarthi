import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useDispatch } from 'react-redux';
import { getProfile } from '../services/profileApi';
import { clearProfile, setProfile } from '../store/slices/profileSlice';

// Loads the signed-in user's profile from Supabase and mirrors it into Redux,
// so screens reading state.profile have it after an app restart.
export function useProfile(userId: string | undefined) {
  const dispatch = useDispatch();

  const query = useQuery({
    queryKey: ['profile', userId],
    queryFn: () => getProfile(userId as string),
    enabled: !!userId,
  });

  useEffect(() => {
    if (!userId) {
      dispatch(clearProfile());
      return;
    }
    if (query.data) dispatch(setProfile(query.data));
  }, [dispatch, userId, query.data]);

  return query;
}
