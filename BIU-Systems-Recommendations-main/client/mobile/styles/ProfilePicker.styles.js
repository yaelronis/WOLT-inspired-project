// @ts-check
import { StyleSheet } from "react-native";

/** @param {import("./colors.styles").Theme} colors */
export default (colors) => StyleSheet.create({
  container: {
    marginBottom: 20,
    width: "100%",
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  pickerCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  pickerCircleError: {
    borderColor: "#ff3b30",
  },
  imagePreview: {
    width: "100%",
    height: "100%",
  },
  placeholderContainer: {
    alignItems: "center",
  },
  placeholderText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: "500",
  },
  infoContainer: {
    marginLeft: 16,
    flex: 1,
    justifyContent: "center",
  },
  hint: {
    fontSize: 12,
    color: "#5f6368",
    marginBottom: 6,
  },
  removeButton: {
    alignSelf: "flex-start",
  },
  removeButtonText: {
    fontSize: 14,
    color: "#ff3b30",
    fontWeight: "600",
  },
  errorText: {
    color: "#ff3b30",
    fontSize: 12,
    marginTop: 6,
  },
});