// @ts-check
import { StyleSheet } from 'react-native';

/** @param {import('./colors.styles').Theme} colors */
export default (colors) => StyleSheet.create({
 backToOrdersBtn: {
        marginTop: 16,
        marginLeft:8,
        alignSelf: 'flex-start',
        width:32,
        height:32,
        borderRadius:16,
        backgroundColor: colors.primaryLight
    },
    backBtnText: {
        fontSize: 18,
        color: colors.text,
        fontWeight: '700',
    },
})