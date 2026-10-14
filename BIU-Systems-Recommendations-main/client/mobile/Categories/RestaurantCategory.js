// @ts-check
import { View, Text, FlatList } from "react-native";
import RestaurantCard from "../components/RestaurantCard";
import get_stylesheet from "../styles/RestaurantCategory.styles"
import { useTheme } from "../context/ThemeContext";

/**
 * @typedef {import("../../../api/src/model/restaurants").Restaurant} Restaurant  
 */
/**
 * 
 * @param {{title: string,
 * restaurants: Restaurant[],
 * onRestaurantPress: (id: string) => void}} param0
 * @returns 
 */
export default function RestaurantCategory({ title, restaurants, onRestaurantPress }) {
    const styles = get_stylesheet(useTheme());
    return (
        <View style={styles.section}>
            <Text style={styles.title}>{title}</Text>
            <FlatList
                horizontal
                data={restaurants}
                keyExtractor={(item) => item.id.toString()}
                showsHorizontalScrollIndicator={false}

                renderItem={({ item }) => (
                    <RestaurantCard restaurant={item}
                        onPress={() => onRestaurantPress(item.id.toString())} />
                )}
            />
        </View>
    );
}

