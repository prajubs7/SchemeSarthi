import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Animated,
  FlatList,
  KeyboardAvoidingView,
  ListRenderItem,
  PixelRatio,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import {
  askSchemeQuestion,
  getQaHistory,
  QaLogEntry,
  setQaHelpful,
} from '../../services/qaApi';
import {
  AppText,
  Button,
  Chip,
  ErrorState,
  Icon,
  IconButton,
  IconCircle,
  LoadingSpinner,
  StatusPill,
  TextField,
} from '../../components/ui';
import { colors, radius, sizes, spacing, typography } from '../../theme';
import { RootStackScreenProps } from '../../navigation/types';
import { formatRelativeTime } from '../../utils/relativeTime';

type Props = RootStackScreenProps<'SchemeQA'>;

// Each one maps to a backend intent in scheme-qa (ELIGIBILITY, STATUS or GENERAL).
const SUGGESTED_QUESTIONS = [
  'Am I eligible for this?',
  'Is this scheme still open?',
  'What is the last date?',
  'Which documents do I need?',
  'How do I apply?',
  'Has anything changed recently?',
];
const FOLLOW_UP_COUNT = 3;
const COMPOSER_MAX_LINES = 4;
const ASK_ERROR =
  "Sarthi couldn't answer right now. Check your connection and try again.";

type ChatItem =
  | { kind: 'user'; key: string; text: string }
  | { kind: 'assistant'; key: string; entry: QaLogEntry }
  | { kind: 'typing'; key: string }
  | { kind: 'error'; key: string };

const qaKey = (userId: string | undefined, schemeId: string) =>
  ['qa', userId, schemeId] as const;

function ChatHeaderTitle({ subtitle }: { subtitle: string }) {
  const { width } = useWindowDimensions();
  // Leave room for the back button on one side and balance on the other.
  const maxWidth = width - 2 * (sizes.touchTarget + spacing.xl);
  return (
    <View style={[styles.headerTitle, { maxWidth }]}>
      <AppText variant="title" numberOfLines={1} accessibilityRole="header">
        Ask Sarthi
      </AppText>
      <AppText variant="caption" color="textSecondary" numberOfLines={1}>
        {subtitle}
      </AppText>
    </View>
  );
}

const renderHeaderTitle = (subtitle: string) => () =>
  <ChatHeaderTitle subtitle={subtitle} />;

function TypingIndicator() {
  const dots = useRef([0, 1, 2].map(() => new Animated.Value(0))).current;

  useEffect(() => {
    const pulse = (value: Animated.Value) =>
      Animated.sequence([
        Animated.timing(value, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(value, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]);
    const loop = Animated.loop(Animated.stagger(150, dots.map(pulse)));
    loop.start();
    return () => loop.stop();
  }, [dots]);

  return (
    <View
      style={[styles.bubble, styles.assistantBubble, styles.typingBubble]}
      accessible
      accessibilityLabel="Sarthi is typing"
      accessibilityLiveRegion="polite"
    >
      {dots.map((value, i) => (
        <Animated.View
          key={i}
          style={[
            styles.dot,
            {
              opacity: value.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }),
              transform: [
                {
                  translateY: value.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -spacing.xs],
                  }),
                },
              ],
            },
          ]}
        />
      ))}
    </View>
  );
}

interface AssistantBubbleProps {
  entry: QaLogEntry;
  onVote: (entry: QaLogEntry, helpful: boolean) => void;
}

function AssistantBubble({ entry, onVote }: AssistantBubbleProps) {
  return (
    <View style={[styles.bubble, styles.assistantBubble]}>
      <AppText selectable>{entry.answer}</AppText>
      {entry.was_grounded ? (
        <StatusPill
          label="Verified from official sources"
          tone="success"
          icon="shield-checkmark"
          size="sm"
        />
      ) : (
        <StatusPill
          label="Not confirmed — check official site"
          tone="info"
          icon="information-circle"
          size="sm"
        />
      )}
      <View style={styles.assistantFooter}>
        <AppText variant="caption" color="textMuted" style={styles.flex}>
          {formatRelativeTime(entry.created_at)}
        </AppText>
        <IconButton
          icon={entry.helpful === true ? 'thumbs-up' : 'thumbs-up-outline'}
          variant="plain"
          size={44}
          color={entry.helpful === true ? 'primary' : 'textSecondary'}
          accessibilityLabel={
            entry.helpful === true ? 'Marked as helpful' : 'Mark as helpful'
          }
          disabled={entry.helpful === true}
          onPress={() => onVote(entry, true)}
        />
        <IconButton
          icon={entry.helpful === false ? 'thumbs-down' : 'thumbs-down-outline'}
          variant="plain"
          size={44}
          color={entry.helpful === false ? 'primary' : 'textSecondary'}
          accessibilityLabel={
            entry.helpful === false ? 'Marked as not helpful' : 'Mark as not helpful'
          }
          disabled={entry.helpful === false}
          onPress={() => onVote(entry, false)}
        />
      </View>
    </View>
  );
}

function ErrorBubble({ onRetry }: { onRetry: () => void }) {
  return (
    <View
      style={[styles.bubble, styles.errorBubble]}
      accessibilityLiveRegion="polite"
    >
      <View style={styles.errorRow}>
        <Icon name="alert-circle" color="danger" />
        <AppText variant="bodySm" color="danger" style={styles.flex}>
          {ASK_ERROR}
        </AppText>
      </View>
      <Button
        title="Retry"
        variant="secondary"
        leftIcon="refresh"
        fullWidth={false}
        onPress={onRetry}
        accessibilityLabel="Retry question"
      />
    </View>
  );
}

function SuggestionChips({
  questions,
  onPick,
}: {
  questions: string[];
  onPick: (question: string) => void;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={styles.chipRow}
    >
      {questions.map(q => (
        <Chip
          key={q}
          label={q}
          onPress={() => onPick(q)}
          accessibilityLabel={`Ask: ${q}`}
        />
      ))}
    </ScrollView>
  );
}

export default function SchemeQAScreen({ route, navigation }: Props) {
  const { schemeId, schemeTitle } = route.params;
  const { user } = useAuth();
  const userId = user?.id;
  const queryClient = useQueryClient();
  const listRef = useRef<FlatList<ChatItem>>(null);
  const rootRef = useRef<View>(null);
  const [draft, setDraft] = useState('');
  const [keyboardOffset, setKeyboardOffset] = useState(0);

  useLayoutEffect(() => {
    navigation.setOptions({ headerTitle: renderHeaderTitle(schemeTitle) });
  }, [navigation, schemeTitle]);

  const history = useQuery({
    queryKey: qaKey(userId, schemeId),
    queryFn: () => getQaHistory(userId!, schemeId),
    enabled: !!userId,
  });

  const ask = useMutation({
    mutationFn: (question: string) =>
      askSchemeQuestion(userId!, schemeId, question),
    onSuccess: (result, question) => {
      queryClient.setQueryData<QaLogEntry[]>(qaKey(userId, schemeId), prev => [
        ...(prev ?? []),
        {
          id: result.id,
          question,
          answer: result.answer,
          was_grounded: result.was_grounded,
          helpful: result.helpful,
          created_at: new Date().toISOString(),
        },
      ]);
    },
    onError: err => {
      // The raw service error can include an HTTP body, so it stays out of the UI.
      if (__DEV__) console.warn('[SchemeQA] ask failed', err);
    },
  });

  const vote = useMutation({
    mutationFn: ({ id, helpful }: { id: string; helpful: boolean }) =>
      setQaHelpful(id, helpful),
    onMutate: ({ id, helpful }) => {
      const key = qaKey(userId, schemeId);
      const previous = queryClient.getQueryData<QaLogEntry[]>(key);
      queryClient.setQueryData<QaLogEntry[]>(key, prev =>
        prev?.map(e => (e.id === id ? { ...e, helpful } : e)),
      );
      return { previous };
    },
    onError: (err, _vars, context) => {
      if (__DEV__) console.warn('[SchemeQA] feedback failed', err);
      queryClient.setQueryData(qaKey(userId, schemeId), context?.previous);
    },
  });

  const entries = useMemo(() => history.data ?? [], [history.data]);
  const pendingQuestion = ask.isPending || ask.isError ? ask.variables : undefined;

  const items = useMemo<ChatItem[]>(() => {
    const list: ChatItem[] = entries.flatMap(entry => [
      { kind: 'user' as const, key: `${entry.id}-q`, text: entry.question },
      { kind: 'assistant' as const, key: `${entry.id}-a`, entry },
    ]);
    if (pendingQuestion) {
      list.push({ kind: 'user', key: 'pending-q', text: pendingQuestion });
      list.push(
        ask.isError ? { kind: 'error', key: 'error' } : { kind: 'typing', key: 'typing' },
      );
    }
    return list;
  }, [entries, pendingQuestion, ask.isError]);

  const followUps = useMemo(() => {
    const asked = new Set(entries.map(e => e.question.trim().toLowerCase()));
    return SUGGESTED_QUESTIONS.filter(q => !asked.has(q.toLowerCase())).slice(
      0,
      FOLLOW_UP_COUNT,
    );
  }, [entries]);

  const send = useCallback(
    (text: string) => {
      const question = text.trim();
      if (!userId || !question || ask.isPending) return;
      ask.mutate(question);
      setDraft('');
    },
    [ask, userId],
  );

  const onVote = useCallback(
    (entry: QaLogEntry, helpful: boolean) =>
      vote.mutate({ id: entry.id, helpful }),
    [vote],
  );

  const scrollToEnd = useCallback(
    () => listRef.current?.scrollToEnd({ animated: true }),
    [],
  );

  // KeyboardAvoidingView measures itself relative to its parent, so it needs the
  // distance from the top of the window (the native header) as its offset.
  const measureOffset = useCallback(() => {
    rootRef.current?.measureInWindow((_x, y) => setKeyboardOffset(y));
  }, []);

  const renderItem: ListRenderItem<ChatItem> = useCallback(
    ({ item }) => {
      switch (item.kind) {
        case 'user':
          return (
            <View style={[styles.bubble, styles.userBubble]}>
              <AppText color="white" selectable>
                {item.text}
              </AppText>
            </View>
          );
        case 'assistant':
          return <AssistantBubble entry={item.entry} onVote={onVote} />;
        case 'typing':
          return <TypingIndicator />;
        case 'error':
          return (
            <ErrorBubble
              onRetry={() => ask.variables && ask.mutate(ask.variables)}
            />
          );
      }
    },
    [ask, onVote],
  );

  const renderEmpty = () => {
    if (history.isLoading) return <LoadingSpinner />;
    if (history.isError) {
      return (
        <ErrorState
          message="We couldn't load your earlier questions."
          onRetry={() => history.refetch()}
        />
      );
    }
    return (
      <View style={styles.empty}>
        <IconCircle icon="chatbubbles-outline" tone="primary" size="xl" />
        <AppText variant="h2" align="center">
          Ask Sarthi about this scheme
        </AppText>
        <AppText color="textSecondary" align="center">
          Answers come from the official scheme details. Tap a question to
          start, or type your own.
        </AppText>
        <View style={styles.emptyChips}>
          {SUGGESTED_QUESTIONS.map(q => (
            <Chip
              key={q}
              label={q}
              onPress={() => send(q)}
              disabled={!userId}
              accessibilityLabel={`Ask: ${q}`}
            />
          ))}
        </View>
      </View>
    );
  };

  const canSend = !!userId && draft.trim().length > 0 && !ask.isPending;
  const showFollowUps =
    entries.length > 0 && !pendingQuestion && followUps.length > 0;
  const composerMaxHeight =
    typography.body.lineHeight * COMPOSER_MAX_LINES * PixelRatio.getFontScale();

  return (
    <View ref={rootRef} style={styles.flex} onLayout={measureOffset}>
      {/* 'padding' on Android too: with edge-to-edge (targetSdk 36) adjustResize no longer resizes the window. */}
      <KeyboardAvoidingView
        style={styles.flex}
        behavior="padding"
        keyboardVerticalOffset={keyboardOffset}
      >
        <FlatList
          ref={listRef}
          data={items}
          keyExtractor={item => item.key}
          renderItem={renderItem}
          ListEmptyComponent={renderEmpty()}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          onContentSizeChange={scrollToEnd}
          onLayout={scrollToEnd}
        />

        <SafeAreaView edges={['bottom']} style={styles.composerArea}>
          {showFollowUps ? (
            <SuggestionChips questions={followUps} onPick={send} />
          ) : null}
          <View style={styles.composer}>
            <TextField
              value={draft}
              onChangeText={setDraft}
              placeholder="Type your question…"
              accessibilityLabel="Your question"
              multiline
              style={styles.flex}
              fieldStyle={styles.composerField}
              inputStyle={{ maxHeight: composerMaxHeight }}
            />
            <IconButton
              icon="send"
              variant="filled"
              accessibilityLabel="Send question"
              disabled={!canSend}
              onPress={() => send(draft)}
            />
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  headerTitle: { alignItems: 'center' },
  list: { flexGrow: 1, padding: spacing.gutter, gap: spacing.md },
  bubble: {
    maxWidth: '85%',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    gap: spacing.sm,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: colors.primary,
    borderBottomRightRadius: radius.sm,
  },
  assistantBubble: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surface,
    borderWidth: sizes.borderWidth,
    borderColor: colors.border,
    borderBottomLeftRadius: radius.sm,
  },
  assistantFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginRight: -spacing.sm,
    marginBottom: -spacing.sm,
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.lg,
  },
  dot: {
    width: sizes.dot,
    height: sizes.dot,
    borderRadius: radius.pill,
    backgroundColor: colors.textMuted,
  },
  errorBubble: {
    alignSelf: 'flex-start',
    backgroundColor: colors.dangerSoft,
    borderBottomLeftRadius: radius.sm,
  },
  errorRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.xl,
  },
  emptyChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  composerArea: {
    backgroundColor: colors.surface,
    borderTopWidth: sizes.borderWidth,
    borderTopColor: colors.border,
  },
  chipRow: {
    gap: spacing.sm,
    paddingHorizontal: spacing.gutter,
    paddingTop: spacing.md,
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    paddingHorizontal: spacing.gutter,
    paddingVertical: spacing.md,
  },
  composerField: {
    minHeight: sizes.input,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
});
