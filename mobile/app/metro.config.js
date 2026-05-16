const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const projectRoot = __dirname;

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(projectRoot);

/** Tek port: Expo Go’daki eski `8082` kayıtlarıyla çakışmayı azaltır. */
config.server = { ...(config.server ?? {}), port: 8081 };

const liveKitMockPath = path.join(projectRoot, 'src/mocks/livekit-react-native-mock.tsx');

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === '@livekit/react-native') {
    return { type: 'sourceFile', filePath: liveKitMockPath };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
