// @ts-check
import { StyleSheet } from "react-native";
import get_card_stylesheet from "./Card.styles";

/** @param {import('./colors.styles').Theme} colors */
export default (colors) => {
    const card = get_card_stylesheet(colors);
    return StyleSheet.create({

        ...card,

        card: {
            ...card.card,
            width: 280,
            height: 210,
            flexDirection: "column",
            overflow: "hidden",

        },
        image: {
            width: "100%",
            height: 100,
        },

        content: {
            padding: 12,
            paddingBottom: 16,

        },

        row: {
            flexDirection: "row",
            justifyContent: "space-between",

        },

        category: {
            marginTop: 5,
            color: colors.textSecondary,
        },

        deleteBtn: {
            position: "absolute",
            top: 8,
            right: 8,
            width: 28,
            height: 28,
            borderRadius: 14,
            backgroundColor: "rgba(0,0,0,0.55)",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 2,
        },

        deleteBtnText: {
            color: "#fff",
            fontSize: 18,
            lineHeight: 20,
            fontWeight: "700",
        },
    })
};