// @ts-check
import React from 'react';
import { View  } from 'react-native';
import styles from "../styles/Form.styles"
/**
 * * @param {{ children: React.ReactNode }} props
 */
export default function Form({ children }) {
  return (
    <View style={styles.authForm}>
      {children} 
    </View>
  );
}

