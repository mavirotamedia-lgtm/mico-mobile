import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ActivityIndicator, View } from "react-native";
import { useAuth } from "@/store/AuthContext";
import { colors } from "@/theme/colors";
import { LoginScreen } from "@/screens/auth/LoginScreen";
import { RegisterScreen } from "@/screens/auth/RegisterScreen";
import { BoatListScreen } from "@/screens/boats/BoatListScreen";
import { AddBoatScreen } from "@/screens/boats/AddBoatScreen";
import { BoatDetailScreen } from "@/screens/boats/BoatDetailScreen";

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type AppStackParamList = {
  BoatList: undefined;
  AddBoat: undefined;
  BoatDetail: { boatId: string };
};

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const AppStack = createNativeStackNavigator<AppStackParamList>();

const screenOptions = {
  headerStyle: { backgroundColor: colors.background },
  headerTintColor: colors.text,
  headerShadowVisible: false,
  contentStyle: { backgroundColor: colors.background },
};

export function RootNavigator() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {user ? (
        <AppStack.Navigator screenOptions={screenOptions}>
          <AppStack.Screen name="BoatList" component={BoatListScreen} options={{ title: "Teknelerim" }} />
          <AppStack.Screen name="AddBoat" component={AddBoatScreen} options={{ title: "Yeni tekne" }} />
          <AppStack.Screen name="BoatDetail" component={BoatDetailScreen} options={{ title: "Tekne" }} />
        </AppStack.Navigator>
      ) : (
        <AuthStack.Navigator screenOptions={{ ...screenOptions, headerShown: false }}>
          <AuthStack.Screen name="Login" component={LoginScreen} />
          <AuthStack.Screen name="Register" component={RegisterScreen} />
        </AuthStack.Navigator>
      )}
    </NavigationContainer>
  );
}
