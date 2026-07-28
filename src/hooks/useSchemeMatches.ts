import { useQuery } from '@tanstack/react-query';
import { getMatchedSchemes } from '../services/schemesApi';

export function useSchemeMatches(userId: string | undefined) {
  return useQuery({
    queryKey: ['schemeMatches', userId],
    queryFn: () => getMatchedSchemes(userId as string),
    enabled: !!userId,
  });
}
