package com.buritv

import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultReactActivityDelegate

import android.os.Bundle
import androidx.annotation.Nullable
import com.reactnative.googlecast.api.RNGCCastContext

class MainActivity : ReactActivity() {
  override fun onCreate(@Nullable savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)

    // lazy load Google Cast context (if supported on this device)
    RNGCCastContext.getSharedInstance(this)
  }

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  override fun getMainComponentName(): String = "BuriTV"

  /**
   * Returns the instance of the [ReactActivityDelegate]. We use [DefaultReactActivityDelegate]
   * which allows you to enable New Architecture with a single boolean flags [fabricEnabled]
   */
  override fun createReactActivityDelegate(): ReactActivityDelegate =
      DefaultReactActivityDelegate(this, mainComponentName, false)
}
