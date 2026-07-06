import { Alert } from 'react-native';
import { HotUpdater } from '@hot-updater/react-native';

// Evita consultas simultáneas o alertas duplicadas
// (se llama al iniciar y cada vez que la app vuelve del background)
let busy = false;

/**
 * Consulta si hay una actualización OTA disponible y la aplica
 * previa confirmación del usuario (obligatoria si shouldForceUpdate).
 */
export default async function checkForUpdates() {
    if (busy) return;
    busy = true;

    try {
        const updateInfo = await HotUpdater.checkForUpdate({
            updateStrategy: 'appVersion',
            onError: (e) => console.log('HotUpdater check error:', e?.message ?? e),
        });

        if (!updateInfo) {
            busy = false;
            return;
        }

        const applyUpdate = async () => {
            try {
                await updateInfo.updateBundle();
                Alert.alert(
                    'Actualización',
                    'App actualizada exitosamente.',
                    [{ text: 'Ok', onPress: () => HotUpdater.reload() }],
                    { cancelable: false },
                );
            } catch (error) {
                Alert.alert(
                    'Actualización',
                    'Error en la actualización, intente nuevamente.',
                    [{ text: 'Ok', onPress: () => HotUpdater.reload() }],
                    { cancelable: false },
                );
            }
        };

        const isOptionalUpdate = !updateInfo.shouldForceUpdate;

        // busy queda liberado al Ignorar; si actualiza, la app se recarga
        const buttons = [{ text: 'Actualizar', onPress: applyUpdate }];
        if (isOptionalUpdate) {
            buttons.unshift({
                text: 'Ignorar',
                style: 'cancel',
                onPress: () => {
                    busy = false;
                },
            });
        }

        Alert.alert(
            'Hay una nueva versión de tu App',
            'Actualízala y mejora tu experiencia',
            buttons,
            {
                cancelable: isOptionalUpdate,
                onDismiss: () => {
                    busy = false;
                },
            },
        );
    } catch (error) {
        busy = false;
        console.log('HotUpdater error:', error);
    }
}
