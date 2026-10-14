// @ts-check
import { View, Text, Image, FlatList, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { useTheme } from "../context/ThemeContext";
import get_stylesheet from "../styles/BubbleCategory.styles"

// @ts-ignore
const categoryImages = {
    // @ts-ignore
    'asian': require('../assets/categories/asian.jpg'),
    // @ts-ignore
    'cafe': require('../assets/categories/cafe.jpg'),
    // @ts-ignore
    'dessert': require('../assets/categories/dessert.jpg'),
    // @ts-ignore
    'hamburger': require('../assets/categories/hamburger.jpg'),
    // @ts-ignore
    'italian': require('../assets/categories/italian.jpg'),
    // @ts-ignore
    'middle-eastern': require('../assets/categories/middle-eastern.jpg'),
    // @ts-ignore
    'seafood': require('../assets/categories/seafood.jpg'),
    // @ts-ignore
    'vegan': require('../assets/categories/vegan.jpg'),
};

/**
 * @typedef {import("../../../api/src/model/restaurants").Restaurant} Restaurant  
 */
/**
 * 
 * @param { {restaurants: Restaurant[]}} param0
 * @returns 
 */
export default function RestaurantCategory({ restaurants }) {
    const router = useRouter();
    const theme = useTheme();
    const styles = get_stylesheet(theme);
    // Extract all categories from restaurants and remove duplicates.
    const allCategories = restaurants.map(res => res.category);
    const uniqueCategoryNames = [...new Set(allCategories)].filter(Boolean);
    const categoriesWithImages = uniqueCategoryNames.map((name, index) => {
        const cleanFileName = name.toLowerCase().replace(/ /g, "-");
        const restaurantCount = restaurants.filter(res => res.category === name).length;
        return {
            id: index.toString(),
            name: name,
            image: categoryImages[/** @type {keyof typeof categoryImages} */ (cleanFileName)],
            count: restaurantCount
        }
    });
    return (
        <View style={styles.container}>
            <View style={styles.categoryHeader}>
                <Text style={styles.title}>Categories</Text>
            </View>

            <FlatList
                horizontal
                data={categoriesWithImages}
                keyExtractor={(item) => item.id}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.listContainer}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={styles.categoryBubbleItem}
                        onPress={() => router.push(`/restaurants/category/${item.name}`)}
                    >
                        <View style={styles.bubble}>
                            <Image
                                source={item.image }
                                style={styles.bubbleImage}
                            />
                        </View>
                        <Text style={styles.categoryBubbleName} numberOfLines={1}>
                            {item.name}
                        </Text>
                        <Text style={styles.categoryCount}>
                            {item.count} places
                        </Text>
                    </TouchableOpacity>
                )}
            />
        </View>
    );
}