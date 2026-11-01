import React, { useState } from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { useAppSettings, getTheme } from '../utils/settings';

/** Explicitly focusable on Android TV, with a consistent visible D-pad target. */
export function FocusableOpacity({ style, onFocus, onBlur, children, ...props }) {
  const [focused, setFocused] = useState(false);
  const { settings } = useAppSettings();
  const theme = getTheme(settings.mode);
  const color = settings.focusColor;

  return (
    <TouchableOpacity
      {...props}
      focusable
      onFocus={(event) => { setFocused(true); onFocus?.(event); }}
      onBlur={(event) => { setFocused(false); onBlur?.(event); }}
      style={[
        style,
        focused && styles.focused,
        focused && {
          borderColor: color,
          shadowColor: color,
          backgroundColor: theme.glass ? `${color}35` : undefined,
        },
      ]}
    >
      {children}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  focused: {
    borderWidth: 4,
    transform: [{ scale: 1.045 }],
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 24,
    zIndex: 20,
  },
});
