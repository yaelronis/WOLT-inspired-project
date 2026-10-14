// @ts-check
import React, { useState } from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { validateProfilePic } from "../utils/validation";
import get_stylesheet from "../styles/ProfilePicker.styles"
import { useTheme } from "../context/ThemeContext";

/**
 * Circular profile-picture picker with preview, hint and remove button.
 * This component owns everything about choosing a profile picture: the hidden
 * file input and its ref, type/size validation, the preview URL and the
 * FileReader that turns the file into a data URL. The parent only receives the
 * final image (a data URL string, or null when cleared) through onChange and
 * passes back a submit-time "required" error through the error prop.
 *
 * @param {object} props
 * @param {string | null} props.value
 * @param {(image: string | null) => void} props.onChange
 * @param {string} [props.error]
 */
export default function ProfilePicPicker({ value, onChange, error }) {
  const styles = get_stylesheet(useTheme());
  const [localError, setLocalError] = useState("");

  async function pickImage() {
    setLocalError("");

    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      setLocalError("Permission to access camera roll is required!");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: false,
      aspect: [1, 1],
      base64: true,
    });

    if (result.canceled) return;

    const asset = result.assets[0];
    if (!asset.base64) {
      setLocalError("Could not read image");
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
      setLocalError("Only JPG or PNG images are allowed");
      onChange(null);
      return;
    }

    if (asset.fileSize == null) {
      setLocalError("Couldn't read the image size. Please pick another image.");
      onChange(null);
      return;
    }
    const mockFileForValidation = { type: mimeType, size: asset.fileSize };
    const err = validateProfilePic(/** @type {any} */(mockFileForValidation));
    if (err) {
      setLocalError(err);
      onChange(null);
      return;
    }

    const dataUrl = `data:${mimeType};base64,${asset.base64}`;
    onChange(dataUrl);
  }

  function handleRemove() {
    setLocalError("");
    onChange(null);
  }

  const shownError = error || localError;
  const hasError = !!shownError;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Profile picture</Text>

      <View style={styles.row}>
        <TouchableOpacity
          style={[styles.pickerCircle, hasError && styles.pickerCircleError]}
          onPress={pickImage}
          activeOpacity={0.7}
        >
          {value ? (
            <Image source={{ uri: value }} style={styles.imagePreview} />
          ) : (
            <View style={styles.placeholderContainer}>
              <Text style={styles.placeholderText}>+ Add</Text>
              <Text style={styles.placeholderText}>photo</Text>
            </View>
          )}
        </TouchableOpacity>

        <View style={styles.infoContainer}>
          <Text style={styles.hint}>JPG or PNG only, max 2MB</Text>

          {value ? (
            <TouchableOpacity onPress={handleRemove} style={styles.removeButton}>
              <Text style={styles.removeButtonText}>Remove</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {hasError ? <Text style={styles.errorText}>{shownError}</Text> : null}
    </View>
  );
}

