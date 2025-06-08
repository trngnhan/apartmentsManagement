import React, { useState } from 'react';
import { View, Text, TextInput, Button, Image, TouchableOpacity } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MyStyles from '../../styles/MyStyles';
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from 'expo-linear-gradient';
import { endpoints, authApis } from "../../configs/Apis";

const UpdateProfile = () => {
  const [photo, setPhoto] = useState(null);
  const [password, setPassword] = useState('');
  const [must_change_password, setMustChangePassword] = useState(true);
  const [msg, setMsg] = useState(null);
  const nav = useNavigation();

  const handleUploadPhoto = async () => {
    let { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
      alert('Permission to access media library is required!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      console.log('Photo selected: ', result.assets[0].uri);
      setPhoto(result.assets[0]);
    }
  };

  const handleUpdateProfile = async () => {
  if (password) {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (!userData) {
        alert('User data not found. Please log in again.');
        nav.navigate('Login');
        return;
      }

      const parsedUser = JSON.parse(userData);

      const formData = new FormData();
      formData.append('password', password);
      formData.append('must_change_password', 'False');

      // Thêm ảnh nếu có
      if (photo) {
        formData.append('profile_picture', {
          uri: photo.uri,
          name: photo.fileName || 'avatar.jpg',
          type: photo.type || 'image/jpeg',
        });
      }

      const api = authApis(parsedUser.token);
      const res = await api.patch(endpoints["current-user"], formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      console.log('Server Response:', res.data);

      if (res.status === 200) {
        const updatedUser = {
          ...parsedUser,
          must_change_password: false,
          profile_picture: res.data.profile_picture,
        };

        await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
        if (parsedUser.is_superuser) {
          nav.navigate("AdminHome");
        } else {
          nav.navigate("ResidentHome");
        }
      } else {
        alert(`Failed to update profile: ${res.data.detail || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error updating profile: ', error);
      alert('An error occurred while updating your profile. Please try again.');
    }
  } else {
    setMsg('Please enter a new password.');
  }
};
  
  
//   <TouchableOpacity onPress={handleUploadPhoto} style={MyStyles.button}>
//   <Text style={{ color: 'white', textAlign: 'center' }}>Upload Photo</Text>
// </TouchableOpacity>
  

  return (
    <LinearGradient
    colors={['#fff', '#d7d2cc', '#FFBAC3']}
    style={{ flex: 1 }}
    >
      <View style={[MyStyles.container, MyStyles.center]}>
        <Text style={MyStyles.title}>Update Your Profile</Text>

        {msg && <Text style={{ color: 'red', marginBottom: 10 }}>{msg}</Text>}

        {photo && <Image source={{ uri: photo.uri }} style={{ width: 100, height: 100, marginVertical: 10, borderRadius: 10 }} />}

        {/* <TouchableOpacity onPress={handleUploadPhoto} style={MyStyles.button}>
          <Text style={{ color: 'white', textAlign: 'center' }}>Upload Photo</Text>
        </TouchableOpacity> */}

        <TextInput
          style={MyStyles.input}
          placeholder="Enter new password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <Button title="Update Profile" onPress={handleUpdateProfile} />
    </View>
    </LinearGradient>
  );
};

export default UpdateProfile;