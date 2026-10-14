
// @ts-check

import get_stylesheet from "../styles/PasswordStrength.styles"
import { View, Text } from 'react-native';
import {useTheme} from "../context/ThemeContext";

/** @param {string} password */
function getStrength(password) {
    if (!password) return 0;
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return Math.min(score,5);
}

const LABELS = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Very strong'];


const STRENGTH_COLORS = [
    '#e3e3e3',
    '#ff3b30',
    '#ff9500',
    '#ffcc00',
    '#4cd964',
    '#34c759',
];

/**
 * Visual password strength meter.
 * @param {{ password: string }} props
 */
export default function PasswordStrength({ password }) {
    const styles = get_stylesheet(useTheme());
    if (!password) return null;
    const score = getStrength(password);
    const currentOpacityColor = STRENGTH_COLORS[score];

    return (
        <View style={styles.container}>
            <View style={styles.barsContainer}>
                {[1, 2, 3, 4, 5].map((i) => {
                    const isActive = i <= score;
                    return (
                        <View
                            key={i}
                            style={[
                                styles.bar,
                                isActive && { backgroundColor: currentOpacityColor }
                            ]}
                        />
                    );
                })}
            </View>

            <Text style={[
                styles.label,
                score > 0 && { color: currentOpacityColor }
            ]}>
                {LABELS[score]}
            </Text>
        </View>
    );
}

