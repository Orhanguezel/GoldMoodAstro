import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  ActivityIndicator,
  Alert
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { Camera, User } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useAppTheme, type AppTheme } from '@/theme';
import { storageApi, getAssetUrl } from '@/lib/api';

interface AvatarUploadProps {
  uri?: string | null;
  initials?: string;
  onUploaded: (url: string) => void;
  size?: number;
  bucket?: string;
  folder?: string;
}

export default function AvatarUpload({
  uri,
  initials = 'GM',
  onUploaded,
  size = 100,
  bucket = 'uploads',
  folder = 'avatars'
}: AvatarUploadProps) {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const { colors, radius } = theme;
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const displayUri = preview || getAssetUrl(uri);

  const handlePickImage = async () => {
    // Show action sheet for Camera vs Gallery
    Alert.alert(
      t('avatar.title'),
      t('avatar.choosePhoto'),
      [
        { text: t('avatar.camera'), onPress: () => pickImage('camera') },
        { text: t('avatar.gallery'), onPress: () => pickImage('gallery') },
        { text: t('avatar.cancel'), style: 'cancel' }
      ]
    );
  };

  const pickImage = async (mode: 'camera' | 'gallery') => {
    try {
      const permission = mode === 'camera' 
        ? await ImagePicker.requestCameraPermissionsAsync() 
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(t('avatar.permissionTitle'), t('avatar.permissionBody'));
        return;
      }

      const result = mode === 'camera'
        ? await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
          })
        : await ImagePicker.launchImageLibraryAsync({
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
          });

      if (!result.canceled) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        const imageUri = result.assets[0].uri;
        setPreview(imageUri);
        upload(imageUri);
      }
    } catch (e) {
      console.error('Pick image error:', e);
      Alert.alert(t('common.error'), t('avatar.pickFailed'));
    }
  };

  const upload = async (imageUri: string) => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('files', {
        uri: imageUri,
        name: `avatar_${Date.now()}.jpg`,
        type: 'image/jpeg',
      } as any);

      const res = await storageApi.upload(formData, { bucket, path: folder, upsert: true });
      if (res.url) {
        onUploaded(res.url);
      } else if (res.path) {
        onUploaded(res.path);
      }
    } catch (e) {
      console.error('Upload error:', e);
      Alert.alert(t('common.error'), t('avatar.uploadFailed'));
      setPreview(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Pressable 
        style={[
          styles.avatarCircle, 
          { 
            width: size, 
            height: size, 
            borderRadius: size / 2,
            backgroundColor: colors.surface,
            borderColor: colors.gold + '33'
          }
        ]}
        onPress={handlePickImage}
        disabled={loading}
      >
        {displayUri ? (
          <Image source={{ uri: displayUri }} style={styles.image} />
        ) : (
          <View style={styles.initialsWrap}>
            <Text style={[styles.initialsText, { color: colors.gold, fontSize: size * 0.35 }]}>
              {initials}
            </Text>
          </View>
        )}

        <View style={[styles.overlay, { backgroundColor: colors.inkDeep + '88' }]}>
          {loading ? (
            <ActivityIndicator color={colors.gold} />
          ) : (
            <Camera size={size * 0.25} color={colors.gold} />
          )}
        </View>
      </Pressable>
      
      {/* Help Badge (Mobile specific hint) */}
      <View style={[styles.badge, { backgroundColor: colors.gold, borderColor: colors.surface }]}>
         <User size={12} color={colors.ink} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignSelf: 'center',
    marginBottom: 10,
  },
  avatarCircle: {
    overflow: 'hidden',
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 999,
  },
  initialsWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initialsText: {
    fontFamily: 'Fraunces-Bold',
    fontWeight: '700',
  },
  overlay: {
    position: 'absolute',
    inset: 0,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.8,
  },
  badge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  }
});
