package com.buritv

import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultReactActivityDelegate

import android.content.BroadcastReceiver
import android.content.res.Configuration
import android.os.Bundle
import androidx.annotation.Nullable

class MainActivity : ReactActivity() {
  // Botones de la ventana flotante (pausar / silenciar)
  private var pipReceiver: BroadcastReceiver? = null

  override fun onCreate(@Nullable savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)

    pipReceiver = BuriPipModule.registerActionReceiver(this)
  }

  override fun onDestroy() {
    pipReceiver?.let { unregisterReceiver(it) }
    pipReceiver = null
    super.onDestroy()
  }

  override fun onStart() {
    super.onStart()
    BuriPipModule.emitLifecycle("start")
  }

  override fun onStop() {
    super.onStop()
    BuriPipModule.emitLifecycle("stop")
  }

  /**
   * Salida pedida desde JS (dos veces "atrás"): cerrar la actividad del todo.
   * Lo que trae React Native, en Android 12+ solo manda la app al fondo y
   * además deja apagado su manejador de "atrás" (al volver, el botón ya no
   * llegaba a JS y cerraba la app directamente).
   */
  override fun invokeDefaultOnBackPressed() {
    finish()
  }

  override fun onUserLeaveHint() {
    super.onUserLeaveHint()
    BuriPipModule.onUserLeaveHint(this)
  }

  override fun onPictureInPictureModeChanged(
      isInPictureInPictureMode: Boolean,
      newConfig: Configuration
  ) {
    super.onPictureInPictureModeChanged(isInPictureInPictureMode, newConfig)
    BuriPipModule.emitPip(isInPictureInPictureMode)
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
