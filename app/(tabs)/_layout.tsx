import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Platform } from "react-native";
import { useTheme } from "../../lib/themeContext";
import Theme from "../../lib/theme";
import { FEATURES } from "../../lib/config";

export default function TabsLayout() {
  const { colors, isDark } = useTheme();
  
  return (
    <Tabs 
      screenOptions={{ 
        headerShown: false,
        tabBarActiveTintColor: colors.brand.primary,
        tabBarInactiveTintColor: colors.text.tertiary,
        tabBarStyle: {
          backgroundColor: isDark ? colors.background.primary : '#FFFFFF',
          borderTopColor: isDark ? colors.border.light : colors.border.light,
          borderTopWidth: 1,
          paddingBottom: Platform.OS === 'ios' ? 24 : 12,
          paddingTop: 12,
          height: Platform.OS === 'ios' ? 88 : 68,
        },
        tabBarLabelStyle: {
          fontSize: Theme.fontSize.xs,
          fontWeight: Theme.fontWeight.medium as any,
          marginTop: 2,
        },
        tabBarIconStyle: {
          marginTop: 4,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{ 
          title: "Home", 
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons 
              name={focused ? "home" : "home-outline"} 
              color={color} 
              size={size} 
            />
          )
        }}
      />
      
      <Tabs.Screen
        name="stats"
        options={{ 
          title: "Stats", 
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons 
              name={focused ? "bar-chart" : "bar-chart-outline"} 
              color={color} 
              size={size} 
            />
          )
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{ 
          title: "Settings", 
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons 
              name={focused ? "settings" : "settings-outline"} 
              color={color} 
              size={size} 
            />
          )
        }}
      />
    </Tabs>
  );
}
