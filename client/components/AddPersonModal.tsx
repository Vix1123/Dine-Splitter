import React, { useState, useRef, useEffect } from "react";
import {
  StyleSheet,
  View,
  Modal,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";

interface AddPersonModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (name: string) => void;
}

export function AddPersonModal({
  visible,
  onClose,
  onAdd,
}: AddPersonModalProps) {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState("");
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  const handleAdd = () => {
    if (name.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onAdd(name.trim());
      setName("");
      onClose();
    }
  };

  const handleClose = () => {
    setName("");
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.overlay}
      >
        <Pressable style={styles.backdrop} onPress={handleClose} />
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: theme.backgroundRoot,
              paddingBottom: Math.max(insets.bottom, Spacing.xl),
            },
          ]}
        >
          <View style={styles.handle} />
          <View style={styles.header}>
            <ThemedText style={styles.title}>Add Person</ThemedText>
            <Pressable onPress={handleClose} hitSlop={8}>
              <ThemedText style={[styles.closeButton, { color: theme.text }]}>
                ✕
              </ThemedText>
            </Pressable>
          </View>
          <TextInput
            ref={inputRef}
            style={[
              styles.input,
              {
                backgroundColor: theme.backgroundDefault,
                color: theme.text,
                borderColor: theme.border,
              },
            ]}
            placeholder="Enter name"
            placeholderTextColor={theme.textTertiary}
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            returnKeyType="done"
            onSubmitEditing={handleAdd}
            blurOnSubmit={false}
          />
          <Button
            onPress={handleAdd}
            disabled={!name.trim()}
            style={[
              styles.addButton,
              {
                backgroundColor: isDark
                  ? Colors.dark.accent
                  : Colors.light.accent,
              },
            ]}
          >
            Add Person
          </Button>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  sheet: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: "#D1D5DB",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: Spacing.lg,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
  },
  closeButton: {
    fontSize: 20,
    fontWeight: "400",
  },
  input: {
    height: Spacing.inputHeight,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    paddingHorizontal: Spacing.lg,
    fontSize: 16,
    marginBottom: Spacing.xl,
  },
  addButton: {
    width: "100%",
  },
});
