// @ts-check

import { StyleSheet } from 'react-native';
import get_button_stylesheet from "./Button.styles"

/** @param {import('./colors.styles').Theme} colors */
export default (colors) => {
  const buttonStyles = get_button_stylesheet(colors);
  return StyleSheet.create({
    headerContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      gap: 12,
    },
    closeButton: {
      ...buttonStyles.defaultButton,
      backgroundColor: colors.background,
      elevation: 2,
    },

    crWrap: {
      padding: 16,
      backgroundColor: colors.background
    },
    crBrand: {
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 20,
      color: '#222',
      textAlign: 'left'
    },
    crDot: {
      color: colors.primary
    },
    crCard: {
      backgroundColor: colors.background,
      borderRadius: 12,
      padding: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2
    },
    crCenter: {
      alignItems: 'center',
      justifyContent: 'center'
    },
    crH1: {
      fontSize: 24,
      fontWeight: '800',
      marginVertical: 10,
      color: colors.text,
      textAlign: 'center'
    },
    crSub: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 20,
      textAlign: 'center'
    },
    crPink: {
      backgroundColor: colors.primary,
      paddingVertical: 14,
      borderRadius: 8,
      alignItems: 'center',
      marginVertical: 12,
      height: "auto",
      width: "100%"
    },
    crPinkText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: 'bold'
    },
    crBack: {
      alignSelf: 'flex-start',
      paddingVertical: 8
    },
    crBackText: {
      color: colors.textSecondary,
      fontSize: 14
    },
    crStepper: {
      marginVertical: 16,
      width: '100%',
    },
    crStepRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center'
    },
    crStep: {
      fontSize: 14,
      color: colors.textSecondary
    },
    active: {
      color: colors.text,
      fontWeight: 'bold'
    },
    done: {
      color: colors.primary
    },
    crNum: {
      fontWeight: 'bold'
    },
    crBar: {
      height: 2,
      width: 40,
      backgroundColor: colors.primaryLight,
      marginHorizontal: 8
    },
    crField: {
      marginBottom: 20
    },
    crLabel: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.textSecondary,
      marginBottom: 6,
      textAlign: 'left'
    },
    crInput: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      padding: 12,
      fontSize: 15,
      color: colors.text,
      backgroundColor: colors.borderInput,
      textAlign: 'left'
    },
    crText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      textAlign: 'center',
    },
    crTextarea: {
      height: 100,
      textAlignVertical: 'top'
    },
    crErrBorder: {
      borderColor: '#ff4d4f'
    },
    crHint: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 4
    },
    crHintLeft: {
      textAlign: 'left'
    },
    crError: {
      fontSize: 12,
      color: '#ff4d4f',
      marginTop: 4,
      textAlign: 'left'
    },
    crToggle: {
      flexDirection: 'row',
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      overflow: 'hidden'
    },
    toggleBtn: {
      flex: 1,
      paddingVertical: 12,
      alignItems: 'center',
      backgroundColor: colors.background
    },
    toggleOn: {
      backgroundColor: '#222'
    },
    toggleTextOff: {
      color: colors.text,
      fontWeight: '600'
    },
    toggleTextOn: {
      color: colors.whiteText,
      fontWeight: '600'
    },
    crSelect: {
    },
    crSelectBox: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      padding: 12,
      backgroundColor: colors.borderInput,
      justifyContent: 'center'
    },
    crSelectText: {
      color: colors.text,
      fontSize: 15,
      textAlign: 'left'
    },
    crPlaceholder: {
      color: colors.textSecondary,
      fontSize: 15,
      textAlign: 'left'
    },
    crPop: {
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.background,
      borderRadius: 8,
      marginTop: 4,
    },
    crOpt: {
      padding: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border
    },
    selectedOpt: {
      backgroundColor: colors.primaryLight
    },
    crOptText: {
      color: colors.textSecondary,
      textAlign: 'left'
    },
    selectedOptText: {
      color: colors.primary,
      fontWeight: 'bold'
    },
    crImagePick: {
      width: 100,
      height: 100,
      borderWidth: 1,
      borderColor: colors.border,
      borderStyle: 'dashed',
      borderRadius: 8,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.borderInput
    },
    crImagePickLabel: {
      color: colors.textSecondary,
      fontSize: 14
    },
    crImagePreview: {
      width: '100%',
      height: '100%'
    },
    crCat: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      padding: 16,
      marginBottom: 16,
      backgroundColor: colors.background
    },
    crCatHead: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 12
    },
    crCatTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: colors.text
    },
    crCount: {
      fontSize: 14,
      color: colors.textSecondary
    },
    crItems: {
      marginBottom: 12
    },
    crItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: colors.border
    },
    crThumb: {
      width: 40,
      height: 40,
      borderRadius: 4,
      marginRight: 12
    },
    crItemName: {
      flex: 1,
      fontSize: 15,
      color: colors.text,
      textAlign: 'left'
    },
    crItemPrice: {
      fontSize: 15,
      fontWeight: '600',
      marginRight: 12
    },
    crLink: {
      marginLeft: 8
    },
    crLinkText: {
      color: colors.textSecondary,
      fontSize: 14
    },
    crLinkDanger: {
      color: '#ff4d4f'
    },
    crAddRow: {
      marginTop: 8
    },
    crAddBtn: {
      paddingVertical: 8
    },
    crAddBtnText: {
      color: colors.primary,
      fontWeight: '600'
    },
    crItemform: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      padding: 12,
      backgroundColor: colors.borderInput,
      marginVertical: 8
    },
    crItemformTop: {
      flexDirection: 'row',
      marginBottom: 12
    },
    crItemformPhoto: {
      width: 110,
      marginRight: 12
    },
    crItemformFields: {
      flex: 1
    },
    crFieldgroup: {
      marginBottom: 10
    },

    crPriceInput: {
      flex: 1,
      borderWidth: 0,
      backgroundColor: 'transparent'
    },
    crItemformActions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      marginTop: 8
    },
    crGhost: {
      paddingVertical: 8,
      paddingHorizontal: 16,
      marginRight: 8
    },
    crGhostText: {
      color: colors.textSecondary
    },
    crSave: {
      backgroundColor: colors.text,
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 6
    },
    crSaveText: {
      color: colors.whiteText,
      fontWeight: 'bold'
    },
    crCelebrate: {
      width: 60,
      height: 60,
      backgroundColor: colors.primaryLight,
      borderRadius: 30,
      marginBottom: 16
    },
    crServer: {
      backgroundColor: '#FFEBEF',
      borderColor: '#FFD0D6',
      borderWidth: 1,
      borderRadius: 8,
      padding: 12,
      marginTop: 16,
      marginBottom: 8,
      textAlign: 'center',
      overflow: 'hidden',
    },
  });
}