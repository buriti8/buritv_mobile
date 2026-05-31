const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

const defaultConfig = getDefaultConfig(__dirname);

const config = {
    transformer: {
        getTransformOptions: async () => ({
            transform: {
                inlineRequires: true,
            },
        }),
    },
};

module.exports = mergeConfig(defaultConfig, config);