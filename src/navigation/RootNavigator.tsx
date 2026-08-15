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
import { SubmitOfferScreen } from "@/screens/craftsmen/SubmitOfferScreen";
import { OffersScreen } from "@/screens/offers/OffersScreen";
import { ChatScreen } from "@/screens/chat/ChatScreen";
import { ConversationsScreen } from "@/screens/messages/ConversationsScreen";
import { NotificationsScreen } from "@/screens/notifications/NotificationsScreen";

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
  SubmitOffer: { serviceRequestId: string; requestTitle: string };
  Offers: { serviceRequestId: string; requestTitle?: string };
  Chat: { conversationId: string; otherUserName: string };
  Conversations: undefined;
  Notifications: undefined;
};

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const AppStack = createNativeStackNavigator<AppStackParamList>();

export function RootNavigator() {
  const { user, isLoading } = useAuth();
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
    <NavigationContainer>
      {user ? (
        <AppStack.Navigator screenOptions={screenOptions}>
          <AppStack.Screen name="MainTabs" component={MainTabs} />
          <AppStack.Screen name="AddBoat" component={AddBoatScreen} />
          <AppStack.Screen name="BoatDetail" component={BoatDetailScreen} />
          <AppStack.Screen name="CreateServiceRequest" component={CreateServiceRequestScreen} />
          <AppStack.Screen name="CraftsmanList" component={CraftsmanListScreen} />
          <AppStack.Screen name="CraftsmanDetail" component={CraftsmanDetailScreen} />
          <AppStack.Screen name="IncomingRequests" component={IncomingRequestsScreen} />
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
