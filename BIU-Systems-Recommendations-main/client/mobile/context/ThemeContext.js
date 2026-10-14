// @ts-check

import { createContext, useContext } from "react";
import { Appearance, useColorScheme } from "react-native";

import { light_theme, dark_theme } from "../styles/colors.styles";

function scheme_default() {
    const scheme_system = Appearance.getColorScheme();
    switch (scheme_system) {
        case "light": return 'light';
        case "dark": return 'dark';
        default: return 'light';
    }
}

/** 
 * @param {import("react-native").ColorSchemeName} scheme 
 * @returns {typeof light_theme}
 */
function theme_from_scheme(scheme) {
    switch (scheme) {
        case "light": return light_theme;
        case "dark": return dark_theme;
        default: return light_theme;
    }
}

const default_scheme = scheme_default();
const default_theme = theme_from_scheme(default_scheme);
const ThemeContext = createContext(default_theme);

/** @param {any} children */
export function ThemeProvider({ children }) {
    const scheme = useColorScheme();
    const theme = theme_from_scheme(scheme);
    return <ThemeContext.Provider value={theme} children={children}/>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
