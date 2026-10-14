// @ts-check
import { useState } from "react";
import { View, Text, Image, Pressable } from "react-native";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { api } from "../utils/api";
import get_stylesheet from "../styles/RestaurantCard.styles";

/**
  * @typedef {import("../../../api/src/model/restaurants").Restaurant} Restaurant
 */
/**
 *
 * @param {{restaurant: Restaurant,
 * style?: import("react-native").StyleProp<import("react-native").ViewStyle>,
 * onPress?: () => void,
 * onDeleted?: (id: number) => void}}param0
 * @returns
 */
export default function RestaurantCard({ restaurant, style, onPress, onDeleted }) {
    const styles = get_stylesheet(useTheme());
    const { token, user } = useAuth();
    const DEFAULT_IMAGE =
        "https://images.unsplash.com/photo-1513104890138-7c749659a591";

    // Hide the card the moment its restaurant is deleted, so it disappears from
    // whatever list it sits in without needing a refetch.
    const [deleted, setDeleted] = useState(false);
    const [removing, setRemoving] = useState(false);

    // Owner controls show only to the owner who created THIS restaurant (the
    // server stamps "owner" with the creator's user id on create).
    const isOwner =
        user?.role === "owner" &&
        restaurant.owner != null &&
        Number(restaurant.owner) === Number(user?.id);

    async function doDelete() {
        if (removing) return;
        setRemoving(true);
        try {
            const res = await api.deleteRestaurant(restaurant.id, token);
            if (res.ok || res.status === 204) {
                setDeleted(true);
                onDeleted?.(Number(restaurant.id));
            } else {
                // Couldn't delete (not the owner)- leave the card in place.
                setRemoving(false);
            }
        } catch {
            setRemoving(false);
        }
    }

    if (deleted) return null;

    return (
        <Pressable style={[styles.card, style]}
            onPress={onPress}>

            <Image
                source={{ uri: restaurant.imgURL || DEFAULT_IMAGE }}
                style={styles.image}
                resizeMode="cover"
            />

            {isOwner ? (
                <Pressable
                    style={styles.deleteBtn}
                    onPress={doDelete}
                    disabled={removing}
                    hitSlop={8}
                >
                    <Text style={styles.deleteBtnText}>×</Text>
                </Pressable>
            ) : null}

            <View style={styles.content}>

                <View style={styles.row}>

                    <Text style={styles.title}>
                        {restaurant.name}
                    </Text>


                    <Text>
                        ⭐ {restaurant.rating}
                    </Text>

                </View>


                <Text style={styles.category}>
                    {restaurant.category}
                </Text>


                <Text style={styles.description}
                    numberOfLines={2}
                    ellipsizeMode="tail">
                    {restaurant.description}
                </Text>

            </View>

        </Pressable>
    );
}