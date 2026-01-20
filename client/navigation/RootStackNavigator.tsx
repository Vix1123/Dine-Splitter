import React from "react";
import { Pressable, Image, View, StyleSheet } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import * as Haptics from "expo-haptics";

import SplitScreen from "@/screens/SplitScreen";
import SettingsScreen from "@/screens/SettingsScreen";
import { useScreenOptions } from "@/hooks/useScreenOptions";
import { useTheme } from "@/hooks/useTheme";
import { useThemeToggle } from "@/hooks/useColorScheme";
import { ThemedText } from "@/components/ThemedText";
import { Spacing } from "@/constants/theme";

export type RootStackParamList = {
  Split: undefined;
  Settings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

function HeaderTitle() {
  const { theme } = useTheme();

  return (
    <View style={styles.headerTitle}>
      <Image
        source={require("../../assets/images/icon.png")}
        style={styles.headerIcon}
        resizeMode="contain"
      />
      <ThemedText style={[styles.headerText, { color: theme.text }]}>
        Dine Split
      </ThemedText>
    </View>
  );
}

function ThemeToggleButton() {
  const { theme, isDark } = useTheme();
  const { toggleTheme } = useThemeToggle();

  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        toggleTheme();
      }}
      hitSlop={8}
      style={styles.headerButton}
    >
      <ThemedText style={[styles.iconText, { color: theme.text }]}>
        {isDark ? "☀" : "☾"}
      </ThemedText>
    </Pressable>
  );
}

function SettingsButton({ navigation }: { navigation: any }) {
  const { theme } = useTheme();

  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        navigation.navigate("Settings");
      }}
      hitSlop={8}
      style={styles.headerButton}
    >
      <ThemedText style={[styles.iconText, { color: theme.text }]}>⚙</ThemedText>
    </Pressable>
  );
}

export default function RootStackNavigator() {
  const screenOptions = useScreenOptions();

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="Split"
        component={SplitScreen}
        options={({ navigation }) => ({
          headerTitle: () => <HeaderTitle />,
          headerLeft: () => <ThemeToggleButton />,
          headerRight: () => <SettingsButton navigation={navigation} />,
        })}
      />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          headerTitle: "Settings",
        }}
      />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  headerTitle: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerIcon: {
    width: 28,
    height: 28,
    marginRight: Spacing.sm,
  },
  headerText: {
    fontSize: 17,
    fontWeight: "600",
  },
  headerButton: {
    padding: Spacing.xs,
  },
  iconText: {
    fontSize: 22,
  },
});
