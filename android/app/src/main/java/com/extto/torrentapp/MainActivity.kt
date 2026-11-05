package com.extto.torrentapp

import android.os.Build
import android.os.Bundle
import android.view.KeyEvent

import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate
import com.facebook.react.bridge.Arguments
import com.facebook.react.modules.core.DeviceEventManagerModule

import expo.modules.ReactActivityDelegateWrapper

class MainActivity : ReactActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    // Set the theme to AppTheme BEFORE onCreate to support
    // coloring the background, status bar, and navigation bar.
    // This is required for expo-splash-screen.
    setTheme(R.style.AppTheme)
    super.onCreate(null)
  }

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  override fun getMainComponentName(): String = "main"

  /**
   * Returns the instance of the [ReactActivityDelegate]. We use [DefaultReactActivityDelegate]
   * which allows you to enable New Architecture with a single boolean flags [fabricEnabled]
   */
  override fun createReactActivityDelegate(): ReactActivityDelegate {
    return ReactActivityDelegateWrapper(
          this,
          BuildConfig.IS_NEW_ARCHITECTURE_ENABLED,
          object : DefaultReactActivityDelegate(
              this,
              mainComponentName,
              fabricEnabled
          ){})
  }

  /**
   * Intercept TV Remote D-pad key events and emit them to React Native.
   * This provides 100% reliable TV navigation across Android TV, Fire TV, and remote controls.
   */
  override fun dispatchKeyEvent(event: KeyEvent): Boolean {
      if (event.action == KeyEvent.ACTION_DOWN) {
          val keyType = when (event.keyCode) {
              KeyEvent.KEYCODE_DPAD_UP -> "up"
              KeyEvent.KEYCODE_DPAD_DOWN -> "down"
              KeyEvent.KEYCODE_DPAD_LEFT -> "left"
              KeyEvent.KEYCODE_DPAD_RIGHT -> "right"
              KeyEvent.KEYCODE_DPAD_CENTER, KeyEvent.KEYCODE_ENTER, KeyEvent.KEYCODE_NUMPAD_ENTER -> "select"
              KeyEvent.KEYCODE_MEDIA_PLAY_PAUSE, KeyEvent.KEYCODE_MEDIA_PLAY -> "playPause"
              KeyEvent.KEYCODE_MEDIA_FAST_FORWARD -> "fastForward"
              KeyEvent.KEYCODE_MEDIA_REWIND -> "rewind"
              else -> null
          }

          if (keyType != null) {
              try {
                  val reactContext = reactInstanceManager?.currentReactContext
                  if (reactContext != null) {
                      val params = Arguments.createMap().apply {
                          putString("eventType", keyType)
                          putInt("keyCode", event.keyCode)
                      }
                      reactContext
                          .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                          .emit("onTVRemoteKey", params)
                      return true
                  }
              } catch (_: Exception) {}
          }
      }
      return super.dispatchKeyEvent(event)
  }

  /**
    * Align the back button behavior with Android S
    * where moving root activities to background instead of finishing activities.
    * @see <a href="https://developer.android.com/reference/android/app/Activity#onBackPressed()">onBackPressed</a>
    */
  override fun invokeDefaultOnBackPressed() {
      if (Build.VERSION.SDK_INT <= Build.VERSION_CODES.R) {
          if (!moveTaskToBack(false)) {
              // For non-root activities, use the default implementation to finish them.
              super.invokeDefaultOnBackPressed()
          }
          return
      }

      // Use the default back button implementation on Android S
      // because it's doing more than [Activity.moveTaskToBack] in fact.
      super.invokeDefaultOnBackPressed()
  }
}
