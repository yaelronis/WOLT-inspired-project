// @ts-check

import Button from "./Button";
import get_stylesheet from "../styles/ContinueButton.styles"
import { Text, ActivityIndicator } from "react-native";
import { useTheme } from "../context/ThemeContext";

/**
 * @param {Object} props
 * @param {() => void} props.onPress
 * @param {boolean} [props.loading] 
 * @param {string} [props.title]    
 * @returns {React.JSX.Element}
 */
export default function ContinueButton({ onPress, loading = false }) {
    const styles = get_stylesheet(useTheme());
    return (
        <Button
            onPress={onPress}
            disabled={loading} 
            style={styles.button}
        >
            {loading ? (
                <ActivityIndicator color="#ffffff" />
            ) : (
                <Text style={styles.buttonText}>Continue</Text>
            )}
        </Button>
    )
}