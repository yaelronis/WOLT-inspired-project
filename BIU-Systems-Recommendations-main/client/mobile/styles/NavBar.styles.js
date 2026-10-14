// @ts-check
import { StyleSheet } from "react-native";

/** @param {import("./colors.styles").Theme} colors */
export default (colors) => StyleSheet.create({
  navbar: {
    height: 72,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.background,
  },

  logoContainer: {
    width: 58,
    justifyContent: "center",
  },

  logo: {
    width: 58,
    height: 36,

  },

  profile: {
    width: 40,
    height: 40,
  },

  location: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 12,
  },

  smallText: {
    fontSize: 12,
    color: colors.textSecondary,
  },

  address: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
  },
});