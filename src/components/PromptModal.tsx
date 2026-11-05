import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Button, TextField } from './ui';
import { colors, radius, type } from '../theme';

interface Props {
  visible: boolean;
  title: string;
  message?: string;
  initial?: string;
  placeholder?: string;
  keyboardType?: 'default' | 'numeric';
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: (value: string) => void;
}

/** A small cross-platform text prompt (Alert.prompt only exists on iOS). */
export default function PromptModal({
  visible,
  title,
  message,
  initial = '',
  placeholder,
  keyboardType = 'default',
  confirmLabel,
  onCancel,
  onConfirm,
}: Props) {
  const [value, setValue] = useState(initial);
  useEffect(() => {
    if (visible) setValue(initial);
  }, [visible, initial]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onCancel} />
        <View style={styles.card}>
          <Text style={type.h2}>{title}</Text>
          {!!message && <Text style={[type.body, { color: colors.muted }]}>{message}</Text>}
          <TextField
            value={value}
            onChangeText={setValue}
            placeholder={placeholder}
            keyboardType={keyboardType}
            autoFocus
            onSubmitEditing={() => onConfirm(value)}
          />
          <View style={styles.row}>
            <Button label="Cancel" kind="soft" onPress={onCancel} style={{ flex: 1 }} />
            <Button label={confirmLabel} onPress={() => onConfirm(value)} style={{ flex: 1 }} />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(20,53,40,0.45)', justifyContent: 'center', padding: 24 },
  card: { backgroundColor: colors.bg, borderRadius: radius.lg, padding: 20, gap: 14 },
  row: { flexDirection: 'row', gap: 10 },
});
