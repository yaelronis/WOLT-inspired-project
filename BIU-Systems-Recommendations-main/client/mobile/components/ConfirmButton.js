// @ts-check

import Button from "./Button";
import get_stylesheet from "../styles/ConfirmButton.styles"
import { Text } from "react-native";
import { useTheme } from "../context/ThemeContext";

/**
 * 
 * @param {{onPress: () => void }} param0 
 * @returns 
 */
export default function ConfirmButton({ onPress }) {
    const styles = get_stylesheet(useTheme());
    return (
        <Button
            onPress={onPress}
            style={styles.confirmButton}
            icon={
                <Text>Confirm </Text>
            }
        />
    )
}