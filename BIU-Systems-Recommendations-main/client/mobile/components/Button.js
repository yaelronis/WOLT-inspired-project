// @ts-check
import { Pressable, Text } from 'react-native';
import React from 'react';
import { useTheme } from "../context/ThemeContext"
import get_stylesheet from "../styles/Button.styles"

/**
 * @param {Object} props
 * @param {() => void} [props.onPress]
 * @param {string} [props.title] 
 * @param {React.ReactNode} [props.children] 
 * @param {React.ReactNode} [props.icon] 
 * @param {import('react-native').ViewStyle} [props.style] 
 * @param {import('react-native').TextStyle} [props.textStyle]
 * @param {boolean} [props.disabled]
 * @returns {React.JSX.Element}
 */
export default function Button({ onPress, title, children, icon, style, textStyle, disabled }) {
    const theme = useTheme();
    const styles = get_stylesheet(theme);
    return (
        <Pressable
            onPress={onPress}
            disabled={disabled}
            style={({ pressed }) => [
                styles.defaultButton,
                style,
                pressed && { opacity: 0.9 },
            ]}
        >
            {icon && icon}
            {/* Render title text if provided. otherwise, render custom children (icons) */}
            {title ?
                (
                    <Text style={[styles.buttonText, textStyle]}>
                        {title}
                    </Text>
                ) : (
                    children
                )}
        </Pressable>
    );
}