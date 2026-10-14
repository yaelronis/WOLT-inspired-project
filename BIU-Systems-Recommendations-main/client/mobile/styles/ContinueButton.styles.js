// @ts-check
import { StyleSheet } from "react-native";

/** @param {import("./colors.styles").Theme} colors */
export default (colors) => StyleSheet.create({
    button: {
        backgroundColor: colors.primary,
        paddingVertical: 14,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 15,
        width:"100%",
        height: "auto",
    },
    buttonText: {
        color: colors.text,
        fontSize: 16,
        fontWeight: 'bold',
    },

})