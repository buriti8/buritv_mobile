package com.buritv

import android.app.Activity
import android.app.PendingIntent
import android.app.PictureInPictureParams
import android.app.RemoteAction
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.pm.PackageManager
import android.graphics.drawable.Icon
import android.os.Build
import android.util.Rational
import android.view.ViewGroup
import androidx.core.content.ContextCompat
import com.facebook.react.ReactPackage
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.UiThreadUtil
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.facebook.react.uimanager.UIManagerHelper
import com.facebook.react.uimanager.ViewManager
import java.lang.ref.WeakReference

/**
 * Picture-in-Picture para móvil: al salir de la app mientras se reproduce,
 * el video sigue en una ventana flotante con botones para silenciar y
 * pausar. Cerrar y volver a pantalla completa los pone el sistema.
 *
 * JS → setPlaybackState(autoEnter, paused, muted)
 * Nativo → eventos "buriPipChange" { inPip }, "buriLifecycle" { state } y
 *          "buriPipAction" { action: "playPause" | "mute" }.
 */
class BuriPipModule(private val ctx: ReactApplicationContext) :
    ReactContextBaseJavaModule(ctx) {

    init {
        context = WeakReference(ctx)
    }

    override fun getName() = "BuriPip"

    @ReactMethod
    fun setPlaybackState(enabled: Boolean, isPaused: Boolean, isMuted: Boolean) {
        autoEnter = enabled
        paused = isPaused
        muted = isMuted
        val activity = ctx.currentActivity ?: return
        activity.runOnUiThread { applyParams(activity) }
    }

    // Compatibilidad con la versión anterior del JS
    @ReactMethod
    fun setAutoEnter(enabled: Boolean) = setPlaybackState(enabled, paused, muted)

    @ReactMethod
    fun isSupported(promise: com.facebook.react.bridge.Promise) {
        val activity = ctx.currentActivity
        promise.resolve(activity != null && isSupported(activity))
    }

    /**
     * TV: que una vista (y lo que tenga adentro) no reciba el foco del
     * control remoto. El WebView de los canales web se quedaba con el foco y
     * no dejaba llegar a los botones (p. ej. pantalla completa).
     */
    @ReactMethod
    fun blockFocus(tag: Double) {
        val id = tag.toInt()
        UiThreadUtil.runOnUiThread {
            try {
                val view = UIManagerHelper.getUIManagerForReactTag(ctx, id)?.resolveView(id)
                    ?: return@runOnUiThread
                view.isFocusable = false
                view.isFocusableInTouchMode = false
                if (view is ViewGroup) {
                    view.descendantFocusability = ViewGroup.FOCUS_BLOCK_DESCENDANTS
                }
                if (view.hasFocus()) view.clearFocus()
            } catch (_: Exception) {
            }
        }
    }

    // Requeridos por NativeEventEmitter
    @ReactMethod
    fun addListener(eventName: String) {}

    @ReactMethod
    fun removeListeners(count: Double) {}

    companion object {
        private const val ACTION_PIP = "com.buritv.PIP_ACTION"
        private const val EXTRA = "action"

        @Volatile
        var autoEnter = false
        @Volatile
        var paused = false
        @Volatile
        var muted = false
        private var context: WeakReference<ReactApplicationContext>? = null

        fun isSupported(activity: Activity) =
            Build.VERSION.SDK_INT >= Build.VERSION_CODES.O &&
                activity.packageManager.hasSystemFeature(PackageManager.FEATURE_PICTURE_IN_PICTURE)

        private fun action(
            activity: Activity,
            id: String,
            requestCode: Int,
            icon: Int,
            title: String,
        ): RemoteAction {
            val intent = Intent(ACTION_PIP).setPackage(activity.packageName).putExtra(EXTRA, id)
            val pending = PendingIntent.getBroadcast(
                activity,
                requestCode,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
            )
            return RemoteAction(Icon.createWithResource(activity, icon), title, title, pending)
        }

        fun buildParams(activity: Activity): PictureInPictureParams {
            // Android no trae botones propios de play ni de sonido para el PiP
            // (solo cerrar y volver a pantalla completa): estos usan íconos
            // Material, el mismo estilo que los del sistema.
            val actions = listOf(
                action(
                    activity, "playPause", 2,
                    if (paused) R.drawable.ic_pip_play else R.drawable.ic_pip_pause,
                    if (paused) "Reproducir" else "Pausar",
                ),
                action(
                    activity, "mute", 1,
                    if (muted) R.drawable.ic_pip_volume_off else R.drawable.ic_pip_volume_on,
                    if (muted) "Activar sonido" else "Silenciar",
                ),
            )
            val builder = PictureInPictureParams.Builder()
                .setAspectRatio(Rational(16, 9))
                .setActions(actions)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                builder.setAutoEnterEnabled(autoEnter).setSeamlessResizeEnabled(true)
            }
            return builder.build()
        }

        fun applyParams(activity: Activity) {
            if (!isSupported(activity)) return
            try {
                activity.setPictureInPictureParams(buildParams(activity))
            } catch (_: Exception) {
            }
        }

        /** Android < 12: entrar a PiP a mano cuando el usuario sale de la app. */
        fun onUserLeaveHint(activity: Activity) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) return // usa autoEnter
            if (!autoEnter || !isSupported(activity) || activity.isInPictureInPictureMode) return
            try {
                activity.enterPictureInPictureMode(buildParams(activity))
            } catch (_: Exception) {
            }
        }

        /** Recibe los toques en los botones de la ventana flotante. */
        fun registerActionReceiver(activity: Activity): BroadcastReceiver {
            val receiver = object : BroadcastReceiver() {
                override fun onReceive(c: Context, intent: Intent) {
                    when (val id = intent.getStringExtra(EXTRA)) {
                        "playPause" -> {
                            paused = !paused // respuesta inmediata en el ícono
                            applyParams(activity)
                            emitAction(id)
                        }
                        "mute" -> {
                            muted = !muted
                            applyParams(activity)
                            emitAction(id)
                        }
                    }
                }
            }
            ContextCompat.registerReceiver(
                activity,
                receiver,
                IntentFilter(ACTION_PIP),
                ContextCompat.RECEIVER_NOT_EXPORTED,
            )
            return receiver
        }

        fun emitPip(inPip: Boolean) {
            emit("buriPipChange", Arguments.createMap().apply { putBoolean("inPip", inPip) })
        }

        fun emitLifecycle(state: String) {
            emit("buriLifecycle", Arguments.createMap().apply { putString("state", state) })
        }

        private fun emitAction(action: String) {
            emit("buriPipAction", Arguments.createMap().apply { putString("action", action) })
        }

        private fun emit(event: String, data: Any) {
            val c = context?.get() ?: return
            if (!c.hasActiveReactInstance()) return
            c.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                .emit(event, data)
        }
    }
}

class BuriPipPackage : ReactPackage {
    override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> =
        listOf(BuriPipModule(reactContext))

    override fun createViewManagers(
        reactContext: ReactApplicationContext,
    ): List<ViewManager<*, *>> = emptyList()
}
