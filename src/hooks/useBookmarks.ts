import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { addBookmark, getBookmarks, removeBookmark } from '../services/bookmarksApi';

export function useBookmarks(userId: string | undefined) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['bookmarks', userId],
    queryFn: () => getBookmarks(userId as string),
    enabled: !!userId,
  });

  const add = useMutation({
    mutationFn: (schemeId: string) => addBookmark(userId as string, schemeId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bookmarks', userId] }),
  });

  const remove = useMutation({
    mutationFn: (schemeId: string) => removeBookmark(userId as string, schemeId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bookmarks', userId] }),
  });

  return { ...query, addBookmark: add.mutate, removeBookmark: remove.mutate };
}
