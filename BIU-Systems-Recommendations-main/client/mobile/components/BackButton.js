// @ts-check

import Button from "./Button";
import { Text } from "react-native";

import { useTheme } from "../context/ThemeContext";
import get_stylesheet from "../styles/BackButton.styles"

/**
 * @param {Object} props
 * @param {() => void} props.onPress
 * @param {boolean} [props.loading] 
 * @param {string} [props.title]    
 * @returns {React.JSX.Element}
 */
export default function BackButton({ onPress }) {
    const theme = useTheme();
    const styles = get_stylesheet(theme);
    return (
        <Button style={styles.backToOrdersBtn} onPress={onPress}>
            <Text style={styles.backBtnText}>‹</Text>
        </Button>
    )
}