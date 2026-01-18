import React from "react";
import { Pressable, Image, View, StyleSheet } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Clipboard from "expo-clipboard";
import { Alert, Platform } from "react-native";

import SplitScreen from "@/screens/SplitScreen";
import SettingsScreen from "@/screens/SettingsScreen";
import { useScreenOptions } from "@/hooks/useScreenOptions";
import { useTheme } from "@/hooks/useTheme";
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

export default function RootStackNavigator() {
  const screenOptions = useScreenOptions();
  const { theme } = useTheme();

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="Split"
        component={SplitScreen}
        options={({ navigation }) => ({
          headerTitle: () => <HeaderTitle />,
          headerLeft: () => (
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
          ),
          headerRight: () => (
            <Pressable
              onPress={async () => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                Alert.alert(
                  "Share",
                  "Complete your bill split to share the summary."
                );
              }}
              hitSlop={8}
              style={styles.headerButton}
            >
              <ThemedText style={[styles.iconText, { color: theme.textTertiary }]}>↗</ThemedText>
            </Pressable>
          ),
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
