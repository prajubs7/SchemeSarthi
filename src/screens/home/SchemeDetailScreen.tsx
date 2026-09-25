import React, { useEffect } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { getSchemeById, markSchemeViewed } from '../../services/schemesApi';
import { useAuth } from '../../hooks/useAuth';
import { Button, Card, LoadingSpinner } from '../../components/ui';
import { colors } from '../../constants/colors';
import { HomeStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<HomeStackParamList, 'SchemeDetail'>;

export default function SchemeDetailScreen({ route, navigation }: Props) {
  const { schemeId } = route.params;
  const { user } = useAuth();

  const { data: scheme, isLoading } = useQuery({
    queryKey: ['scheme', schemeId],
    queryFn: () => getSchemeById(schemeId),
  });

  useEffect(() => {
    if (user) markSchemeViewed(user.id, schemeId).catch(() => {});
  }, [user, schemeId]);

  if (isLoading || !scheme) return <LoadingSpinner />;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ padding: 16 }}
    >
      <Text style={styles.title}>{scheme.title}</Text>

      {scheme.status === 'needs_verification' && (
        <Card style={[styles.card, styles.warningCard]}>
          <Text style={styles.warningText}>
            ⚠️ Some details for this scheme may be out of date. Please verify on
            the official link before applying.
          </Text>
        </Card>
      )}

      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>What is this scheme?</Text>
        <Text style={styles.body}>{scheme.description}</Text>
      </Card>

      {scheme.benefit_summary && (
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Benefits</Text>
          <Text style={styles.body}>{scheme.benefit_summary}</Text>
        </Card>
      )}

      {scheme.required_documents && scheme.required_documents.length > 0 && (
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Documents you'll need</Text>
          {scheme.required_documents.map(doc => (
            <Text key={doc} style={styles.listItem}>
              • {doc}
            </Text>
          ))}
        </Card>
      )}

      <Button
        title="Ask a question about this scheme"
        variant="outline"
        onPress={() =>
          navigation.navigate('SchemeQA', {
            schemeId: scheme.id,
            schemeTitle: scheme.title,
          })
        }
        style={{ marginTop: 12, marginBottom: 24 }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: colors.background 
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 6,
  },
  body: { 
    fontSize: 14, 
    color: colors.textPrimary, 
    lineHeight: 20 },
  listItem: { 
    fontSize: 14, 
    color: colors.textPrimary, 
    marginBottom: 4 
  },
  card: { marginBottom: 12 },
  warningCard: { 
    backgroundColor: '#FFF3E0', 
    borderColor: colors.warning 
  },
  warningText: { 
    color: colors.warning, 
    fontSize: 13 
  },
});
