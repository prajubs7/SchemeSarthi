import { useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { addBookmark, getBookmarks, removeBookmark } from '../services/bookmarksApi';
import { BookmarkWithScheme, Scheme } from '../types/scheme';

export function useBookmarks(userId: string | undefined) {
  const queryClient = useQueryClient();
  const queryKey = ['bookmarks', userId];

  const query = useQuery({
    queryKey,
    queryFn: () => getBookmarks(userId as string),
    enabled: !!userId,
  });

  // Optimistic updates: change the cached list right away, roll back if the request fails,
  // and refetch either way so the cache ends up matching the server.
  const updateCache = async (
    update: (list: BookmarkWithScheme[]) => BookmarkWithScheme[],
  ) => {
    await queryClient.cancelQueries({ queryKey });
    const previous = queryClient.getQueryData<BookmarkWithScheme[]>(queryKey);
    queryClient.setQueryData<BookmarkWithScheme[]>(queryKey, update(previous ?? []));
    return { previous };
  };
  const rollback = (
    _error: unknown,
    _variables: unknown,
    context: { previous?: BookmarkWithScheme[] } | undefined,
  ) => queryClient.setQueryData(queryKey, context?.previous);
  const refetch = () => queryClient.invalidateQueries({ queryKey });

  const add = useMutation({
    mutationFn: (scheme: Scheme) => addBookmark(userId as string, scheme.id),
    onMutate: (scheme: Scheme) =>
      updateCache(list => [
        { created_at: new Date().toISOString(), notes: null, schemes: scheme },
        ...list.filter(b => b.schemes.id !== scheme.id),
      ]),
    onError: rollback,
    onSettled: refetch,
  });

  const remove = useMutation({
    mutationFn: (schemeId: string) => removeBookmark(userId as string, schemeId),
    onMutate: (schemeId: string) =>
      updateCache(list => list.filter(b => b.schemes.id !== schemeId)),
    onError: rollback,
    onSettled: refetch,
  });

  const { data } = query;
  const isBookmarked = useCallback(
    (schemeId: string) => !!data?.some(b => b.schemes.id === schemeId),
    [data],
  );

  return {
    ...query,
    isBookmarked,
    addBookmark: add.mutate,
    removeBookmark: remove.mutate,
  };
}
