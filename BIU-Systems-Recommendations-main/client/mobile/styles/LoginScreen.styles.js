// @ts-check

import { StyleSheet } from "react-native";
import get_button_stylesheet from "./Button.styles";

/** @param {import("./colors.styles").Theme} colors */
export default (colors) => {
  const ButtonStyles = get_button_stylesheet(colors);
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.background,
    },

    content: {
      flexGrow: 1,
      justifyContent: "center",
      paddingHorizontal: 20,
      paddingVertical: 30,
    },

    logo: {
      width: 150,
      height: 100,
      alignSelf: "center",
    },

    heading: {
      fontSize: 24,
      fontWeight: "700",
      color: colors.text,
      textAlign: "center",
      marginBottom: 24,
    },

    serverError: {
      color: "#d93025",
      fontSize: 14,
      marginTop: 8,
      marginBottom: 8,
    },

    continueButton: {
      ...ButtonStyles.defaultButton,
      width: "auto",
    },

    continueText: {
      color: colors.text,
      fontSize: 16,
      fontWeight: "700",
    },

    altText: {
      marginTop: 22,
      textAlign: "center",
      color: "#555",
      fontSize: 14,
    },

    link: {
      color: colors.text,
      fontWeight: "700",
    },
    guestButton: {
      marginTop: 20,
      paddingVertical: 10,
      alignItems: 'center',
    },
    guestButtonText: {
      color: colors.textSecondary,
      fontSize: 15,
      fontWeight: '600',
      textDecorationLine: 'underline',
    },
  });
}