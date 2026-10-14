// @ts-check
import { StyleSheet } from "react-native";

/** @param {import('./colors.styles').Theme} colors */
export default (colors) => StyleSheet.create({
    safe_area_view: {
        flex: 1,
        backgroundColor: colors.background,
    },
    scroll_view: {
        flexDirection: "column",
    },
    scroll_view_children: {
        alignItems: "center",
    },
    title_area: {
        flexDirection: "row",
        margin: 16,
        alignItems: "center",
    },
    title: {
        color: colors.text,
        fontSize: 22,
        fontWeight: "bold",
        marginTop: 16,
        paddingLeft: 10,
    },
});
