// @ts-check
import { StyleSheet } from "react-native";
import get_button_stylesheet from "./Button.styles"

/** @param {import("./colors.styles").Theme} colors */
export default (colors) => {
    const buttonStyle = get_button_stylesheet(colors);
    return StyleSheet.create({
        ...buttonStyle,
        confirmButton: {
            ...buttonStyle.defaultButton,
            backgroundColor: colors.primary,
            width: 80,
        }
    });
};
