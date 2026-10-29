import React, { useState } from 'react';
import {
  StyleSheet,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  View,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { colors } from '../../constants/colors';

/**
 * Drop-in replacement for <TextInput> on password fields, with an eye icon
 * that toggles visibility. Takes the same props/styles as TextInput.
 */
export default function PasswordInput({ style, editable, ...rest }: TextInputProps) {
  const [visible, setVisible] = useState(false);

  // The outer margin belongs to the wrapper so the icon centres on the input itself
  const { marginBottom, ...inputStyle } = StyleSheet.flatten(style) ?? {};

  return (
    <View style={{ marginBottom }}>
      <TextInput
        {...rest}
        editable={editable}
        style={[inputStyle, styles.input]}
        secureTextEntry={!visible}
        autoCapitalize="none"
        autoCorrect={false}
      />
      <TouchableOpacity
        style={styles.eye}
        onPress={() => setVisible(v => !v)}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        accessibilityRole="button"
        accessibilityLabel={visible ? 'Hide password' : 'Show password'}
      >
        <Ionicons
          name={visible ? 'eye-off-outline' : 'eye-outline'}
          size={22}
          color={colors.textSecondary}
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  input: { paddingRight: 48 },
  eye: {
    position: 'absolute',
    right: 14,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
});
