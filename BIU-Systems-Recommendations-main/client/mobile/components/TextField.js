// @ts-check

import get_stylesheet from "../styles/TextField.styles";
import { useTheme } from "../context/ThemeContext";
import { View, Text, TextInput } from "react-native";

/**
 * @typedef {import("react-native").TextInputProps} TextInputProps
 */

/**
 * A labelled text input with a uniform error message slot.
 *
 * @param {{
 * label?: string,
 * error?: string,
 * suffix?: import("react").ReactNode,
 * hint?: string,
 * innerRef?: import("react").RefObject<any>
 * } & TextInputProps} props
 */
export default function TextField({
  label,
  value,
  onChangeText,
  error,
  hint,
  secureTextEntry,
  suffix,
  placeholder,
  ...props
}) {
  const styles = get_stylesheet(useTheme());
  return (
    <View style={styles.fieldContainer}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={[styles.inputWrapper, error ? styles.inputErrorBorder : null]}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry}
          placeholder={placeholder}
          placeholderTextColor="#999"
          style={styles.input}
          {...props}
        />
        {suffix ? <View style={styles.suffixContainer}>{suffix}</View> : null}
      </View>
      {hint && !error ? <Text style={styles.hint}>{hint}</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}