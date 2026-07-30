import { useQuery } from '@tanstack/react-query';
import { getMatchedSchemes } from '../services/schemesApi';
import { getAllSchemes } from '../services/schemesApi';

export function useSchemeMatches(userId: string | undefined) {
  return useQuery({
    queryKey: ['schemeMatches', userId],
    queryFn: () => getMatchedSchemes(userId as string),
    enabled: !!userId,
  });
}

export function useAllSchemes(searchQuery?: string) {
  return useQuery({
    queryKey: ['allSchemes', searchQuery],
    queryFn: () => getAllSchemes(searchQuery),
  });
}
