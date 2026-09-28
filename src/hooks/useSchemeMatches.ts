import { keepPreviousData, useQuery } from '@tanstack/react-query';
import {
  getAllSchemes,
  getMatchedSchemes,
  getNearMatchedSchemes,
} from '../services/schemesApi';

export function useSchemeMatches(userId: string | undefined) {
  return useQuery({
    queryKey: ['schemeMatches', userId],
    queryFn: () => getMatchedSchemes(userId as string),
    enabled: !!userId,
  });
}

// Nested under ['schemeMatches', userId] so existing match invalidations refresh it too.
export function useNearMatches(userId: string | undefined) {
  return useQuery({
    queryKey: ['schemeMatches', userId, 'near'],
    queryFn: () => getNearMatchedSchemes(userId as string),
    enabled: !!userId,
  });
}

export function useAllSchemes(searchQuery?: string) {
  const term = searchQuery?.trim() ?? '';
  return useQuery({
    queryKey: ['allSchemes', term],
    queryFn: () => getAllSchemes(term),
    // Keep showing the last results while a new search loads, instead of flashing skeletons.
    placeholderData: keepPreviousData,
  });
}
