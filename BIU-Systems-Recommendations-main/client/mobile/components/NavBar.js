// @ts-check

import { View, Text, Image, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import get_stylesheet from "../styles/NavBar.styles";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useState, useEffect } from "react";
import { api } from "../utils/api"

// @ts-ignore
import woltLogo from "../assets/wolt-logo.png";
// @ts-ignore
import defaultUserImage from "../assets/default-user.png";

/**
 * @typedef {import("../../../api/src/model/users").User} User
 */
export default function NavBar() {
    const styles = get_stylesheet(useTheme());
    const { user } = useAuth();
    const [fullUser, setFullUser] = useState(user);
    useEffect(() => {
        setFullUser(user);
    }, [user]);
    // api GET user request
    useEffect(() => {
        async function loadUser() {
            if (!user?.id) return;
            // If I recieved user image -> dont call GET api 
            if (user.image) return;
            const res = await api.getUser(user.id);
            if (res.status !== 200) {
                const body = await res.text();

                console.warn(
                    `GET /users/${user.id} returned unexpected response:\n`,
                    res.status,
                    res.statusText,
                    "\n",
                    body
                );

                return;
            }

            const data = await res.json();
            setFullUser( /** @type {User} */(data));
        }

        loadUser();
    }, [user?.id]);

    return (
        <View style={styles.navbar}>

            <TouchableOpacity
                onPress={() => router.push("/")}
            >
                <Image
                    source={woltLogo}
                    style={styles.logo}
                />
            </TouchableOpacity>


            <View style={styles.location}>
                <Text style={styles.smallText}>
                    Delivering to
                </Text>

                <Text style={styles.address}>
                    {fullUser?.location
                        ? `${fullUser.location.lat}, ${fullUser.location.lng}`
                        : "Log in"}
                </Text>
            </View>

            <TouchableOpacity
                onPress={() =>
                    fullUser
                        ? router.push("/profile")
                        : router.push("/login")
                }
            >
                {fullUser?.image ? (
                    <Image
                        source={{ uri: fullUser.image }}
                        style={styles.profile}
                    />
                ) : (
                    <Image
                        source={defaultUserImage}
                        style={styles.profile} />
                )}
            </TouchableOpacity>


        </View>
    );
}