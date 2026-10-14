// @ts-check

import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { useTheme } from "../context/ThemeContext";

import { Text, FlatList, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import RestaurantCard from "../components/RestaurantCard";
import BackButton from "../components/BackButton";
import NavBar from "../components/NavBar";

import { api } from "../utils/api";

import get_stylesheet from "../styles/CategoryScreen.style";

/** @typedef {import("../../../api/src/model/restaurants").Restaurant} Restaurant */

export default function CategoryScreen() {
    // hooks
    const router = useRouter();
    const styles = get_stylesheet(useTheme())

    // params
    const { id: category_maybe_array } = useLocalSearchParams();
    const category = Array.isArray(category_maybe_array)
        ? category_maybe_array[0]
        : category_maybe_array;

    // state
    const [restaurants, restaurants_set] = useState(
        /** @type {Restaurant[]} */([])
    );

    // init
    useEffect(() => {
        async function get_restaurants() {
            const res = await api.getRestaurants();
            if (res.status !== 200) {
                console.error(
                    '`GET /restaurants` returned unexpected status ',
                    res.status, res.statusText, '\n',
                    await res.text()
                );
                return;
            }
            /** @type {Restaurant[]} */
            const body = await res.json();
            const filtered = body.filter(r => r.category === category);
            restaurants_set(filtered);
        }
        get_restaurants();
    }, [category]);

    // methods
    function navigate_back() {
        router.push('/');
    }

    /** @param {Restaurant} restaurant */
    function restaurant_key(restaurant) {
        return restaurant.id.toString();
    }

    /** @param {{item: Restaurant}} _ */
    function render_restaurant({ item: restaurant }) {
        const onPress = () => router.push({
            pathname: `/restaurants/${restaurant.id}`,
            params: { from: `/restaurants/category/${category}` },
        });
        return <RestaurantCard restaurant={restaurant} onPress={onPress} />;
    }

    // render
    return (
        <SafeAreaView style={styles.safe_area_view}>
            <NavBar />
            <View style={styles.title_area}>
                <BackButton onPress={navigate_back} />
                <Text style={styles.title}>{category}</Text>
            </View>
            <FlatList
                style={styles.scroll_view} contentContainerStyle={styles.scroll_view_children}
                data={restaurants} keyExtractor={restaurant_key}
                renderItem={render_restaurant}
                showsVerticalScrollIndicator={false}
            />
        </SafeAreaView>
    );
}
