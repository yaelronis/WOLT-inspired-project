// @ts-check
import { StyleSheet } from "react-native";

/** @param {import("./colors.styles").Theme} colors */
export default (colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: 16, paddingBottom: 40 },

  back: { paddingVertical: 6, marginBottom: 4 },
  backText: { fontSize: 16, color: colors.text },
  title: { fontSize: 26, fontWeight: "bold", color: colors.text },
  restaurantName: { marginTop: 2, color: colors.textSecondary, fontSize: 15, marginBottom: 8 },

  card: {
    backgroundColor: colors.background,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 2,
    padding: 14,
    marginTop: 12,
  },
  cardTitle: { fontSize: 16, fontWeight: "bold", color: colors.text, marginBottom: 10 },

  // Order item rows.
  item: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  itemPic: { width: 44, height: 44, borderRadius: 8, marginRight: 10 },
  itemPicEmpty: { backgroundColor: "#e0e0e0" },
  itemQty: { width: 30, color: colors.textSecondary, fontWeight: "600" },
  itemName: { flex: 1, color: colors.text },
  itemPrice: { color: colors.text, fontWeight: "600" },

  // Fee lines.
  line: { flexDirection: "row", justifyContent: "space-between", marginTop: 8 },
  lineLabel: { color: colors.textSecondary },
  lineValue: { color: colors.text },
  totalLine: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  totalLabel: { color: colors.text, fontSize: 16, fontWeight: "bold" },
  totalValue: { color: colors.text, fontSize: 16, fontWeight: "bold" },

  // Delivery.
  deliverTo: { color: colors.text, fontSize: 15, fontWeight: "600" },
  coords: { marginTop: 4, color: colors.textSecondary },
  eta: { marginTop: 4, color: colors.textSecondary },

  error: { color: "#b02a37", marginTop: 10 },

  placeBtn: {
    marginTop: 14,
    height: 52,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  placeBtnDisabled: { opacity: 0.6 },
  placeBtnText: { color: colors.text, fontWeight: "bold", fontSize: 16 },

  // Success.
  successWrap: { padding: 24, alignItems: "center" },
  checkCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 24,
  },
  checkMark: { fontSize: 38, color: colors.text, fontWeight: "bold" },
  successTitle: { fontSize: 24, fontWeight: "bold", color: colors.text, marginTop: 16 },
  successText: { marginTop: 6, color: colors.textSecondary, textAlign: "center" },
  orderNum: { marginTop: 8, color: colors.text, fontWeight: "600" },
  successActions: {
    flexDirection: "row",
    flexWrap: "nowrap",
    marginTop: 20,
    alignSelf: "stretch",
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtn: {
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
    marginHorizontal: 4,
    flexShrink: 1,
  },
  primaryBtnText: { color: colors.text, fontWeight: "bold" },
  secondaryBtn: {
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
    marginHorizontal: 4,
    flexShrink: 1,
  },
  secondaryBtnText: { color: colors.text, fontWeight: "600" },

  // Cancellation on the success screen.
  cancelNote: { color: colors.textSecondary, fontSize: 13, marginTop: 8, textAlign: "center" },
  cancelBtn: {
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e23744",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
    marginHorizontal: 4,
    flexShrink: 1,
  },
  cancelBtnDisabled: { opacity: 0.5 },
  cancelBtnText: { color: "#e23744", fontWeight: "700" },
  cancelledMsg: { color: "#e23744", fontWeight: "600", marginTop: 12 },
  cancelExpired: { color: colors.textSecondary, fontSize: 13, marginTop: 10 },

  // Empty.
  emptyWrap: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  emptyTitle: { fontSize: 22, fontWeight: "bold", color: colors.text, marginBottom: 6 },
});