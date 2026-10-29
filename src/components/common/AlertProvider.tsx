import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { colors } from '../../theme/colors';
import { Button } from '../ui';


export type AlertType = 'success' | 'error' | 'warning' | 'info';

export interface AlertButton {
  text: string;
  onPress?: () => void;
  variant?: 'primary' | 'outline';
}

export interface AlertOptions {
  title: string;
  message?: string;
  type?: AlertType;
  /** Defaults to a single "OK" button. */
  buttons?: AlertButton[];
  /** Allow closing by tapping outside / back button. Default true. */
  dismissable?: boolean;
}

interface AlertContextValue {
  showAlert: (options: AlertOptions) => void;
  hideAlert: () => void;
}

const AlertContext = createContext<AlertContextValue | null>(null);

const TYPE_CONFIG: Record<AlertType, { icon: string; color: string; bg: string }> = {
  success: { icon: 'checkmark-circle', color: colors.success, bg: '#E8F5E9' },
  error: { icon: 'close-circle', color: colors.warning, bg: '#FDECEA' },
  warning: { icon: 'warning', color: colors.warning, bg: '#FFF3E0' },
  info: { icon: 'information-circle', color: colors.primary, bg: '#E8F5E9' },
};

export function AlertProvider({ children }: { children: React.ReactNode }) {
  const [alert, setAlert] = useState<AlertOptions | null>(null);
  const [visible, setVisible] = useState(false);

  const showAlert = useCallback((options: AlertOptions) => {
    setAlert(options);
    setVisible(true);
  }, []);

  const hideAlert = useCallback(() => setVisible(false), []);

  const value = useMemo(() => ({ showAlert, hideAlert }), [showAlert, hideAlert]);

  const type = alert?.type ?? 'info';
  const cfg = TYPE_CONFIG[type];
  const dismissable = alert?.dismissable ?? true;
  const buttons = alert?.buttons?.length
    ? alert.buttons
    : [{ text: 'OK', variant: 'primary' as const }];

  const handleRequestClose = () => {
    if (dismissable) hideAlert();
  };

  return (
    <AlertContext.Provider value={value}>
      {children}
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={handleRequestClose}
      >
        <Pressable style={styles.backdrop} onPress={handleRequestClose}>
          {/* Inner Pressable swallows taps so only the backdrop dismisses */}
          <Pressable style={styles.card} onPress={() => {}}>
            <View style={[styles.accent, { backgroundColor: cfg.color }]} />
            <View style={[styles.iconWrap, { backgroundColor: cfg.bg }]}>
              <Ionicons name={cfg.icon} size={34} color={cfg.color} />
            </View>
            <Text style={styles.title}>{alert?.title}</Text>
            {alert?.message ? (
              <Text style={styles.message}>{alert.message}</Text>
            ) : null}

            <View
              style={[
                styles.buttonRow,
                buttons.length > 2 && styles.buttonColumn,
              ]}
            >
              {buttons.map((b, i) => (
                <Button
                  key={`${b.text}-${i}`}
                  title={b.text}
                  variant={b.variant ?? (i === buttons.length - 1 ? 'primary' : 'outline')}
                  style={buttons.length > 2 ? styles.btnFull : styles.btn}
                  onPress={() => {
                    hideAlert();
                    b.onPress?.();
                  }}
                />
              ))}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </AlertContext.Provider>
  );
}

export function useAlert(): AlertContextValue {
  const ctx = useContext(AlertContext);
  if (!ctx) throw new Error('useAlert must be used inside <AlertProvider>');
  return ctx;
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: colors.surface,
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 20,
    alignItems: 'center',
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  accent: { position: 'absolute', top: 0, left: 0, right: 0, height: 5 },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.primary,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  buttonRow: { flexDirection: 'row', gap: 10, marginTop: 22, width: '100%' },
  buttonColumn: { flexDirection: 'column' },
  btn: { flex: 1 },
  btnFull: { width: '100%' },
});
