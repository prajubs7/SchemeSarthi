import React, { useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../../hooks/useAuth';
import { askSchemeQuestion } from '../../services/qaApi';
import Button from '../../components/common/Button';
import { colors } from '../../constants/colors';
import { HomeStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<HomeStackParamList, 'SchemeQA'>;

interface QaTurn {
  question: string;
  answer: string;
  wasGrounded: boolean;
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
      setHistory((prev) => [...prev, { question, answer: result.answer, wasGrounded: result.was_grounded }]);
      setQuestion('');
    } catch (err) {
      setHistory((prev) => [
        ...prev,
        { question, answer: 'Sorry, something went wrong answering that. Please try again.', wasGrounded: false },
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
