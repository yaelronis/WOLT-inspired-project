// @ts-check

// Restaurant screen- reached from a restaurant card on the main page (/restaurant/:id).
// Mirrors the web RestaurantPage feature for feature:
// the five fixed menu sections with their products, an owner add/delete flow,
// and a customer cart (per item steppers, a floating order bar, a slide in
// "Your order" panel with "Recommended for you", and a product detail modal
// with "Often bought with"). 
// Checkout navigates to /checkout (separate task).

import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  Pressable,
  Modal,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";

import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useTheme } from "../context/ThemeContext";
import { api } from "../utils/api";
import { validateDishName, validatePrice } from "../utils/validation";
import get_stylesheet from "../styles/RestaurantScreen.styles";

import TextField from "../components/TextField";

/**
 * @typedef {import("../../../api/src/model/restaurants").Restaurant} Restaurant
 * @typedef {import("../../../api/src/model/products").Product} Product
 * @typedef {import("../context/CartContext").CartLine} CartLine
 * @typedef {import("../context/CartContext").CartProductInput} CartProductInput
 */

// The five fixed sections, shown in this order (must match product categories).
const SECTIONS = ["Starters", "Mains", "Sides", "Desserts", "Drinks"];

/** @param {number} n */
const shekel = (n) => `\u20AA${Number(n || 0).toFixed(2)}`;

export default function RestaurantScreen() {
  const styles = get_stylesheet(useTheme());
  const { id, from } = useLocalSearchParams();
  const router = useRouter();
  const restaurantId = Array.isArray(id) ? id[0] : id;
  const ridNum = Number(restaurantId);

  const { token, user } = useAuth();
  const { addItem, decItem, qtyOf, belongsTo, items: allCartItems } = useCart();

  const [restaurant, setRestaurant] = useState(
    /** @type {Restaurant | null} */ (null)
  );
  const [products, setProducts] = useState(/** @type {Product[]} */ ([]));
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [cartOpen, setCartOpen] = useState(false);
  const [addingIn, setAddingIn] = useState(/** @type {string | null} */ (null));
  const [detailProduct, setDetailProduct] = useState(
    /** @type {Product | null} */ (null)
  );

  // Owner controls show only to the owner who created THIS restaurant (the
  // server stamps "owner" with the creator's user id on create).
  const isOwner =
    user?.role === "owner" &&
    restaurant != null &&
    Number(restaurant.owner) === Number(user?.id);

  const reloadProducts = useCallback(() => {
    api
      .getProducts(String(restaurantId))
      .then((r) => (r.ok ? r.json() : []))
      .then((list) => setProducts(Array.isArray(list) ? list : []))
      .catch(() => {});
  }, [restaurantId]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setLoadError("");
    Promise.all([
      api.getRestaurant(String(restaurantId)).then((r) => (r.ok ? r.json() : null)),
      api.getProducts(String(restaurantId)).then((r) => (r.ok ? r.json() : [])),
    ])
      .then(([rest, prods]) => {
        if (!active) return;
        if (!rest) setLoadError("Restaurant not found.");
        else {
          setRestaurant(rest);
          setProducts(Array.isArray(prods) ? prods : []);
        }
        setLoading(false);
      })
      .catch(() => {
        if (active) {
          setLoadError("Could not load this restaurant.");
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [restaurantId]);

  // cart helpers (backed by the shared CartContext)
  // Only this restaurant's items show here- the cart holds one restaurant at a time.
  const cartLines = belongsTo(ridNum) ? allCartItems : [];
  const cartCount = cartLines.reduce((s, l) => s + l.qty, 0);
  const cartTotal = cartLines.reduce(
    (s, l) => s + Number(l.price) * l.qty,
    0
  );
  /** @param {CartProductInput} product */
  const addToCart = (product) =>
    addItem(ridNum, restaurant?.name ?? "", product);

  // "Go to checkout"- the checkout page reads the cart straight from context.
  function goToCheckout() {
    if (!token) {
      router.push("/login");
      return;
    }
    if (cartLines.length === 0) return;
    router.push("/checkout");
  }

  // owner actions
  /** @param {{ name: string, price: number, category: string, pic: string }} data */
  async function addProduct(data) {
    if (!token) return false;
    try {
      const res = await api.addProduct(String(restaurantId), data, token);
      if (res.ok) {
        reloadProducts();
        setAddingIn(null);
        return true;
      }
    } catch {
      /* ignore */
    }
    return false;
  }
  /** @param {string | number} pid */
  async function removeProduct(pid) {
    if (!token) return;
    try {
      const res = await api.deleteProduct(String(restaurantId), String(pid), token);
      if (res.ok || res.status === 204) reloadProducts();
    } catch {
      /* ignore */
    }
  }

  // Owner only: delete the whole restaurant (and all its products), then go home page.
  async function deleteRestaurant() {
    if (!token) return;
    try {
      const res = await api.deleteRestaurant(Number(restaurantId), token);
      if (res.ok || res.status === 204) {
        router.replace("/");
      }
    } catch {
      /* ignore */
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.stateWrap}>
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }
  if (loadError || !restaurant) {
    return (
      <SafeAreaView style={styles.stateWrap}>
        <Text style={styles.stateText}>{loadError || "Restaurant unavailable."}</Text>
        <Pressable style={styles.backLink} onPress={() => router.replace("/")}>
          <Text style={styles.backLinkText}>Go back</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const grouped = SECTIONS.map((s) => ({
    section: s,
    items: products.filter((p) => p.category === s),
  }));
  const recommended = products.filter((p) => !qtyOf(p.id)).slice(0, 4);
  // "Often bought with" = other items from this menu (shown in the product modal).
  const oftenBought = detailProduct
    ? products.filter((p) => p.id !== detailProduct.id).slice(0, 4)
    : [];

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* hero header (cover + avatar + name) */}
        <View style={styles.hero}>
          <Image
            source={restaurant.imgURL ? { uri: restaurant.imgURL } : undefined}
            style={styles.heroBg}
            resizeMode="cover"
          />
          <Pressable style={styles.backRow} onPress={() => router.replace(typeof from === "string" ? from : "/")}>
            <Text style={styles.backArrow}>‹</Text>
          </Pressable>
          {isOwner ? (
            <Pressable style={styles.deleteRestaurantBtn} onPress={deleteRestaurant}>
              <Text style={styles.deleteRestaurantBtnText}>× Delete</Text>
            </Pressable>
          ) : null}
          <View style={styles.heroInner}>
            <View style={styles.avatar}>
              {restaurant.imgURL ? (
                <Image source={{ uri: restaurant.imgURL }} style={styles.avatarImg} />
              ) : (
                <Text style={styles.avatarInitial}>
                  {(restaurant.name || "?").charAt(0).toUpperCase()}
                </Text>
              )}
            </View>
            <Text style={styles.title}>{restaurant.name}</Text>
            {restaurant.description ? (
              <Text style={styles.subtitle}>{restaurant.description}</Text>
            ) : null}
            <View style={styles.infoRow}>
              {typeof restaurant.rating === "number" ? (
                <Text style={styles.infoChip}>★ {restaurant.rating}</Text>
              ) : null}
              {restaurant.category ? (
                <Text style={styles.infoChip}>{restaurant.category}</Text>
              ) : null}
              {restaurant.address ? (
                <Text style={styles.infoChip}>{restaurant.address}</Text>
              ) : null}
            </View>
          </View>
        </View>

        {/* menu sections */}
        <View style={styles.wrap}>
          {grouped.map(({ section, items }) => {
            if (items.length === 0 && !isOwner) return null;
            return (
              <View key={section} style={styles.section}>
                <View style={styles.sectionHead}>
                  <Text style={styles.sectionTitle}>{section}</Text>
                  {isOwner && addingIn !== section ? (
                    <Pressable onPress={() => setAddingIn(section)}>
                      <Text style={styles.linkBtn}>+ Add product</Text>
                    </Pressable>
                  ) : null}
                </View>

                {isOwner && addingIn === section ? (
                  <AddProductForm
                    section={section}
                    onAdd={addProduct}
                    onCancel={() => setAddingIn(null)}
                  />
                ) : null}

                {items.length === 0 ? (
                  <Text style={styles.empty}>No items in this section yet.</Text>
                ) : (
                  items.map((p) => (
                    <Pressable
                      key={p.id}
                      style={styles.card}
                      onPress={() => setDetailProduct(p)}
                    >
                      <View style={styles.cardBody}>
                        <Text style={styles.cardName}>{p.name}</Text>
                        <Text style={styles.cardPrice}>{shekel(p.price)}</Text>
                      </View>
                      <View style={styles.cardPicWrap}>
                        {p.pic ? (
                          <Image source={{ uri: p.pic }} style={styles.cardPic} />
                        ) : (
                          <View style={[styles.cardPic, styles.cardPicEmpty]} />
                        )}

                        {isOwner ? (
                          <Pressable
                            style={styles.delBtn}
                            onPress={() => removeProduct(p.id)}
                          >
                            <Text style={styles.delBtnText}>×</Text>
                          </Pressable>
                        ) : qtyOf(p.id) ? (
                          <View style={styles.stepperOnCard}>
                            <Pressable onPress={() => decItem(p.id)} hitSlop={6}>
                              <Text style={styles.stepBtn}>−</Text>
                            </Pressable>
                            <Text style={styles.stepQty}>{qtyOf(p.id)}</Text>
                            <Pressable onPress={() => addToCart(p)} hitSlop={6}>
                              <Text style={styles.stepBtn}>+</Text>
                            </Pressable>
                          </View>
                        ) : (
                          <Pressable
                            style={styles.addBtn}
                            onPress={() => addToCart(p)}
                          >
                            <Text style={styles.addBtnText}>+</Text>
                          </Pressable>
                        )}
                      </View>
                    </Pressable>
                  ))
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* customer floating cart bar */}
      {!isOwner && cartCount > 0 && !cartOpen ? (
        <Pressable style={styles.cartBar} onPress={() => setCartOpen(true)}>
          <View style={styles.cartBarBadge}>
            <Text style={styles.cartBarBadgeText}>{cartCount}</Text>
          </View>
          <Text style={styles.cartBarLabel}>View order</Text>
          <Text style={styles.cartBarTotal}>{shekel(cartTotal)}</Text>
        </Pressable>
      ) : null}

      {/* slide-in "Your order" panel */}
      <Modal
        visible={!isOwner && cartOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setCartOpen(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setCartOpen(false)} />
        <View style={styles.panel}>
          <View style={styles.panelHead}>
            <Text style={styles.panelTitle}>Your order</Text>
            <Pressable onPress={() => setCartOpen(false)} hitSlop={8}>
              <Text style={styles.closeX}>×</Text>
            </Pressable>
          </View>

          <ScrollView>
            {cartLines.length === 0 ? (
              <Text style={styles.empty}>Your order is empty.</Text>
            ) : (
              cartLines.map((/** @type {CartLine} */ line) => (
                <View key={line.id} style={styles.line}>
                  {line.pic ? (
                    <Image source={{ uri: line.pic }} style={styles.linePic} />
                  ) : (
                    <View style={[styles.linePic, styles.cardPicEmpty]} />
                  )}
                  <View style={styles.lineInfo}>
                    <Text style={styles.lineName}>{line.name}</Text>
                    <Text style={styles.linePrice}>{shekel(line.price)}</Text>
                  </View>
                  <View style={styles.stepper}>
                    <Pressable onPress={() => decItem(line.id)} hitSlop={6}>
                      <Text style={styles.stepBtn}>−</Text>
                    </Pressable>
                    <Text style={styles.stepQty}>{line.qty}</Text>
                    <Pressable onPress={() => addToCart(line)} hitSlop={6}>
                      <Text style={styles.stepBtn}>+</Text>
                    </Pressable>
                  </View>
                </View>
              ))
            )}

            {recommended.length > 0 ? (
              <View style={styles.reco}>
                <Text style={styles.recoTitle}>Recommended for you</Text>
                <View style={styles.recoGrid}>
                  {recommended.map((p) => (
                    <View key={p.id} style={styles.recoCard}>
                      <View style={styles.recoPicWrap}>
                        {p.pic ? (
                          <Image source={{ uri: p.pic }} style={styles.recoPic} />
                        ) : (
                          <View style={[styles.recoPic, styles.cardPicEmpty]} />
                        )}
                        <Pressable
                          style={styles.recoAdd}
                          onPress={() => addToCart(p)}
                        >
                          <Text style={styles.addBtnText}>+</Text>
                        </Pressable>
                      </View>
                      <Text style={styles.recoName} numberOfLines={1}>
                        {p.name}
                      </Text>
                      <Text style={styles.recoPrice}>{shekel(p.price)}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : null}
          </ScrollView>

          <View style={styles.panelFoot}>
            <View style={styles.subtotalRow}>
              <Text style={styles.subtotalLabel}>Subtotal</Text>
              <Text style={styles.subtotalValue}>{shekel(cartTotal)}</Text>
            </View>
            <Pressable
              style={[
                styles.checkoutBtn,
                cartLines.length === 0 && styles.checkoutBtnDisabled,
              ]}
              disabled={cartLines.length === 0}
              onPress={goToCheckout}
            >
              <Text style={styles.checkoutBtnText}>
                {token ? "Go to checkout" : "Log in to order"} · {shekel(cartTotal)}
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* product detail modal */}
      <Modal
        visible={!!detailProduct}
        transparent
        animationType="fade"
        onRequestClose={() => setDetailProduct(null)}
      >
        <Pressable style={styles.overlay} onPress={() => setDetailProduct(null)} />
        {detailProduct ? (
          <View style={styles.modal}>
            <Pressable
              style={styles.modalClose}
              onPress={() => setDetailProduct(null)}
              hitSlop={8}
            >
              <Text style={styles.closeX}>×</Text>
            </Pressable>

            {detailProduct.pic ? (
              <Image source={{ uri: detailProduct.pic }} style={styles.modalPic} />
            ) : (
              <View style={[styles.modalPic, styles.cardPicEmpty]} />
            )}

            <ScrollView style={styles.modalBody}>
              <Text style={styles.modalName}>{detailProduct.name}</Text>
              {detailProduct.category ? (
                <Text style={styles.modalCat}>{detailProduct.category}</Text>
              ) : null}
              <Text style={styles.modalPrice}>{shekel(detailProduct.price)}</Text>

              {!isOwner ? (
                qtyOf(detailProduct.id) ? (
                  <View style={styles.modalStepper}>
                    <Pressable onPress={() => decItem(detailProduct.id)} hitSlop={6}>
                      <Text style={styles.stepBtnLg}>−</Text>
                    </Pressable>
                    <Text style={styles.stepQtyLg}>{qtyOf(detailProduct.id)}</Text>
                    <Pressable onPress={() => addToCart(detailProduct)} hitSlop={6}>
                      <Text style={styles.stepBtnLg}>+</Text>
                    </Pressable>
                  </View>
                ) : (
                  <Pressable
                    style={styles.modalAdd}
                    onPress={() => {
                      addToCart(detailProduct);
                      setDetailProduct(null);
                    }}
                  >
                    <Text style={styles.modalAddText}>
                      Add to order · {shekel(detailProduct.price)}
                    </Text>
                  </Pressable>
                )
              ) : null}

              {oftenBought.length > 0 ? (
                <View style={styles.often}>
                  <Text style={styles.oftenTitle}>Often bought with</Text>
                  <View style={styles.recoGrid}>
                    {oftenBought.map((op) => (
                      <Pressable
                        key={op.id}
                        style={styles.recoCard}
                        onPress={() => setDetailProduct(op)}
                      >
                        <View style={styles.recoPicWrap}>
                          {op.pic ? (
                            <Image source={{ uri: op.pic }} style={styles.recoPic} />
                          ) : (
                            <View style={[styles.recoPic, styles.cardPicEmpty]} />
                          )}
                          {!isOwner ? (
                            <Pressable
                              style={styles.recoAdd}
                              onPress={() => addToCart(op)}
                            >
                              <Text style={styles.addBtnText}>+</Text>
                            </Pressable>
                          ) : null}
                        </View>
                        <Text style={styles.recoName} numberOfLines={1}>
                          {op.name}
                        </Text>
                        <Text style={styles.recoPrice}>{shekel(op.price)}</Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              ) : null}
            </ScrollView>
          </View>
        ) : null}
      </Modal>
    </SafeAreaView>
  );
}

/**
 * Owner only inline form to add a product to one section. Same fields and
 * validators as the web AddProductForm. the photo is an optional image URL
 * (mobile has no file input).
 * @param {{ section: string, onAdd: (data: { name: string, price: number, category: string, pic: string }) => Promise<boolean>, onCancel: () => void }} props
 */
function AddProductForm({ section, onAdd, onCancel }) {
  const styles = get_stylesheet(useTheme());
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [pic, setPic] = useState("");
  const [touched, setTouched] = useState(false);
  const [busy, setBusy] = useState(false);

  const nameErr = touched || name.trim() !== "" ? validateDishName(name) : null;
  const priceErr = touched || price.trim() !== "" ? validatePrice(price) : null;

  async function submit() {
    setTouched(true);
    if (validateDishName(name) || validatePrice(price)) return;
    setBusy(true);
    const ok = await onAdd({
      name: name.trim(),
      price: Number(price.replace(/,/g, "")),
      category: section,
      pic: pic.trim(),
    });
    setBusy(false);
    if (ok) {
      setName("");
      setPrice("");
      setPic("");
    }
  }

  return (
    <View style={styles.addForm}>
      <TextField
        value={name}
        onChangeText={setName}
        placeholder="Dish name"
        error={nameErr || undefined}
      />
      <TextField
        value={price}
        onChangeText={setPrice}
        placeholder="0.00"
        keyboardType="decimal-pad"
        suffix={<Text style={styles.currency}>₪</Text>}
        error={priceErr || undefined}
      />
      <TextField
        value={pic}
        onChangeText={setPic}
        placeholder="Image URL (optional)"
        autoCapitalize="none"
      />
      <View style={styles.addFormActions}>
        <Pressable style={styles.ghostBtn} onPress={onCancel} disabled={busy}>
          <Text style={styles.ghostBtnText}>Cancel</Text>
        </Pressable>
        <Pressable style={styles.saveBtn} onPress={submit} disabled={busy}>
          <Text style={styles.saveBtnText}>{busy ? "Adding…" : "Add product"}</Text>
        </Pressable>
      </View>
    </View>
  );
}