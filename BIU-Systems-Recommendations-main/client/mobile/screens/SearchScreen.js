// @ts-check

import { useState } from "react";
import { TextInput, FlatList, Text, Pressable, View, Modal } from "react-native";
import Button from "../components/Button"
import { SafeAreaView } from "react-native-safe-area-context";
import RestaurantCard from "../components/RestaurantCard"
import get_stylesheet from "../styles/SearchScreen.styles";
import { api } from "../utils/api";
import { useRouter } from "expo-router";
import { useTheme } from "../context/ThemeContext";

/**
 * @typedef {import("../../../api/src/model/restaurants").Restaurant} Restaurant  
 */

export default function SearchScreen() {
    const styles = get_stylesheet(useTheme());
    const router = useRouter();
    const [open, setOpen] = useState(true);
    const [query, setQuery] = useState("");
    const [results, setResults] = useState(/** @type {Restaurant[]} */([]));

    /**
     * @param {string} text
     */
    async function handleSearch(text) {
        setQuery(text);

        if (!text.trim()) {
            setResults([]);
            return;
        }

        const response = await api.search(text);

        if (response.status !== 200) {
            setResults([]);
            return;
        }

        const data = /** @type {Restaurant[]} */ (
      /** @type {unknown} */ (await response.json())
        );


        setResults(data);
    }
    const handleClose = () => {
        router.replace('/');
    };

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={open}
            onRequestClose={handleClose}
        >
            <SafeAreaView style={styles.container}>
                <View style={styles.headerContainer}>
                    <Button
                        onPress={handleClose}
                        style={styles.closeButton}
                        icon={<Text>⌵</Text>}
                    />
                    <TextInput
                        value={query}
                        onChangeText={handleSearch}
                        placeholder="Search restaurants"
                        autoFocus
                        style={styles.input}
                    />
                </View>

                <FlatList
                    data={results}
                    keyExtractor={(item) => String(item.id)}
                    renderItem={({ item }) => (
                        <RestaurantCard
                            restaurant={item}
                            style={styles.resultCard}
                            onPress={() => {
                                router.push(`/restaurants/${item.id}`);
                                setOpen(false);
                            }}
                        />
                    )}
                />

            </SafeAreaView>
        </Modal>
    );
}