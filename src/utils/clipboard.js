/**
 * clipboard.js
 * Cross-platform clipboard utility.
 * Uses native Android ClipboardManager via NativeClipboardModule,
 * with fallbacks if invoked elsewhere.
 */
import { NativeModules } from 'react-native';

const { NativeClipboard } = NativeModules;

export async function setClipboardString(text) {
  if (!text) return false;
  try {
    if (NativeClipboard?.setString) {
      await NativeClipboard.setString(String(text));
      return true;
    }
  } catch (err) {
    console.warn('NativeClipboard.setString error:', err);
  }
  throw new Error('Clipboard is unavailable. Rebuild the Android app to enable copying.');
}

export async function getClipboardString() {
  try {
    if (NativeClipboard?.getString) {
      return await NativeClipboard.getString();
    }
  } catch (err) {
    console.warn('NativeClipboard.getString error:', err);
  }
  return '';
}

export default {
  setString: setClipboardString,
  getString: getClipboardString,
};
