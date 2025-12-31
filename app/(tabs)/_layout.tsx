import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../lib/themeContext";
import Theme, { getShadow } from "../../lib/theme";
import { FEATURES } from "../../lib/config";

export default function TabsLayout() {
  const { colors } = useTheme();
  
  return (
    <Tabs 
      screenOptions={{ 
        headerShown: false,
        tabBarActiveTintColor: colors.brand.primary,
        tabBarInactiveTintColor: colors.text.tertiary,
        tabBarStyle: {
          backgroundColor: colors.background.secondary,
          borderTopColor: colors.border.light,
          borderTopWidth: 1,
          paddingBottom: 8,
          paddingTop: 8,
          height: 88,
          shadowColor: colors.card.shadow,
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 8,
        },
        tabBarLabelStyle: {
          fontSize: Theme.fontSize.sm,
          fontWeight: Theme.fontWeight.medium as any,
          marginTop: 4,
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
        name="challenges"
        options={{ 
          title: "Challenges", 
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons 
              name={focused ? "trophy" : "trophy-outline"} 
              color={color} 
              size={size} 
            />
          )
        }}
      />
      {FEATURES.friendRequests && (
        <Tabs.Screen
          name="friends"
          options={{ 
            title: "Friends", 
            tabBarIcon: ({ color, size, focused }) => {
              // We'll add the badge logic in the friends tab component itself
              // since we can't easily access context here
              return (
                <Ionicons 
                  name={focused ? "people" : "people-outline"} 
                  color={color} 
                  size={size} 
                />
              );
            }
          }}
        />
      )}
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
