// @ts-check
import { StyleSheet } from "react-native";

/** @param {import('./colors.styles').Theme} colors */
export default (colors) => StyleSheet.create({
  section: {
    marginBottom: 24,
    marginLeft:10,
    flexDirection:"column",
  },
  title: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "bold",
    marginHorizontal: 16,
    marginBottom: 10,
  },
});