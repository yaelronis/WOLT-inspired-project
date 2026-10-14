// @ts-check

// Restaurant creation page for a restaurant owner.
// Everything (profile+menu) is collected locally so the owner can move back
// and forth and edit/remove items freely.
// Nothing is sent until "Open restaurant"- we POST /restaurants to get an id, then POST each menu item to
// that restaurant.
// Rating is sent as 0.

import { useState, useRef, useEffect } from 'react'
import { SafeAreaView } from "react-native-safe-area-context";
import { View, Text, TouchableOpacity, ScrollView, ImageBackground, ActivityIndicator } from 'react-native'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { api } from '../utils/api'
import { router } from 'expo-router'
import { validateLocation, validateName, validateAddress, validateDishName, validatePrice } from '../utils/validation'
import get_stylesheet from "../styles/CreateRestaurant.style"
import Button from '../components/Button'
import * as ExpoImagePicker from 'expo-image-picker'

import ProfilePicPicker from '../components/ProfilePicker'
import TextField from '../components/TextField'

// The five fixed menu sections a product can belong to.
const MENU_SECTIONS = ['Starters', 'Mains', 'Sides', 'Desserts', 'Drinks']
const MAX_DESC = 160
const MAX_DISH_BYTES = 1024 * 1024 // 1MB for a dish photo.

/* small building blocks */

/** @param {{ step: number }} props */
function Stepper({ step }) {
    const styles = get_stylesheet(useTheme());
    return (
        <View style={styles.crStepper}>
            <View style={styles.crStepRow}>
                <Text style={[styles.crStep, step > 1 ? styles.done : step === 1 ? styles.active : null]}>
                    <Text style={styles.crNum}>{step > 1 ? '✓' : '1'}</Text> Profile
                </Text>
                <View style={styles.crBar} />
                <Text style={[styles.crStep, step === 2 ? styles.active : null]}>
                    <Text style={styles.crNum}>2</Text> Menu
                </Text>
            </View>
        </View>
    )
}

/**
 * Single select for the restaurant category.
 * @param {{ value: string, onChange: (v: string) => void, error?: boolean, categories: string[] }} props
 */
function CategorySelect({ value, onChange, error, categories }) {
    const styles = get_stylesheet(useTheme());
    const [open, setOpen] = useState(false)
    return (
        <View style={styles.crSelect}>
            <TouchableOpacity
                activeOpacity={0.7}
                style={[styles.crSelectBox, error ? styles.crErrBorder : null]}
                onPress={() => setOpen((o) => !o)}
            >
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                    <Text style={value ? styles.crSelectText : styles.crPlaceholder}>
                        {value || 'Choose a category'}
                    </Text>
                    <Text style={[value ? styles.crSelectText : styles.crPlaceholder, { fontSize: 12, marginLeft: 8 }]}>
                        ∨
                    </Text>
                </View>
            </TouchableOpacity>
            {open && (
                <View style={styles.crPop}>
                    {categories.map((c) => (
                        <TouchableOpacity key={c} style={[styles.crOpt, c === value ? styles.selectedOpt : null]} onPress={() => { onChange(c); setOpen(false) }}>
                            <Text style={[styles.crOptText, c === value ? styles.selectedOptText : null]}>{c}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            )}
        </View>
    )
}

/**
 * Square image picker that returns a data URL. Optional validate(file) returns
 * an error string (or null). on error the file is rejected and reported.
 * @param {{ value: string, onChange: (image: string | null) => void, onError?: (msg: string) => void, label: string }} props
 */
function DishImagePicker({ value, onChange, onError, label }) {
    const styles = get_stylesheet(useTheme());

    async function handlePickImage() {
        const permissionResult = await ExpoImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permissionResult.granted) {
            if (onError) onError('Permission to access gallery is required.');
            return;
        }
        const result = await ExpoImagePicker.launchImageLibraryAsync({
            mediaTypes: ["images"],
            allowsEditing: false,
            aspect: [1, 1],
            base64: true,
        });

        if (result.canceled) return;
        const asset = result.assets[0];
        if (!asset.base64) {
            onChange(null);
            return;
        }
        let mimeType = null;

        if (asset.base64.startsWith("/9j/")) {
            mimeType = "image/jpeg";
        } else if (asset.base64.startsWith("iVBORw0KG")) {
            mimeType = "image/png";
        }

        if (!mimeType) {
            if (onError) onError('Only JPG or PNG images are allowed.');
            onChange(null);
            return;
        }

        if (asset.fileSize && asset.fileSize > MAX_DISH_BYTES) {
            if (onError) onError('Image must be 1MB or smaller.');
            return;
        }

        if (onError) onError('');
        const dataUrl = `data:${mimeType};base64,${asset.base64}`;
        onChange(dataUrl);
    }

    return (
        <TouchableOpacity activeOpacity={0.7} style={styles.crImagePick} onPress={handlePickImage}>
            {value ? (
                <ImageBackground source={{ uri: value }} style={styles.crImagePreview} imageStyle={{ borderRadius: 8 }} />
            ) : (
                <Text style={styles.crImagePickLabel}>{label}</Text>
            )}
        </TouchableOpacity>
    )
}

/**
 * Inline form for a single menu item. Pass "initial" to edit an existing one.
 * @param {{ initial?: { name: string, price: number, pic: string }, onSave: (item: { name: string, price: number, pic: string }) => void, onCancel: () => void }} props
 */
function MenuItemForm({ initial, onSave, onCancel }) {
    const styles = get_stylesheet(useTheme());

    const [name, setName] = useState(initial ? initial.name : '')
    const [price, setPrice] = useState(initial ? String(initial.price) : '')
    const [pic, setPic] = useState(initial ? initial.pic : '')
    const [picError, setPicError] = useState('')
    const [touched, setTouched] = useState(false)

    const nameErr = (touched || name.trim() !== '') ? validateDishName(name) : null
    const priceErr = (touched || price.trim() !== '') ? validatePrice(price) : null

    function handleSave() {
        setTouched(true)
        if (validateDishName(name) || validatePrice(price)) return
        onSave({ name: name.trim(), price: Number(price.replace(/,/g, '')), pic })
    }

    return (
        <View style={styles.crItemform}>
            <View style={styles.crItemformTop}>
                <View style={styles.crItemformPhoto}>
                    <DishImagePicker
                        value={pic}
                        onChange={(v) => setPic(v || '')}
                        onError={setPicError}
                        label="Add photo"
                    />
                    <Text style={[styles.crHint, styles.crHintLeft]}>Dish photo: JPG/PNG, max 1MB.</Text>
                    {picError ? <Text style={styles.crError}>{picError}</Text> : null}
                </View>
                <View style={styles.crItemformFields}>
                    <TextField
                        value={name}
                        onChangeText={setName}
                        placeholder="Dish name"
                        hint="English letters, numbers and basic punctuation. 2-50 characters."
                        error={nameErr || undefined}
                    />

                    <TextField
                        keyboardType="decimal-pad"
                        maxLength={10}
                        value={price}
                        onChangeText={setPrice}
                        placeholder="0.00"
                        hint="Numbers only, Example: 49.90."
                        error={priceErr || undefined}
                        suffix={<Text>₪</Text>}
                    />
                </View>
            </View>
            <View style={styles.crItemformActions}>
                <TouchableOpacity style={styles.crGhost} onPress={onCancel}>
                    <Text style={styles.crGhostText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.crSave} onPress={handleSave}>
                    <Text style={styles.crSaveText}>{initial ? 'Save changes' : 'Add item'}</Text>
                </TouchableOpacity>
            </View>
        </View>
    )
}

/**
 * One menu section card- lists its items (each editable/removable)+ add form.
 * @param {{ name: string, items: any[], onAdd: (item: any) => void, onUpdate: (uid: number, item: any) => void, onDelete: (uid: number) => Promise<void> }} props
 */
function CategoryCard({ name, items, onAdd, onUpdate, onDelete }) {
    const styles = get_stylesheet(useTheme());

    const [mode, setMode] = useState(/** @type {null | 'add' | number} */(null))
    // track which item is mid-delete so we can disable its button and
    // wait for the server before removing it from the UI.
    const [deletingUid, setDeletingUid] = useState(/** @type {number | null} */(null))

    return (
        <View style={styles.crCat}>
            <View style={styles.crCatHead}>
                <Text style={styles.crCatTitle}>{name}</Text>
                <Text style={styles.crCount}>{items.length} item{items.length === 1 ? '' : 's'}</Text>
            </View>

            {items.length > 0 && (
                <View style={styles.crItems}>
                    {items.map((it) => (
                        mode === it.uid ? (
                            <MenuItemForm key={it.uid} initial={it} onCancel={() => setMode(null)} onSave={(data) => { onUpdate(it.uid, data); setMode(null) }} />
                        ) : (
                            <View style={styles.crItem} key={it.uid}>
                                {it.pic ? (
                                    <ImageBackground source={{ uri: it.pic }} style={styles.crThumb} imageStyle={{ borderRadius: 4 }} />
                                ) : (
                                    <View style={[styles.crThumb, { backgroundColor: '#e0e0e0' }]} />
                                )}
                                <Text style={styles.crItemName}>{it.name}</Text>
                                <Text style={styles.crItemPrice}>₪{it.price.toFixed(2)}</Text>
                                <TouchableOpacity style={styles.crLink} onPress={() => setMode(it.uid)}>
                                    <Text style={styles.crLinkText}>Edit</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.crLink}
                                    disabled={deletingUid === it.uid}
                                    onPress={async () => {
                                        setDeletingUid(it.uid)
                                        await onDelete(it.uid)
                                        setDeletingUid((prev) => (prev === it.uid ? null : prev))
                                    }}
                                >
                                    <Text style={[styles.crLinkText, styles.crLinkDanger]}>
                                        {deletingUid === it.uid ? 'Deleting…' : 'Delete'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        )
                    ))}
                </View>
            )}

            {mode === 'add' ? (
                <MenuItemForm onCancel={() => setMode(null)} onSave={(data) => { onAdd(data); setMode(null) }} />
            ) : (
                <View style={styles.crAddRow}>
                    <TouchableOpacity style={styles.crAddBtn} onPress={() => setMode('add')}>
                        <Text style={styles.crAddBtnText}>+ Add menu item</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    )
}

/* page */

export default function CreateRestaurant() {
    const styles = get_stylesheet(useTheme());
    const { token } = useAuth()

    const [stage, setStage] = useState(/** @type {'welcome'|'profile'|'menu'|'done'} */('welcome'))

    const [form, setForm] = useState({
        name: '', address: '', coords: '', description: '', category: '',
        vegetarian: /** @type {boolean | null} */ (null), promoted: /** @type {boolean | null} */ (null), imgURL: '',
    })
    const [touched, setTouched] = useState(false)
    const [imgErr, setImgErr] = useState('')

    const [menu, setMenu] = useState(/** @type {Record<string, any[]>} */(
        MENU_SECTIONS.reduce((o, s) => ({ ...o, [s]: [] }), {})
    ))
    const uidRef = useRef(1)

    // Map<localUid, serverProductId> instead of Set<localUid>.
    // Knowing the server id lets us PATCH an edited item instead of
    // POST-ing a duplicate, and DELETE an item from the server when
    // the user removes it from the UI.
    const savedItems = useRef(/** @type {Map<number, number>} */(new Map()))

    // tracks which saved items were edited since their last successful
    // submit. Only dirty items get a PATCH on the next "Open restaurant" click,
    // so we don't send no-op PATCH requests for every item on a retry after a
    // partial failure.
    const dirtyUids = useRef(/** @type {Set<number>} */(new Set()))

    const [restaurantId, setRestaurantId] = useState(/** @type {number | null} */(null))
    const [submitting, setSubmitting] = useState(false)
    const [submitError, setSubmitError] = useState('')

    const [categories, setCategories] = useState(/** @type {string[]} */([]))
    useEffect(() => {
        let active = true
        api.getCategories()
            .then((res) => (res.ok ? res.json() : []))
            .then((list) => { if (active) setCategories(Array.isArray(list) ? list : []) })
            .catch(() => { if (active) setCategories([]) })
        return () => { active = false }
    }, [])

    const descOver = form.description.length > MAX_DESC
    const nameErr = (touched || form.name.trim() !== '') ? validateName(form.name) : null
    const addressErr = (touched || form.address.trim() !== '') ? validateAddress(form.address) : null
    const coordsErr = (touched || form.coords.trim() !== '') ? validateLocation(form.coords) : null
    const catErr = touched && !form.category
    const vegErr = touched && form.vegetarian === null ? 'Please choose Yes or No.' : null
    const promoErr = touched && form.promoted === null ? 'Please choose Yes or No.' : null

    /** @param {Partial<typeof form>} patch */
    const update = (patch) => setForm((prev) => ({ ...prev, ...patch }))

    function continueToMenu() {
        setTouched(true)
        const imageError = form.imgURL ? '' : 'Please upload a restaurant picture.'
        setImgErr(imageError)
        if (validateName(form.name) || validateAddress(form.address) || validateLocation(form.coords) || !form.category || form.vegetarian === null || form.promoted === null || descOver || imageError) return
        setStage('menu')
    }

    /** @param {string} section @param {{ name: string, price: number, pic: string }} item */
    function addItem(section, item) {
        const uid = uidRef.current++
        setMenu((m) => ({ ...m, [section]: [...m[section], { uid, ...item }] }))
    }
    /** @param {string} section @param {number} uid @param {{ name: string, price: number, pic: string }} item */
    function updateItem(section, uid, item) {
        setMenu((m) => ({ ...m, [section]: m[section].map((i) => (i.uid === uid ? { ...i, ...item } : i)) }))
        // mark as dirty so the next submit knows to PATCH this item.
        // Only items already on the server will be in savedItems.
        if (savedItems.current.has(uid)) dirtyUids.current.add(uid)
    }

    /** @param {string} section @param {number} uid */
    async function deleteItem(section, uid) {
        const existingServerId = savedItems.current.get(uid)
        if (existingServerId != null && restaurantId != null) {
            // item exists on the server -> delete it there too before
            // removing from the UI, so it doesn't become a ghost entry.
            const res = await api.deleteProduct(String(restaurantId), String(existingServerId), token)
            if (!res.ok) { setSubmitError('Could not delete the item. Please try again.'); return }
        }
        savedItems.current.delete(uid)
        dirtyUids.current.delete(uid)
        // Only update UI after server confirmed deletion (or item was never saved).
        setMenu((m) => ({ ...m, [section]: m[section].filter((i) => i.uid !== uid) }))
    }

    const totalItems = MENU_SECTIONS.reduce((n, s) => n + menu[s].length, 0)

    async function openRestaurant() {
        if (totalItems === 0) return
        setSubmitError('')
        setSubmitting(true)
        try {
            let id = restaurantId
            if (id == null) {
                const [latStr, lngStr] = form.coords.trim().split(/[\s,]+/)
                const res = await api.createRestaurant({
                    name: form.name.trim(),
                    address: form.address.trim(),
                    description: form.description.trim(),
                    category: form.category,
                    vegetarian: form.vegetarian,
                    promoted: form.promoted,
                    rating: 0,
                    imgURL: form.imgURL,
                    location: { lat: parseFloat(latStr), lng: parseFloat(lngStr) },
                }, token)
                if (res.status === 401) { setSubmitError('Your session has expired. Please log in again.'); setSubmitting(false); return }
                if (!res.ok) { setSubmitError('Could not create the restaurant. Please check your details.'); setSubmitting(false); return }
                const created = await res.json()
                id = created.id
                setRestaurantId(id)
            }
            for (const section of MENU_SECTIONS) {
                for (const item of menu[section]) {
                    const existingServerId = savedItems.current.get(item.uid)
                    if (existingServerId != null) {
                        if (!dirtyUids.current.has(item.uid)) continue // unchanged, skip.
                        const res = await api.updateProduct(String(id), String(existingServerId), { name: item.name, price: item.price, category: section, pic: item.pic }, token)
                        if (!res.ok) { setSubmitError(`Could not update "${item.name}". Please try again.`); setSubmitting(false); return }
                        dirtyUids.current.delete(item.uid) // clean after successful PATCH.
                    } else {
                        const res = await api.addProduct(String(id), { name: item.name, price: item.price, category: section, pic: item.pic }, token)
                        if (!res.ok) { setSubmitError(`Could not save "${item.name}". Please try again.`); setSubmitting(false); return }
                        const created = await res.json()
                        savedItems.current.set(item.uid, created.id)
                    }
                }
            }
            setSubmitting(false)
            setStage('done')
        } catch {
            setSubmitError('Cannot reach the server. Check your connection.')
            setSubmitting(false)
        }
    }

    return (
        <SafeAreaView style={{ flex: 1 }}>
            <ScrollView contentContainerStyle={styles.crWrap}>
                <Text style={styles.crBrand}><Text style={styles.crDot}>●</Text> Wolt Merchant</Text>

                {stage === 'welcome' && (
                    <View style={[styles.crCard, styles.crCenter]}>
                        <View style={styles.crCelebrate} />
                        <Text style={styles.crText}>Welcome To Wolt Merchant!</Text>
                        <Text style={styles.crSub}>Your place is almost ready to take orders. Complete the steps below and we'll get you live.</Text>
                        <Button style={styles.crPink} onPress={() => setStage('profile')}>
                            <Text style={styles.crPinkText}>Start</Text>
                        </Button>
                    </View>
                )}

                {stage === 'profile' && (
                    <View style={styles.crCard}>
                        <TouchableOpacity style={styles.crBack} onPress={() => setStage('welcome')}>
                            <Text style={styles.crBackText}>← Back</Text>
                        </TouchableOpacity>
                        <Stepper step={1} />
                        <Text style={styles.crText}>Set Up Your Restaurant</Text>
                        <Text style={styles.crSub}>Task 1- Enter your restaurant details.</Text>

                        <View style={styles.crField}>
                            <ProfilePicPicker
                                value={form.imgURL}
                                onChange={(v) => {
                                    update({ imgURL: v || '' });
                                    setImgErr('')
                                }}
                                error={imgErr}
                            />
                        </View>

                        <TextField
                            label="Place name"
                            maxLength={50}
                            value={form.name}
                            onChangeText={(text) => update({ name: text })}
                            hint="English letters, numbers and basic punctuation. 2-50 characters"
                            error={nameErr || undefined}
                        />

                        <TextField
                            label="Address"
                            value={form.address}
                            onChangeText={(text) => update({ address: text })}
                            hint="English letters, numbers and basic punctuation. 2-50 characters"
                            error={addressErr || undefined}
                        />

                        <TextField
                            label="Location (coordinates)"
                            value={form.coords}
                            onChangeText={(text) => update({ coords: text })}
                            hint="Coordinates as lat, lng. Example: 32.0853, 34.7818"
                            error={coordsErr || undefined}
                        />

                        <View style={styles.crField}>
                            <Text style={styles.crLabel}>Category</Text>
                            <CategorySelect value={form.category} onChange={(v) => update({ category: v })} error={catErr} categories={categories} />
                            <Text style={[styles.crHint, styles.crHintLeft]}>Pick the closest category.</Text>
                            {catErr ? <Text style={styles.crError}>Please choose a category.</Text> : null}
                        </View>

                        <TextField
                            label="Description"
                            multiline
                            numberOfLines={4}
                            value={form.description}
                            onChangeText={(text) => update({ description: text })}
                            placeholder="A short description of your restaurant"
                            hint={`Optional. Up to ${MAX_DESC} characters.`}
                            error={descOver ? `Description must be ${MAX_DESC} characters or fewer.` : undefined}
                        />

                        <View style={styles.crField}>
                            <Text style={styles.crLabel}>Vegetarian-friendly</Text>
                            <View style={styles.crToggle}>
                                <TouchableOpacity style={[styles.toggleBtn, form.vegetarian === true ? styles.toggleOn : null]} onPress={() => update({ vegetarian: true })}>
                                    <Text style={form.vegetarian === true ? styles.toggleTextOn : styles.toggleTextOff}>Yes</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.toggleBtn, form.vegetarian === false ? styles.toggleOn : null]} onPress={() => update({ vegetarian: false })}>
                                    <Text style={form.vegetarian === false ? styles.toggleTextOn : styles.toggleTextOff}>No</Text>
                                </TouchableOpacity>
                            </View>
                            <Text style={[styles.crHint, styles.crHintLeft]}>Choose Yes or No.</Text>
                            {vegErr ? <Text style={styles.crError}>{vegErr}</Text> : null}
                        </View>

                        <View style={styles.crField}>
                            <Text style={styles.crLabel}>Promotion</Text>
                            <View style={styles.crToggle}>
                                <TouchableOpacity style={[styles.toggleBtn, form.promoted === true ? styles.toggleOn : null]} onPress={() => update({ promoted: true })}>
                                    <Text style={form.promoted === true ? styles.toggleTextOn : styles.toggleTextOff}>Yes</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.toggleBtn, form.promoted === false ? styles.toggleOn : null]} onPress={() => update({ promoted: false })}>
                                    <Text style={form.promoted === false ? styles.toggleTextOn : styles.toggleTextOff}>No</Text>
                                </TouchableOpacity>
                            </View>
                            <Text style={[styles.crHint, styles.crHintLeft]}>Choose Yes or No.</Text>
                            {promoErr ? <Text style={styles.crError}>{promoErr}</Text> : null}
                        </View>

                        <TouchableOpacity style={styles.crPink} onPress={continueToMenu}>
                            <Text style={styles.crPinkText}>Continue</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {stage === 'menu' && (
                    <View style={styles.crCard}>
                        <TouchableOpacity style={styles.crBack} onPress={() => setStage('profile')}>
                            <Text style={styles.crBackText}>← Back</Text>
                        </TouchableOpacity>
                        <Stepper step={2} />
                        <Text style={styles.crText}>Build Your Menu</Text>
                        <Text style={styles.crSub}>Task 2- Add dishes to each section. You can edit or remove any item.</Text>

                        {MENU_SECTIONS.map((s) => (
                            <CategoryCard key={s} name={s} items={menu[s]} onAdd={(item) => addItem(s, item)} onUpdate={(uid, item) => updateItem(s, uid, item)} onDelete={(uid) => deleteItem(s, uid)} />
                        ))}

                        {submitError ? <Text style={[styles.crError, styles.crServer]} accessibilityRole="alert">{submitError}</Text> : null}

                        <TouchableOpacity style={styles.crPink} disabled={totalItems === 0 || submitting} onPress={openRestaurant}>
                            {submitting ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.crPinkText}>
                                    {`Open restaurant${totalItems > 0 ? ` (${totalItems} items)` : ''}`}
                                </Text>
                            )}
                        </TouchableOpacity>
                        {totalItems === 0 ? <Text style={styles.crHint}>Add at least one item to open your restaurant.</Text> : null}
                    </View>
                )}

                {stage === 'done' && (
                    <View style={[styles.crCard, styles.crCenter]}>
                        <View style={styles.crCelebrate} />
                        <Text style={styles.crText}>{form.name} is live!</Text>
                        <Text style={styles.crSub}>{form.category}{form.vegetarian ? ' · Vegetarian-friendly' : ''}{'\n'}{totalItems} menu items across {MENU_SECTIONS.length} sections.</Text>
                        <TouchableOpacity style={styles.crPink} onPress={() => router.push("/")}>
                            <Text style={styles.crPinkText}>Go to main page</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    )
}