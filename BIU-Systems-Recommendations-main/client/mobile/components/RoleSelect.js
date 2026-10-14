// @ts-check
import { View, Text, TouchableOpacity } from 'react-native'
import get_stylesheet from '../styles/RoleSelect.styles'
import { useTheme } from "../context/ThemeContext";

/**
 * Account type. regular user vs restaurant owner.
 *
 * @param {object} props
 * @param {'user' | 'owner'} props.value
 * @param {(value: 'user' | 'owner') => void} props.onChange
 */
export default function RoleSelect({ value, onChange }) {
    const styles = get_stylesheet(useTheme());
    return (
        <View style={styles.authView}>
            <Text>I'm registering as</Text>

            <View
                style={styles.roleSelect}
                accessibilityRole="radiogroup"
                accessibilityLabel="Account type"
            ><TouchableOpacity
                style={[
                    styles.roleOption,
                    value === 'user' && styles.roleCardSelected
                ]}
                onPress={() => onChange('user')}
                accessibilityRole="radio"
                accessibilityState={{ checked: value === 'user' }}
            >

                    <View style={styles.textContainer}>
                        <Text style={styles.roleOptionTitle}>Regular user</Text>
                        <Text style={styles.roleOptionSub}>Order food from restaurants</Text>
                    </View>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[
                        styles.roleOption,
                        value === 'owner' && styles.roleCardSelected
                    ]}
                    onPress={() => onChange('owner')}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: value === 'owner' }}
                >


                    <View style={styles.textContainer}>
                        <Text style={styles.roleOptionTitle}>Restaurant owner</Text>
                        <Text style={styles.roleOptionSub}>List and manage a restaurant</Text>
                    </View>
                </TouchableOpacity>
            </View>
        </View>
    )
}
