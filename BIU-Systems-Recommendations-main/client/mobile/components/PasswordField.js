// @ts-check

import { useState } from 'react';
import { Text } from 'react-native';
import TextField from './TextField';
import Button from './Button';
import styles from "../styles/PasswordField.styles";

/**
 * @typedef {import("react-native").TextInputProps} TextInputProps
 */

/**
 * A password Textfield that owns its own show/hide.
 *
 * @param {{
 * label: string,
 * value: string,
 * onChangeText: (text: string) => void,
 * error?: string,
 * hint?: string,
 * placeholder?: string,
 * innerRef?: import("react").RefObject<any>
 * } & TextInputProps} props
 */
export default function Passwordfield({
  label,
  value,
  onChangeText,
  error,
  hint,
  placeholder,
  ...props
}) {
  const [show, setShow] = useState(false);

  return (
    <TextField
      label={label}
      value={value}
      onChangeText={onChangeText}
      error={error}
      hint={hint}
      placeholder={placeholder}
      secureTextEntry={!show}
      autoCapitalize="none"
      autoCorrect={false}
      suffix={
        <Button
          onPress={() => setShow((v) => !v)}
          style={styles.toggleButton}
          icon={<Text style={styles.toggleText}>{show ? '👁️' : '🙈'}</Text>}
        />
      }
      {...props}
    />
  );
}