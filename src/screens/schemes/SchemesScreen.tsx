import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { useSelector } from 'react-redux';
import { useQueryClient } from '@tanstack/react-query';
import SchemeListCard from '../../components/scheme/SchemeListCard';
import {
  AppText,
  ChipGroup,
  ChipOption,
  EmptyState,
  ErrorState,
  SchemeCardSkeleton,
  Screen,
  ScreenHeader,
  TextField,
} from '../../components/ui';
import { colors, spacing } from '../../theme';
import { Scheme } from '../../types/scheme';
import { useAuth } from '../../hooks/useAuth';
import { useAllSchemes, useSchemeMatches } from '../../hooks/useSchemeMatches';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import {
  findSchemeCategory,
  SCHEME_CATEGORIES,
  SchemeCategoryKey,
  schemeInCategory,
} from '../../constants/schemeCategories';
import { RootState } from '../../store';
import { MainTabScreenProps } from '../../navigation/types';

type Props = MainTabScreenProps<'SchemeTab'>;

type FilterKey = 'all' | 'matched' | 'central' | 'state' | SchemeCategoryKey;
type SortKey = 'az' | 'recent';

const SEARCH_DEBOUNCE_MS = 350;
const SKELETON_COUNT = 4;

const FILTER_OPTIONS: ChipOption<FilterKey>[] = [
  { value: 'all', label: 'All' },
  { value: 'matched', label: 'Matched for me', icon: 'checkmark-circle-outline' },
  { value: 'central', label: 'Central', icon: 'business-outline' },
  { value: 'state', label: 'State', icon: 'location-outline' },
  ...SCHEME_CATEGORIES.map(c => ({ value: c.key, label: c.label, icon: c.icon })),
];

const SORT_OPTIONS: ChipOption<SortKey>[] = [
  { value: 'az', label: 'A–Z' },
  { value: 'recent', label: 'Recently added' },
];

function applyFilter(
  schemes: Scheme[],
  filter: FilterKey,
  matchedIds: Set<string>,
): Scheme[] {
  switch (filter) {
    case 'all':
      return schemes;
    case 'matched':
      return schemes.filter(s => matchedIds.has(s.id));
    case 'central':
    case 'state':
      return schemes.filter(s => s.scheme_level === filter);
    default: {
      const category = findSchemeCategory(filter);
      return category ? schemes.filter(s => schemeInCategory(s, category)) : schemes;
    }
  }
}

function applySort(schemes: Scheme[], sort: SortKey): Scheme[] {
  const sorted = [...schemes];
  if (sort === 'recent') {
    sorted.sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));
  } else {
    sorted.sort((a, b) => a.title.localeCompare(b.title));
  }
  return sorted;
}

const pluralSchemes = (n: number) => `${n} ${n === 1 ? 'scheme' : 'schemes'}`;

export default function SchemesScreen({ navigation, route }: Props) {
  const { user } = useAuth();
  const userAge = useSelector((state: RootState) => state.profile.profile?.age);
  const queryClient = useQueryClient();

  const initialCategory = route.params?.initialCategory;
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterKey>(
    () => findSchemeCategory(initialCategory)?.key ?? 'all',
  );
  const [sort, setSort] = useState<SortKey>('az');
  const [refreshing, setRefreshing] = useState(false);
  const debouncedSearch = useDebouncedValue(search, SEARCH_DEBOUNCE_MS);

  const schemesQuery = useAllSchemes(debouncedSearch);
  // The unsearched catalogue, for the header count. Shares the cache entry when not searching.
  const catalogQuery = useAllSchemes();
  const matchesQuery = useSchemeMatches(user?.id);

  // Home's category tiles land here with a category. Consume the param so tapping the same
  // tile again (while this tab stays mounted) re-applies it.
  useEffect(() => {
    if (!initialCategory) return;
    const category = findSchemeCategory(initialCategory);
    if (category) {
      setFilter(category.key);
    } else {
      setSearch(initialCategory);
    }
    navigation.setParams({ initialCategory: undefined });
  }, [initialCategory, navigation]);

  const matchedIds = useMemo(
    () => new Set((matchesQuery.data ?? []).map(m => m.id)),
    [matchesQuery.data],
  );

  const visible = useMemo(
    () => applySort(applyFilter(schemesQuery.data ?? [], filter, matchedIds), sort),
    [schemesQuery.data, filter, matchedIds, sort],
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['allSchemes'] }),
        queryClient.invalidateQueries({ queryKey: ['schemeMatches'] }),
      ]);
    } finally {
      setRefreshing(false);
    }
  }, [queryClient]);

  const clearFilters = useCallback(() => {
    setSearch('');
    setFilter('all');
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: Scheme }) => (
      <SchemeListCard
        scheme={item}
        matched={matchedIds.has(item.id)}
        userAge={userAge}
        onPress={() => navigation.navigate('SchemeDetail', { schemeId: item.id })}
      />
    ),
    [matchedIds, userAge, navigation],
  );

  const total = catalogQuery.data?.length;
  const subtitle =
    total === undefined
      ? 'Schemes available in Maharashtra and across India'
      : `${pluralSchemes(total)} available in Maharashtra and across India`;

  const filtersActive = search.trim().length > 0 || filter !== 'all';
  const waitingForMatches = filter === 'matched' && !!user && matchesQuery.isPending;
  const loading = schemesQuery.isPending || waitingForMatches;
  const failedQuery =
    schemesQuery.isError && !schemesQuery.data
      ? schemesQuery
      : filter === 'matched' && matchesQuery.isError
      ? matchesQuery
      : null;
  const filterLabel = FILTER_OPTIONS.find(o => o.value === filter)?.label;

  let emptyContent: React.ReactElement;
  if (loading) {
    emptyContent = (
      <View accessibilityLabel="Loading schemes">
        {Array.from({ length: SKELETON_COUNT }, (_, i) => (
          <SchemeCardSkeleton key={i} style={styles.skeleton} />
        ))}
      </View>
    );
  } else if (failedQuery) {
    emptyContent = (
      <ErrorState
        message="We couldn't load schemes. Check your internet connection and try again."
        onRetry={() => failedQuery.refetch()}
      />
    );
  } else if (filtersActive) {
    emptyContent = (
      <EmptyState
        icon="search-outline"
        title="No schemes found"
        subtitle={
          filter === 'matched' && matchedIds.size === 0
            ? "No schemes match your profile yet. Keeping your profile up to date helps us find more."
            : 'Try a different search word or filter.'
        }
        actionLabel="Clear filters"
        onAction={clearFilters}
      />
    );
  } else {
    emptyContent = (
      <EmptyState
        title="No schemes yet"
        subtitle="Check back soon. More schemes are being added."
      />
    );
  }

  const listHeader =
    visible.length > 0 ? (
      <View style={styles.resultsRow}>
        <AppText
          variant="bodySm"
          color="textSecondary"
          style={styles.resultsText}
          accessibilityLiveRegion="polite"
        >
          {schemesQuery.isPlaceholderData
            ? 'Searching…'
            : filter === 'all'
            ? pluralSchemes(visible.length)
            : `${pluralSchemes(visible.length)} · ${filterLabel}`}
        </AppText>
        <ChipGroup
          options={SORT_OPTIONS}
          value={sort}
          onChange={setSort}
          accessibilityLabel="Sort schemes"
        />
      </View>
    ) : null;

  return (
    <Screen edges={['top', 'left', 'right']} padded={false}>
      <ScreenHeader title="Explore schemes" subtitle={subtitle} />

      <TextField
        value={search}
        onChangeText={setSearch}
        onClear={() => setSearch('')}
        placeholder="Search, e.g. farmer, scholarship, housing"
        leftIcon="search-outline"
        accessibilityLabel="Search schemes"
        returnKeyType="search"
        autoCorrect={false}
        style={styles.search}
      />

      <ChipGroup
        horizontal
        options={FILTER_OPTIONS}
        value={filter}
        onChange={setFilter}
        accessibilityLabel="Filter schemes"
        style={styles.filters}
        contentContainerStyle={styles.filtersContent}
      />

      <FlatList
        data={visible}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={emptyContent}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  search: { marginHorizontal: spacing.gutter, marginTop: spacing.sm },
  filters: { flexGrow: 0 },
  filtersContent: { paddingHorizontal: spacing.gutter },
  list: {
    flexGrow: 1,
    paddingHorizontal: spacing.gutter,
    paddingBottom: spacing.xl,
  },
  resultsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  resultsText: { flex: 1 },
  skeleton: { marginBottom: spacing.md },
});
