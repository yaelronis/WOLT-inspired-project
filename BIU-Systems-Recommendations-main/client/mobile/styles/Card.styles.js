// @ts-check
import { StyleSheet } from "react-native";

/** @param {import('./colors.styles').Theme} colors */
export default (colors) => StyleSheet.create({
    card: {
        backgroundColor: colors.background,
        borderRadius: 16,
        margin: 5,
        overflow: "hidden",
        borderColor: colors.border,
        borderWidth:1,

        // Android shadow
        elevation: 4,
    },

    title: {
        fontSize: 18,
        fontWeight: "bold",
        color: colors.text,
    },

    description: {
        marginTop: 5,
        color: colors.textSecondary,
    },
});