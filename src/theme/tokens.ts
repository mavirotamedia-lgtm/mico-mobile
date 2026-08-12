/**
 * MİÇO Design System — ham token'lar.
 *
 * Palet, kullanıcının paylaştığı referans ekranlardan (koyu lacivert
 * kahraman alanları, beyaz kartlar, altın rating rozetleri, yeşil/turuncu
 * müsaitlik rozetleri) ilham alınarak türetildi; birebir kopya değil,
 * mavirotamarine.com'un mevcut lacivert/altın marka diliyle de uyumlu
 * MİÇO'ya özgü bir sistem.
 */

export const palette = {
  navy950: "#060F20",
  navy900: "#0A1730",
  navy800: "#0F2247",
  navy700: "#13294B",
  navy600: "#1B3A63",
  navy500: "#254B7A",
  navy100: "#E7ECF4",

  gold500: "#C9A227",
  gold300: "#E0C25F",

  success500: "#1FA669",
  success100: "#DFF5EA",
  warning500: "#F2A93B",
  warning100: "#FCEEDA",
  danger500: "#E4573D",
  danger100: "#FBE4DF",

  white: "#FFFFFF",
  slate50: "#F5F7FA",
  slate100: "#ECEFF3",
  slate200: "#DDE2E9",
  slate400: "#9AA5B4",
  slate500: "#6B7686",
  slate700: "#3C4657",
  black: "#000000",
} as const;

export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 40,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 999,
} as const;

export const typography = {
  fontFamily: {
    regular: "Manrope_400Regular",
    medium: "Manrope_500Medium",
    semibold: "Manrope_600SemiBold",
    bold: "Manrope_700Bold",
    extrabold: "Manrope_800ExtraBold",
  },
  display: { fontSize: 30, lineHeight: 38 },
  h1: { fontSize: 22, lineHeight: 28 },
  h2: { fontSize: 18, lineHeight: 24 },
  body: { fontSize: 15, lineHeight: 21 },
  bodySmall: { fontSize: 13, lineHeight: 18 },
  caption: { fontSize: 12, lineHeight: 16 },
} as const;

export type Theme = {
  mode: "light" | "dark";
  background: string;
  surface: string;
  surfaceAlt: string;
  border: string;
  textPrimary: string;
  textSecondary: string;
  textOnDark: string;
  textOnDarkMuted: string;
  primary: string;
  primaryPressed: string;
  onPrimary: string;
  accent: string;
  onAccent: string;
  success: string;
  successBg: string;
  warning: string;
  warningBg: string;
  danger: string;
  dangerBg: string;
  heroGradient: readonly [string, string];
  tabBarBg: string;
  tabBarInactive: string;
  shadowColor: string;
};

export const lightTheme: Theme = {
  mode: "light",
  background: palette.slate50,
  surface: palette.white,
  surfaceAlt: palette.navy100,
  border: palette.slate200,
  textPrimary: palette.navy900,
  textSecondary: palette.slate500,
  textOnDark: palette.white,
  textOnDarkMuted: "rgba(255,255,255,0.72)",
  primary: palette.navy700,
  primaryPressed: palette.navy800,
  onPrimary: palette.white,
  accent: palette.gold500,
  onAccent: palette.navy900,
  success: palette.success500,
  successBg: palette.success100,
  warning: palette.warning500,
  warningBg: palette.warning100,
  danger: palette.danger500,
  dangerBg: palette.danger100,
  heroGradient: [palette.navy950, palette.navy700] as const,
  tabBarBg: palette.white,
  tabBarInactive: palette.slate400,
  shadowColor: palette.navy900,
};

export const darkTheme: Theme = {
  mode: "dark",
  background: palette.navy950,
  surface: palette.navy800,
  surfaceAlt: palette.navy700,
  border: "rgba(255,255,255,0.10)",
  textPrimary: palette.white,
  textSecondary: "rgba(255,255,255,0.64)",
  textOnDark: palette.white,
  textOnDarkMuted: "rgba(255,255,255,0.72)",
  primary: palette.gold500,
  primaryPressed: palette.gold300,
  onPrimary: palette.navy950,
  accent: palette.gold500,
  onAccent: palette.navy900,
  success: palette.success500,
  successBg: "rgba(31,166,105,0.16)",
  warning: palette.warning500,
  warningBg: "rgba(242,169,59,0.16)",
  danger: palette.danger500,
  dangerBg: "rgba(228,87,61,0.16)",
  heroGradient: [palette.navy950, palette.navy900] as const,
  tabBarBg: palette.navy900,
  tabBarInactive: "rgba(255,255,255,0.4)",
  shadowColor: palette.black,
};
