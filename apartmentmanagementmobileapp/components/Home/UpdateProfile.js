import React, { useState } from 'react';
import { View, Text, TextInput, Button, Image, TouchableOpacity } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MyStyles from '../../styles/MyStyles';
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from 'expo-linear-gradient';

const UpdateProfile = () => {
  const [photo, setPhoto] = useState(null);
  const [password, setPassword] = useState('');
  const [must_change_password, setMustChangePassword] = useState(true);
  const [msg, setMsg] = useState(null);
  const nav = useNavigation();  // dùng const ở đây

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

        // const response = await fetch('http://192.168.44.101:8000/users/current-user/', {
        const response = await fetch('http://192.168.44.103:8000/users/current-user/', {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${parsedUser.token}`,
          },
          body: formData,
        });
  
        const responseText = await response.json();
        let responseJson = {};
        try {
          responseJson = JSON.parse(responseText);
        } catch (e) {
          console.warn('Could not parse JSON:', responseText);
        }
  
        console.log('Server Response:', responseJson);
  
        if (response.ok) {
          const updatedUser = {
            ...parsedUser,
            must_change_password: false,
          };
  
          await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
          // nav.navigate('ResidentHome');
          if (parsedUser.is_superuser) {
            nav.navigate("AdminHome"); // Điều hướng đến trang admin
          } else {
            nav.navigate("ResidentHome"); // Điều hướng đến ResidentHome
          }
        } else {
          alert(`Failed to update profile: ${responseJson.detail || 'Unknown error'}`);
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
    colors={['#fff', '#d7d2cc', '#FFBAC3']} // Màu gradient
    style={{ flex: 1 }} // Đảm bảo gradient bao phủ toàn màn hình
    >
      <View style={[MyStyles.container, MyStyles.center]}>
      <Text style={MyStyles.title}>Update Your Profile</Text>

      {msg && <Text style={{ color: 'red', marginBottom: 10 }}>{msg}</Text>}

      {photo && <Image source={{ uri: photo.uri }} style={{ width: 100, height: 100, marginVertical: 10, borderRadius: 10 }} />}

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
