package com.buritv

import android.content.Context
import android.media.AudioManager
import android.provider.Settings
import android.view.WindowManager
import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.uimanager.ViewManager
import kotlin.math.roundToInt

/**
 * Volumen del sistema y brillo de la pantalla para los gestos del video en
 * el celular (deslizar a la derecha = volumen, a la izquierda = brillo).
 * Valores de 0 a 1. Sin permisos especiales:
 *  - Volumen: el de multimedia (AudioManager), sin mostrar el panel del sistema.
 *  - Brillo: solo el de esta ventana; al salir se devuelve el del sistema.
 */
class BuriSystemModule(private val ctx: ReactApplicationContext) :
    ReactContextBaseJavaModule(ctx) {

    override fun getName() = "BuriSystem"

    private val audio: AudioManager
        get() = ctx.getSystemService(Context.AUDIO_SERVICE) as AudioManager

    @ReactMethod
    fun getVolume(promise: Promise) {
        try {
            val max = audio.getStreamMaxVolume(AudioManager.STREAM_MUSIC)
            val cur = audio.getStreamVolume(AudioManager.STREAM_MUSIC)
            promise.resolve(if (max > 0) cur.toDouble() / max else 0.0)
        } catch (e: Exception) {
            promise.reject("E_VOLUME", e)
        }
    }

    @ReactMethod
    fun setVolume(value: Double) {
        try {
            val max = audio.getStreamMaxVolume(AudioManager.STREAM_MUSIC)
            val index = (value.coerceIn(0.0, 1.0) * max).roundToInt()
            audio.setStreamVolume(AudioManager.STREAM_MUSIC, index, 0)
        } catch (e: Exception) {
            // Sin permiso (modo no molestar) o sin actividad: se ignora
        }
    }

    @ReactMethod
    fun getBrightness(promise: Promise) {
        val activity = ctx.currentActivity
        if (activity == null) {
            promise.resolve(0.5)
            return
        }
        activity.runOnUiThread {
            try {
                val own = activity.window.attributes.screenBrightness
                val value =
                    if (own >= 0f) own.toDouble()
                    else Settings.System.getInt(
                        activity.contentResolver,
                        Settings.System.SCREEN_BRIGHTNESS,
                        128,
                    ) / 255.0
                promise.resolve(value.coerceIn(0.0, 1.0))
            } catch (e: Exception) {
                promise.resolve(0.5)
            }
        }
    }

    @ReactMethod
    fun setBrightness(value: Double) {
        val activity = ctx.currentActivity ?: return
        activity.runOnUiThread {
            val lp = activity.window.attributes
            // Nunca 0: en algunos equipos apaga la pantalla
            lp.screenBrightness = value.toFloat().coerceIn(0.02f, 1f)
            activity.window.attributes = lp
        }
    }

    /** Devuelve el brillo que tenga el sistema. */
    @ReactMethod
    fun resetBrightness() {
        val activity = ctx.currentActivity ?: return
        activity.runOnUiThread {
            val lp = activity.window.attributes
            lp.screenBrightness = WindowManager.LayoutParams.BRIGHTNESS_OVERRIDE_NONE
            activity.window.attributes = lp
        }
    }
}

class BuriSystemPackage : ReactPackage {
    override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> =
        listOf(BuriSystemModule(reactContext))

    override fun createViewManagers(
        reactContext: ReactApplicationContext,
    ): List<ViewManager<*, *>> = emptyList()
}
