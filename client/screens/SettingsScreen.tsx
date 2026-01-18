import React from "react";
import { StyleSheet, View, Switch, Pressable, Linking, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { useThemeToggle } from "@/hooks/useColorScheme";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { Spacing, BorderRadius } from "@/constants/theme";

export default function SettingsScreen() {
  const { theme } = useTheme();
  const { isDark, toggleTheme } = useThemeToggle();
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();

  const handleToggle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleTheme();
  };

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
            <Feather
              name={isDark ? "moon" : "sun"}
              size={20}
              color={theme.text}
            />
            <ThemedText style={styles.settingLabel}>Dark Mode</ThemedText>
          </View>
          <Switch
            value={isDark}
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
              <Feather name="info" size={20} color={theme.text} />
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
              <Feather name="shield" size={20} color={theme.text} />
              <ThemedText style={styles.settingLabel}>Privacy Policy</ThemedText>
            </View>
            <Feather name="chevron-right" size={20} color={theme.textTertiary} />
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
              <Feather name="file-text" size={20} color={theme.text} />
              <ThemedText style={styles.settingLabel}>Terms of Service</ThemedText>
            </View>
            <Feather name="chevron-right" size={20} color={theme.textTertiary} />
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
  divider: {
    height: 1,
    marginLeft: Spacing.lg + 20 + Spacing.md,
  },
  footer: {
    alignItems: "center",
    marginTop: Spacing["3xl"],
  },
  footerText: {
    fontSize: 14,
  },
});
