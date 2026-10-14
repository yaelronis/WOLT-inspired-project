// @ts-check
import { StyleSheet } from "react-native";

/** @param {import("./colors.styles").Theme} colors */
export default (colors) => StyleSheet.create({
    authView: {
        width: "100%",
        display: "flex",
        flexDirection: "column",
        gap: 16,
    },
    roleSelect: {
        display: "flex",
        gap: 12,
    },
    roleCardSelected: {
        backgroundColor: colors.primaryLight,
        borderColor: colors.primary
    },

    roleOption: {
        flex: 1,
        flexDirection: 'column',
        gap: 3,
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderWidth: 1.5,
        borderColor: colors.border,
        borderRadius: 8,
        backgroundColor: colors.background
    },
    textContainer: {
        flex: 1,
    },
    roleOptionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: colors.text,
    },
    roleOptionSub: {
        fontSize: 14,
        color: colors.textSecondary,
        marginTop: 2,
    },
})