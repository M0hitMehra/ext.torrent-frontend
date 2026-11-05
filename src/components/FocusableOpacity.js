import React, { useState } from 'react';
import { TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useAppSettings, getTheme } from '../utils/settings';
import { playTVFocusFeedback } from '../hooks';

/** Explicitly focusable on Android TV, with a high-contrast glowing TV D-pad target. */
export function FocusableOpacity({
  style,
  onFocus,
  onBlur,
  children,
  focusColor: customFocusColor,
  activeScale = 1.06,
  ...props
}) {
  const [focused, setFocused] = useState(false);
  const { settings } = useAppSettings();
  const theme = getTheme(settings.mode);
  const color = customFocusColor || (settings.focusColor && settings.focusColor !== '#FFFFFF' ? settings.focusColor : '#FF5722');

  return (
    <TouchableOpacity
      {...props}
      focusable
      onFocus={(event) => {
        setFocused(true);
        if (Platform.isTV) {
          playTVFocusFeedback();
        }
        onFocus?.(event);
      }}
      onBlur={(event) => {
        setFocused(false);
        onBlur?.(event);
      }}
      style={[
        style,
        focused && {
          borderWidth: 3.5,
          borderColor: '#FFFFFF',
          borderTopColor: '#FFFFFF',
          borderBottomColor: '#FFFFFF',
          borderLeftColor: '#FFFFFF',
          borderRightColor: '#FFFFFF',
          shadowColor: color,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 1,
          shadowRadius: 18,
          elevation: 20,
          zIndex: 99,
          ...(activeScale ? { transform: [{ scale: activeScale }] } : {}),
        },
      ]}
    >
      {typeof children === 'function' ? children({ focused }) : children}
    </TouchableOpacity>
  );
}
