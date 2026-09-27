export const lightColors = {
  primary: "#1B365D",
  primaryDark: "#0F2340",
  primaryLight: "#2C5282",
  accent: "#3D5A80",
  background: "#E6EEF6",
  surface: "#FFFFFF",
  muted: "#E8EDF3",
  text: "#1A2332",
  textSecondary: "#5C6B7A",
  textOnPrimary: "#FFFFFF",
  border: "#D5DDE6",
  placeholder: "#8A97A6",
  danger: "#B42318",
  warning: "#B54708",
  overlay: "rgba(15, 35, 64, 0.48)",
  live: "#D4A017",
  scanGuide: "#F2F6FB",
  hero: ["#0F2340", "#1B365D", "#2C5282"],
  page: ["#D5E2F0", "#F5F8FC", "#E6EEF6"],
  pageGlow: "rgba(27, 54, 93, 0.18)",
  pageOrb: "rgba(44, 82, 130, 0.16)",
  tabTint: "rgba(27, 54, 93, 0.12)",
  header: "#1B365D",
};

export const darkColors = {
  primary: "#4C6B93",
  primaryDark: "#D7E2F0",
  primaryLight: "#6B87AB",
  accent: "#8BA4C7",
  background: "#101820",
  surface: "#161E29",
  muted: "#1E2836",
  text: "#E8EEF5",
  textSecondary: "#9AA8B8",
  textOnPrimary: "#FFFFFF",
  border: "#2A3646",
  placeholder: "#7D8B9A",
  danger: "#F97066",
  warning: "#F79009",
  overlay: "rgba(6, 10, 16, 0.62)",
  live: "#D4A017",
  scanGuide: "#D7E2F0",
  hero: ["#0B1220", "#152238", "#1E3350"],
  page: ["#0A121C", "#0E151E", "#121C28"],
  pageGlow: "rgba(76, 107, 147, 0.28)",
  pageOrb: "rgba(44, 82, 130, 0.22)",
  tabTint: "rgba(139, 164, 199, 0.16)",
  header: "#1B365D",
};

export const colors = lightColors;

export const radii = {
  sm: 10,
  md: 14,
  lg: 20,
  xl: 28,
  pill: 999,
};

export function makeShadows(palette) {
  return {
    card: {
      shadowColor: palette.primaryDark,
      shadowOpacity: 0.08,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 4 },
      elevation: 3,
    },
  };
}

export const shadows = makeShadows(lightColors);

export function paletteFor(dark) {
  return dark ? darkColors : lightColors;
}
