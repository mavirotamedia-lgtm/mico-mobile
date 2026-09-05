import { NavigationContainer, type NavigatorScreenParams } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { View, ActivityIndicator } from "react-native";
import { useAuth } from "@/store/AuthContext";
import { useTheme } from "@/theme/ThemeContext";
import { palette } from "@/theme/tokens";
import { SplashScreen } from "@/screens/auth/SplashScreen";
import { LoginScreen } from "@/screens/auth/LoginScreen";
import { RegisterScreen } from "@/screens/auth/RegisterScreen";
import { ForgotPasswordScreen } from "@/screens/auth/ForgotPasswordScreen";
import { ResetPasswordScreen } from "@/screens/auth/ResetPasswordScreen";
import { MainTabs, type MainTabParamList } from "@/navigation/MainTabs";
import { AddBoatScreen } from "@/screens/boats/AddBoatScreen";
import { BoatDetailScreen } from "@/screens/boats/BoatDetailScreen";
import { CreateServiceRequestScreen } from "@/screens/service-requests/CreateServiceRequestScreen";
import { CraftsmanListScreen } from "@/screens/craftsmen/CraftsmanListScreen";
import { CraftsmanDetailScreen } from "@/screens/craftsmen/CraftsmanDetailScreen";
import { IncomingRequestsScreen } from "@/screens/craftsmen/IncomingRequestsScreen";
import { MyJobsScreen } from "@/screens/craftsmen/MyJobsScreen";
import { CraftsmanProfileScreen } from "@/screens/craftsmen/CraftsmanProfileScreen";
import { BecomeCraftsmanScreen } from "@/screens/craftsmen/BecomeCraftsmanScreen";
import { SubmitOfferScreen } from "@/screens/craftsmen/SubmitOfferScreen";
import { OffersScreen } from "@/screens/offers/OffersScreen";
import { LeaveReviewScreen } from "@/screens/reviews/LeaveReviewScreen";
import { FavoritesScreen } from "@/screens/favorites/FavoritesScreen";
import { BlockedUsersScreen } from "@/screens/profile/BlockedUsersScreen";
import { ChatScreen } from "@/screens/chat/ChatScreen";
import { ConversationsScreen } from "@/screens/messages/ConversationsScreen";
import { NotificationsScreen } from "@/screens/notifications/NotificationsScreen";
import type { ServiceRequest } from "@/types/mico";

export type AuthStackParamList = {
  Splash: undefined;
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  ResetPassword: { email: string };
};

export type AppStackParamList = {
  MainTabs: NavigatorScreenParams<MainTabParamList> | undefined;
  AddBoat: { boatId?: string } | undefined;
  BoatDetail: { boatId: string };
  CreateServiceRequest: { boatId?: string } | undefined;
  CraftsmanList: undefined;
  CraftsmanDetail: { craftsmanId: string };
  IncomingRequests: undefined;
  MyJobs: undefined;
  CraftsmanProfile: undefined;
  BecomeCraftsman: undefined;
  SubmitOffer: { serviceRequest: ServiceRequest };
  Offers: { serviceRequest: ServiceRequest };
  LeaveReview: { serviceRequestId: string; craftsmanId: string; craftsmanName: string };
  Favorites: undefined;
  BlockedUsers: undefined;
  Chat: { conversationId: string; otherUserName: string; otherUserId: string };
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
          <AppStack.Screen name="MyJobs" component={MyJobsScreen} />
          <AppStack.Screen name="CraftsmanProfile" component={CraftsmanProfileScreen} />
          <AppStack.Screen name="BecomeCraftsman" component={BecomeCraftsmanScreen} />
          <AppStack.Screen name="SubmitOffer" component={SubmitOfferScreen} />
          <AppStack.Screen name="Offers" component={OffersScreen} />
          <AppStack.Screen name="LeaveReview" component={LeaveReviewScreen} />
          <AppStack.Screen name="Favorites" component={FavoritesScreen} />
          <AppStack.Screen name="BlockedUsers" component={BlockedUsersScreen} />
          <AppStack.Screen name="Chat" component={ChatScreen} />
          <AppStack.Screen name="Conversations" component={ConversationsScreen} />
          <AppStack.Screen name="Notifications" component={NotificationsScreen} />
        </AppStack.Navigator>
      ) : (
        <AuthStack.Navigator screenOptions={screenOptions}>
          <AuthStack.Screen name="Splash" component={SplashScreen} />
          <AuthStack.Screen name="Login" component={LoginScreen} />
          <AuthStack.Screen name="Register" component={RegisterScreen} />
          <AuthStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
          <AuthStack.Screen name="ResetPassword" component={ResetPasswordScreen} />
        </AuthStack.Navigator>
      )}
    </NavigationContainer>
  );
}
