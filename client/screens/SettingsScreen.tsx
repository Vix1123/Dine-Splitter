import React, { useState, useEffect, useCallback } from "react";
import { StyleSheet, View, Switch, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { Spacing, BorderRadius } from "@/constants/theme";

const THEME_KEY = "@dinesplit:theme";

export default function SettingsScreen() {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const [darkMode, setDarkMode] = useState(isDark);

  useEffect(() => {
    setDarkMode(isDark);
  }, [isDark]);

  const handleToggle = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newValue = !darkMode;
    setDarkMode(newValue);
    const newTheme = newValue ? "dark" : "light";
    await AsyncStorage.setItem(THEME_KEY, newTheme);
  }, [darkMode]);

  return (
    <KeyboardAwareScrollViewCompat
      style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: headerHeight + Spacing.xl,
          paddingBottom: insets.bottom + Spacing.xl,
        },
      ]}
    >
      <View style={styles.section}>
        <ThemedText
          style={[styles.sectionTitle, { color: theme.textSecondary }]}
        >
          Appearance
        </ThemedText>
        <View
          style={[
            styles.settingRow,
            { backgroundColor: theme.backgroundDefault },
          ]}
        >
          <View style={styles.settingContent}>
            <ThemedText style={[styles.iconText, { color: theme.text }]}>
              {darkMode ? "☾" : "☀"}
            </ThemedText>
            <ThemedText style={styles.settingLabel}>Dark Mode</ThemedText>
          </View>
          <Switch
            value={darkMode}
            onValueChange={handleToggle}
            trackColor={{ false: theme.border, true: theme.primary }}
            thumbColor="#FFFFFF"
          />
        </View>
      </View>

      <View style={styles.section}>
        <ThemedText
          style={[styles.sectionTitle, { color: theme.textSecondary }]}
        >
          About
        </ThemedText>
        <View
          style={[
            styles.settingsGroup,
            { backgroundColor: theme.backgroundDefault },
          ]}
        >
          <View style={[styles.settingRow, styles.groupedRow]}>
            <View style={styles.settingContent}>
              <ThemedText style={[styles.iconText, { color: theme.text }]}>ⓘ</ThemedText>
              <ThemedText style={styles.settingLabel}>Version</ThemedText>
            </View>
            <ThemedText style={{ color: theme.textSecondary }}>1.0.0</ThemedText>
          </View>

          <View
            style={[styles.divider, { backgroundColor: theme.border }]}
          />

          <Pressable
            style={[styles.settingRow, styles.groupedRow]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
          >
            <View style={styles.settingContent}>
              <ThemedText style={[styles.iconText, { color: theme.text }]}>🛡</ThemedText>
              <ThemedText style={styles.settingLabel}>Privacy Policy</ThemedText>
            </View>
            <ThemedText style={[styles.chevron, { color: theme.textTertiary }]}>›</ThemedText>
          </Pressable>

          <View
            style={[styles.divider, { backgroundColor: theme.border }]}
          />

          <Pressable
            style={[styles.settingRow, styles.groupedRow]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
          >
            <View style={styles.settingContent}>
              <ThemedText style={[styles.iconText, { color: theme.text }]}>📄</ThemedText>
              <ThemedText style={styles.settingLabel}>Terms of Service</ThemedText>
            </View>
            <ThemedText style={[styles.chevron, { color: theme.textTertiary }]}>›</ThemedText>
          </Pressable>
        </View>
      </View>

      <View style={styles.footer}>
        <ThemedText style={[styles.footerText, { color: theme.textTertiary }]}>
          Made with love for easier dining
        </ThemedText>
      </View>
    </KeyboardAwareScrollViewCompat>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.lg,
  },
  section: {
    marginBottom: Spacing["2xl"],
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
    marginLeft: Spacing.sm,
  },
  settingsGroup: {
    borderRadius: BorderRadius.md,
    overflow: "hidden",
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
  },
  groupedRow: {
    borderRadius: 0,
  },
  settingContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  settingLabel: {
    fontSize: 16,
    marginLeft: Spacing.md,
  },
  iconText: {
    fontSize: 20,
    width: 24,
    textAlign: "center",
  },
  chevron: {
    fontSize: 24,
    fontWeight: "300",
  },
  divider: {
    height: 1,
    marginLeft: Spacing.lg + 24 + Spacing.md,
  },
  footer: {
    alignItems: "center",
    marginTop: Spacing["3xl"],
  },
  footerText: {
    fontSize: 14,
  },
});
