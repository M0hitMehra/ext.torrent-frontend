package com.extto.torrentapp

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class NativeClipboardModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    override fun getName(): String = "NativeClipboard"

    @ReactMethod
    fun setString(text: String, promise: Promise) {
        try {
            val clipboard = reactApplicationContext.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
            val clip = ClipData.newPlainText("text", text)
            clipboard.setPrimaryClip(clip)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("CLIPBOARD_ERROR", e.message)
        }
    }

    @ReactMethod
    fun getString(promise: Promise) {
        try {
            val clipboard = reactApplicationContext.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
            val clip = clipboard.primaryClip
            if (clip != null && clip.itemCount > 0) {
                promise.resolve(clip.getItemAt(0).text.toString())
            } else {
                promise.resolve("")
            }
        } catch (e: Exception) {
            promise.reject("CLIPBOARD_ERROR", e.message)
        }
    }
}
