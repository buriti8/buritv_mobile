/**
 * @format
 */

// Primero que todo: "atrás" dos veces para salir queda como el último
// manejador del botón (ver src/utils/exitGuard.js)
import './src/utils/exitGuard';
import { AppRegistry, LogBox } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import App from './App';
import { name as appName } from './app.json';

const Root = () => (
    <SafeAreaProvider>
        <App />
    </SafeAreaProvider>
);

AppRegistry.registerComponent(appName, () => Root);
LogBox.ignoreAllLogs(true);