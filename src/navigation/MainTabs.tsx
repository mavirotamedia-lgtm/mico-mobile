import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { BottomNav } from "@/components/ui";
import { HomeScreen } from "@/screens/home/HomeScreen";
import { MyBoatScreen } from "@/screens/boats/MyBoatScreen";
import { MyServiceRequestsScreen } from "@/screens/service-requests/MyServiceRequestsScreen";
import { ProfileScreen } from "@/screens/profile/ProfileScreen";
import type { AppStackParamList } from "@/navigation/RootNavigator";

export type MainTabParamList = {
  Home: undefined;
  MyBoat: undefined;
  ServiceRequests: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

const TAB_ITEMS = [
  { key: "Home", label: "Ana Sayfa", icon: require("../../assets/tab-icons/tab-home.png") },
  { key: "MyBoat", label: "Teknem", icon: require("../../assets/tab-icons/tab-boat.png") },
  { key: "ServiceRequests", label: "Teklifler", icon: require("../../assets/tab-icons/tab-offers.png") },
  { key: "Profile", label: "Profil", icon: require("../../assets/tab-icons/tab-profile.png") },
] as const;

type Props = NativeStackScreenProps<AppStackParamList, "MainTabs">;

export function MainTabs({ navigation }: Props) {
  return (
    <Tab.Navigator
      screenOptions={{ headerShown: false }}
      tabBar={({ state, navigation: tabNav }) => (
        <BottomNav
          items={TAB_ITEMS as unknown as Parameters<typeof BottomNav>[0]["items"]}
          activeKey={state.routeNames[state.index]}
          onPress={(key) => tabNav.navigate(key)}
          onCenterPress={() => navigation.navigate("CreateServiceRequest")}
        />
      )}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="MyBoat" component={MyBoatScreen} />
      <Tab.Screen name="ServiceRequests" component={MyServiceRequestsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
