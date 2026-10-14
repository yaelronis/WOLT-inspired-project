// @ts-check 

import { StyleSheet } from "react-native";

/** @param {import("./colors.styles").Theme} colors */
export default (colors) => StyleSheet.create({
    container: {
        width: '100%',
        marginBottom: 16,
    },
    barsContainer: {
        flexDirection: 'row',       
        justifyContent: 'space-between',
        marginBottom: 6,
    },
    bar: {
        flex: 1,                    
        height: 4,                 
        borderRadius: 2,            
        marginHorizontal: 2,        
        backgroundColor: colors.background,
    },
    label: {
        fontSize: 12,
        fontWeight: '600',
        textAlign: 'right',
        color: colors.textSecondary,
    },
});