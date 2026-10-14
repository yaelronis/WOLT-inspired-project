// @ts-check
import { StyleSheet } from "react-native";
import get_button_stylesheet from "./Button.styles";

/** @param {import("./colors.styles").Theme} colors */
export default (colors) => {
    const buttonStyles = get_button_stylesheet(colors);
    return StyleSheet.create({
        headerContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
            gap: 12,
        },
        container: {
            flex: 1,
            backgroundColor: colors.background,

        },

        input: {
            color: colors.text,
            flex: 1,
            height: 48,
            borderRadius: 24,
            backgroundColor: colors.border,
        },

        resultCard: {
            width: "95%",
            alignSelf: "center",
        },
        ...buttonStyles,
        closeButton: {
            ...buttonStyles.defaultButton,
            backgroundColor: colors.background,
            elevation: 2,
        },
        closeIcon: {
            fontSize: 20,
            fontWeight: '300',
            color: colors.text,
        },
    });
}