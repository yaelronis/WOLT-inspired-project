// @ts-check

import { StyleSheet } from "react-native";

/** @param {import("./colors.styles").Theme} colors */
export default (colors) => {
    return StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: colors.background,
            paddingLeft: 0,
        },

        content: {
            paddingTop: 50,
            paddingBottom: 30,
        },
        bottomActionsContainer: {
            position: "absolute",
            bottom: 24,
            left: 0,
            right: 0,

            flexDirection: "row",
            justifyContent: "center",
            alignItems: "center",
            gap: 10,
        },

        searchButton: {
            width: "auto",
            height: 52,
            borderRadius: 26,
            paddingHorizontal: 18,
        },

        searchButtonText: {
            fontSize: 16,
            fontWeight: "600",
            color: colors.text,
        },


    });
}