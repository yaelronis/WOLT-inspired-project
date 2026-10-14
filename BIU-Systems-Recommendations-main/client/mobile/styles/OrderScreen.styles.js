// @ts-check
import { StyleSheet } from 'react-native';

/** @param {import('./colors.styles').Theme} colors */
export default (colors) => StyleSheet.create({
    orderDetailContainer: {
        padding: 16,
        backgroundColor: colors.background,
    },
    backToOrdersBtn: {
        marginBottom: 20,
        alignSelf: 'flex-start',
    },
    backBtnText: {
        fontSize: 16,
        color: colors.primary,
        fontWeight: '500',
    },
    upperpage: {
        marginBottom: 24,
    },
    orderBasicDataContainer: {
        marginBottom: 20,
    },
    orderResName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: colors.text,
        marginBottom: 8,
    },
    orderDataBasic: {
        fontSize: 14,
        color: colors.textSecondary,
        marginBottom: 4,
    },
    orderAgainRestaurant: {
        width: '100%',
        gap: 12, 
        marginTop: 8,
        paddingBottom: 24,
        borderBottomWidth: 1,
        borderBottomColor: colors.border
    },
    orderAgainButton: {
        width: '100%',
        height: 'auto',
        backgroundColor: colors.primary,
        paddingVertical: 14,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    orderAgainText: {
        color: colors.text,
        fontSize: 16,
        fontWeight: '600',
    },
    restaurantNavigationPage: {
        width: '100%',
        height: 'auto',
        backgroundColor: colors.background,
        borderWidth: 1,
        borderColor: colors.primary,
        paddingVertical: 14,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    visitResText: {
        color: colors.primary,
        fontSize: 16,
        fontWeight: '600',
    },
    itemsOrderContainer: {
        marginTop: 8,
    },
    itemsText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.text,
        marginBottom: 16,
    },
    dataItems: {
        marginBottom: 16,
    },
    productsMapping: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    productName: {
        fontSize: 16,
        color: colors.text,
    },
    productPrice: {
        fontSize: 16,
        fontWeight: '500',
        color: colors.textSecondary,
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 2,
        borderTopColor: colors.text,
    },
    textTotalSum: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.text,
    },
    totalsum: {
        fontSize: 20,
        fontWeight: 'bold',
        color: colors.primary,
    },

    cancelArea: { marginTop: 14 },
    cancelNote: { color: colors.textSecondary, fontSize: 13, marginBottom: 8 },
    cancelBtn: {
        alignSelf: "flex-start",
        paddingHorizontal: 18,
        paddingVertical: 9,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: "#e23744",
    },
    cancelBtnDisabled: { opacity: 0.5 },
    cancelBtnText: { color: "#e23744", fontWeight: "700" },
    cancelExpired: { marginTop: 8, color: colors.textSecondary, fontSize: 13 },
    cancelErrorText: { marginTop: 8, color: "#e23744", fontSize: 14 },
    orderCancelledTag: { marginTop: 10, color: "#e23744", fontWeight: "600" },
});