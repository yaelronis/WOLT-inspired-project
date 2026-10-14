// @ts-check
import { View, Text, Image, Pressable } from "react-native";
import styles from "../styles/ProductStyle.styles";
/**
  * @typedef {import("../../../api/src/model/products").Product} Product
 */
/**
 * 
 * @param {{product: Product}} param0 
 * @returns 
 */
export default function ProductCard({ product }) {

    return (

        <Pressable style={styles.card}>


            <View style={styles.info}>

                <Text style={styles.title}>
                    {product.name}
                </Text>
                
                <Text style={styles.price}>
                    ₪{product.price}
                </Text>
            </View>
            <Image
                source={{ uri: product.pic }}
                style={styles.image}
            />


        </Pressable>
    );
}