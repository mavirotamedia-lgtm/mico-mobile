import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { View, ActivityIndicator } from "react-native";
import { useAuth } from "@/store/AuthContext";
import { useTheme } from "@/theme/ThemeContext";
import { palette } from "@/theme/tokens";
import { SplashScreen } from "@/screens/auth/SplashScreen";
import { LoginScreen } from "@/screens/auth/LoginScreen";
import { RegisterScreen } from "@/screens/auth/RegisterScreen";
import { MainTabs } from "@/navigation/MainTabs";
import { AddBoatScreen } from "@/screens/boats/AddBoatScreen";
import { BoatDetailScreen } from "@/screens/boats/BoatDetailScreen";
import { CreateServiceRequestScreen } from "@/screens/service-requests/CreateServiceRequestScreen";
import { CraftsmanListScreen } from "@/screens/craftsmen/CraftsmanListScreen";
import { CraftsmanDetailScreen } from "@/screens/craftsmen/CraftsmanDetailScreen";
import { IncomingRequestsScreen } from "@/screens/craftsmen/IncomingRequestsScreen";
import { CraftsmanProfileScreen } from "@/screens/craftsmen/CraftsmanProfileScreen";
import { BecomeCraftsmanScreen } from "@/screens/craftsmen/BecomeCraftsmanScreen";
import { SubmitOfferScreen } from "@/screens/craftsmen/SubmitOfferScreen";
import { OffersScreen } from "@/screens/offers/OffersScreen";
import { ChatScreen } from "@/screens/chat/ChatScreen";
import { ConversationsScreen } from "@/screens/messages/ConversationsScreen";
import { NotificationsScreen } from "@/screens/notifications/NotificationsScreen";
import type { ServiceRequest } from "@/types/mico";

export type AuthStackParamList = {
  Splash: undefined;
  Login: undefined;
  Register: undefined;
};

export type AppStackParamList = {
  MainTabs: undefined;
  AddBoat: { boatId?: string } | undefined;
  BoatDetail: { boatId: string };
  CreateServiceRequest: { boatId?: string } | undefined;
  CraftsmanList: undefined;
  CraftsmanDetail: { craftsmanId: string };
  IncomingRequests: undefined;
  CraftsmanProfile: undefined;
  BecomeCraftsman: undefined;
  SubmitOffer: { serviceRequest: ServiceRequest };
  Offers: { serviceRequest: ServiceRequest };
  Chat: { conversationId: string; otherUserName: string };
  Conversations: undefined;
  Notifications: undefined;
};

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const AppStack = createNativeStackNavigator<AppStackParamList>();

export function RootNavigator() {
  const { user, isGuest, isLoading } = useAuth();
  const { theme } = useTheme();

  const screenOptions = {
    headerShown: false,
    contentStyle: { backgroundColor: theme.background },
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: palette.navy950, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={palette.gold500} />
      </View>
    );
  }

  return (
    <NavigationContainer linking={{ enabled: false, prefixes: [] }}>
      {user || isGuest ? (
        <AppStack.Navigator
          key={user ? "user" : "guest"}
          screenOptions={screenOptions}
          initialRouteName={user ? "MainTabs" : "CraftsmanList"}
        >
          <AppStack.Screen name="MainTabs" component={MainTabs} />
          <AppStack.Screen name="AddBoat" component={AddBoatScreen} />
          <AppStack.Screen name="BoatDetail" component={BoatDetailScreen} />
          <AppStack.Screen name="CreateServiceRequest" component={CreateServiceRequestScreen} />
          <AppStack.Screen name="CraftsmanList" component={CraftsmanListScreen} />
          <AppStack.Screen name="CraftsmanDetail" component={CraftsmanDetailScreen} />
          <AppStack.Screen name="IncomingRequests" component={IncomingRequestsScreen} />
          <AppStack.Screen name="CraftsmanProfile" component={CraftsmanProfileScreen} />
          <AppStack.Screen name="BecomeCraftsman" component={BecomeCraftsmanScreen} />
          <AppStack.Screen name="SubmitOffer" component={SubmitOfferScreen} />
          <AppStack.Screen name="Offers" component={OffersScreen} />
          <AppStack.Screen name="Chat" component={ChatScreen} />
          <AppStack.Screen name="Conversations" component={ConversationsScreen} />
          <AppStack.Screen name="Notifications" component={NotificationsScreen} />
        </AppStack.Navigator>
      ) : (
        <AuthStack.Navigator screenOptions={screenOptions}>
          <AuthStack.Screen name="Splash" component={SplashScreen} />
          <AuthStack.Screen name="Login" component={LoginScreen} />
          <AuthStack.Screen name="Register" component={RegisterScreen} />
        </AuthStack.Navigator>
      )}
    </NavigationContainer>
  );
}
