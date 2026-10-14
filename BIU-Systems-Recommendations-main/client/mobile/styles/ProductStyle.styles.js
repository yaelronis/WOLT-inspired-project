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
            flexDirection: "row",
            padding: 12,
        },

        image: {
            width: 90,
            height: 90,
            borderRadius: 12,
        },

        info: {
            flex: 1,
        },

        price: {
            marginTop: 8,
            fontWeight: "bold",
        }
    })
};