// @ts-check
import { StyleSheet } from "react-native";

/** @param {import("./colors.styles").Theme} colors */
export default (colors) => StyleSheet.create({
  fieldContainer: {
    marginBottom: 16,
    width: '100%',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 6,
    color: colors.textSecondary,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.borderInput,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 48,
  },
  inputErrorBorder: {
    borderColor: '#ff3b30',
  },
  input: {
    flex: 1,
    height: '100%',
    color: colors.text,
    backgroundColor: colors.background,
    fontSize: 16,
  },
  suffixContainer: {
    marginLeft: 8,
  },
  hint: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  error: {
    fontSize: 12,
    color: '#ff3b30',
    marginTop: 4,
    fontWeight: '500',
  },
});