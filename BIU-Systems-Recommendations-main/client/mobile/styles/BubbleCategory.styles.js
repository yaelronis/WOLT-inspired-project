// @ts-check
import { StyleSheet } from "react-native";

/** @param {import('./colors.styles').Theme} colors */
export default (colors) => StyleSheet.create({
  container: {
    marginBottom:5,
  },
  categoryHeader: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text,
  },
  listContainer: {
    paddingHorizontal: 12, 
  },
  categoryBubbleItem: {
    alignItems: "center",
    marginHorizontal: 8,
    width: 80, 
  },
  bubble: {
    width: 70,
    height: 70,
    borderRadius: 35, 
    backgroundColor: colors.background,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
  },
  bubbleImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  categoryBubbleName: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textSecondary,
    textAlign: "center",
  },
  categoryCount: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
});