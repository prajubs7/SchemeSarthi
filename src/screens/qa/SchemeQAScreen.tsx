import React, { useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import { askSchemeQuestion, setQaHelpful } from '../../services/qaApi';
import { Button } from '../../components/ui';
import { colors } from '../../constants/colors';
import { RootStackScreenProps } from '../../navigation/types';

type Props = RootStackScreenProps<'SchemeQA'>;

interface QaTurn {
  question: string;
  answer: string;
  wasGrounded: boolean;
  logId?: string;
  modelUsed?: string;
  helpful?: boolean | null;
}

export default function SchemeQAScreen({ route }: Props) {
  const { schemeId } = route.params;
  const { user } = useAuth();

  const [question, setQuestion] = useState('');
  const [history, setHistory] = useState<QaTurn[]>([]);
  const [loading, setLoading] = useState(false);

  const handleAsk = async () => {
    if (!user || !question.trim()) return;
    setLoading(true);
    try {
      const result = await askSchemeQuestion(user.id, schemeId, question);
      setHistory((prev) => [...prev, {
        question, answer: result.answer, wasGrounded: result.was_grounded,
        logId: result.id, modelUsed: result.model_used, helpful: result.helpful,
      }]);
      setQuestion('');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Please check your connection and try again.';
      setHistory((prev) => [
        ...prev,
        { question, answer: `Sorry, I couldn't answer that: ${message}`, wasGrounded: false },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <FlatList
        data={history}
        keyExtractor={(_, i) => String(i)}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.turn}>
            <Text style={styles.question}>{item.question}</Text>
            <Text style={styles.answer}>{item.answer}</Text>
            {item.modelUsed && <Text style={styles.model}>Answered by {item.modelUsed}</Text>}
            {item.logId && (
              <View style={styles.feedbackRow}>
                <Text style={styles.feedbackLabel}>Was this helpful?</Text>
                {([true, false] as const).map((helpful) => (
                  <TouchableOpacity
                    key={String(helpful)}
                    accessibilityRole="button"
                    accessibilityLabel={helpful ? 'Helpful' : 'Not helpful'}
                    disabled={item.helpful === helpful}
                    onPress={async () => {
                      try {
                        await setQaHelpful(item.logId!, helpful);
                        setHistory((prev) => prev.map((turn) => turn.logId === item.logId ? { ...turn, helpful } : turn));
                      } catch { /* Keep the current feedback state if the update fails. */ }
                    }}
                    style={[styles.voteButton, item.helpful === helpful && styles.selectedVote]}
                  >
                    <Text style={styles.voteText}>{helpful ? '👍' : '👎'}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
            {!item.wasGrounded && (
              <Text style={styles.disclaimer}>
                ⓘ Couldn't confirm this from official scheme details — verify on the official link.
              </Text>
            )}
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            Ask anything about this scheme — e.g. "Do I need an income certificate?"
          </Text>
        }
      />

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Type your question..."
          value={question}
          onChangeText={setQuestion}
          multiline
        />
        <Button title="Ask" onPress={handleAsk} loading={loading} style={styles.askButton} />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  list: { padding: 16, flexGrow: 1 },
  turn: { marginBottom: 20 },
  question: { fontSize: 14, fontWeight: '700', color: colors.primary, marginBottom: 6 },
  answer: { fontSize: 14, color: colors.textPrimary, lineHeight: 20 },
  disclaimer: { fontSize: 12, color: colors.warning, marginTop: 6, fontStyle: 'italic' },
  model: { fontSize: 11, color: colors.textSecondary, marginTop: 8 },
  feedbackRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  feedbackLabel: { fontSize: 12, color: colors.textSecondary, marginRight: 8 },
  voteButton: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, marginRight: 4 },
  selectedVote: { backgroundColor: colors.border },
  voteText: { fontSize: 16 },
  emptyText: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', marginTop: 40 },
  inputRow: {
    flexDirection: 'row',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 12,
    marginRight: 8,
    backgroundColor: colors.surface,
    maxHeight: 100,
  },
  askButton: { paddingHorizontal: 16 },
});
