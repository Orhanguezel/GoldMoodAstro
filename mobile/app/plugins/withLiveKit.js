const { withAppDelegate, withMainApplication } = require('expo/config-plugins');

function patchAndroid(source, language) {
  if (source.includes('LiveKitReactNative.setup(')) return source;
  if (language !== 'kt') throw new Error('LiveKit plugin expects a Kotlin MainApplication');
  const anchor = '    super.onCreate()';
  if (!source.includes(anchor)) throw new Error('LiveKit plugin could not find Android onCreate');
  return source
    .replace('import android.app.Application',
      'import android.app.Application\nimport com.livekit.reactnative.LiveKitReactNative\nimport com.livekit.reactnative.audio.AudioType')
    .replace(anchor, `${anchor}\n    LiveKitReactNative.setup(this, AudioType.CommunicationAudioType())`);
}

function patchIos(source, language) {
  if (source.includes('LivekitReactNative.setup()') || source.includes('[LivekitReactNative setup]')) return source;
  if (language === 'swift') {
    const signature = /didFinishLaunchingWithOptions[\s\S]*?\)\s*->\s*Bool\s*\{/;
    if (!signature.test(source)) throw new Error('LiveKit plugin could not find iOS launch method');
    const withImports = source.includes('import livekit_react_native')
      ? source
      : source.replace(/^import .+$/m, (line) => `${line}\nimport livekit_react_native\nimport livekit_react_native_webrtc`);
    if (withImports === source && !source.includes('import livekit_react_native')) {
      throw new Error('LiveKit plugin could not find iOS imports');
    }
    return withImports
      .replace(signature, (match) => `${match}\n    LivekitReactNative.setup()`);
  }
  if (language === 'objc' || language === 'objcpp') {
    const signature = /didFinishLaunchingWithOptions[\s\S]*?\{/;
    if (!signature.test(source)) throw new Error('LiveKit plugin could not find iOS launch method');
    return source
      .replace(/^#import "AppDelegate.h"$/m,
        '#import "AppDelegate.h"\n#import "LivekitReactNative.h"\n#import "WebRTCModuleOptions.h"')
      .replace(signature, (match) => `${match}\n  [LivekitReactNative setup];`);
  }
  throw new Error(`LiveKit plugin does not support iOS language ${language}`);
}

function withLiveKit(config) {
  config = withMainApplication(config, (mod) => {
    mod.modResults.contents = patchAndroid(mod.modResults.contents, mod.modResults.language);
    return mod;
  });
  return withAppDelegate(config, (mod) => {
    mod.modResults.contents = patchIos(mod.modResults.contents, mod.modResults.language);
    return mod;
  });
}

module.exports = withLiveKit;
module.exports.patchAndroid = patchAndroid;
module.exports.patchIos = patchIos;
