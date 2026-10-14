// @ts-check
import { View } from 'react-native';
import { Stack } from 'expo-router';
import { AuthProvider } from "../context/AuthContext";
import { CartProvider } from "../context/CartContext";
import { ThemeProvider } from "../context/ThemeContext";
// @ts-ignore
import { PendingOrderProvider } from "../context/PendingOrderContext";

// @ts-ignore
import CancelWindowButton from "../components/CancelWindowButton";

/** @param {any} children */
function GlobalProviders({ children }) {
    return (
        <AuthProvider>
            <CartProvider>
                <PendingOrderProvider>
                    <ThemeProvider>
                        {children}
                    </ThemeProvider>
                </PendingOrderProvider>
            </CartProvider>
        </AuthProvider>
    );
}

export default function Layout() {
    return (
        <GlobalProviders>
            <View style={{ flex: 1 }}>
                <Stack>
                <Stack.Screen
                    name="index"
                    options={{
                        headerShown: false,
                    }}
                />
                <Stack.Screen
                    name="search"
                    options={{
                        title: "Search",
                        presentation: "modal",
                        animation: "slide_from_bottom",
                        headerShown: false
                    }}
                />
                <Stack.Screen
                    name="restaurants/[id]"
                    options={{
                        headerShown: false
                    }}
                />
                <Stack.Screen
                    name="restaurants/category/[id]"
                    options={{
                        headerShown: false
                    }}
                />
                <Stack.Screen
                    name="checkout"
                    options={{
                        headerShown: false
                    }}
                />
                <Stack.Screen
                    name="login"
                    options={{
                        headerShown: false
                    }}
                />
                <Stack.Screen
                    name="register"
                    options={{
                        headerShown: false
                    }}
                />
                <Stack.Screen
                    name="profile"
                    options={{
                        headerShown: false
                    }}
                />
                <Stack.Screen
                    name="restaurants/new"
                    options={{
                        headerShown: false
                    }}
                />
                <Stack.Screen
                    name="orders/[orderId]"
                    options={{
                        headerShown: false
                    }}
                />
            </Stack>
            {/* Follows the user for 15 min after placing an order, to cancel it. */}
            <CancelWindowButton />
            </View>
        </GlobalProviders>
    );
}