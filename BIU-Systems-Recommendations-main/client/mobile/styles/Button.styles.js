// @ts-check
import { StyleSheet } from "react-native";

/** @param {import('./colors.styles').Theme} colors */
export default (colors) => StyleSheet.create({
    defaultButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.primary,
        justifyContent: "center",
        alignItems: "center",
        padding: 4,
    },
    buttonText: {
        color: colors.text,
        fontSize: 5,
    }
});