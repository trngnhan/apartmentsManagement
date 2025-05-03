import React, { useEffect, useState } from 'react';
import { View, Text, Button } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MyStyles from '../../styles/MyStyles';
import { useNavigation } from "@react-navigation/native";

const ResidentHome = () => {
  const [user, setUser] = useState(null);
  const nav = useNavigation()

  useEffect(() => {
    const checkToken = async () => {
      const token = await AsyncStorage.getItem('token');
      console.log('Token: ', token); // Kiểm tra token
  
      if (!token) {
        console.log('No token, redirecting to Login');
        nav.navigate('Login');
      } else {
        const userData = await AsyncStorage.getItem('user');
        console.log('User data: ', userData); // Kiểm tra dữ liệu người dùng
  
        if (userData) {
          try {
            const parsedUser = JSON.parse(userData);
            console.log('Parsed User:', parsedUser); // Kiểm tra người dùng sau khi parse
  
            setUser(parsedUser);
  
            // Kiểm tra nếu người dùng phải thay đổi mật khẩu
            if (parsedUser.must_change_password === true) {
              console.log('User needs to update profile, redirecting to UpdateProfile');
              nav.navigate('UpdateProfile'); // Chuyển hướng đến trang UpdateProfile
            }
          } catch (error) {
            console.error('Error parsing user data:', error);
            nav.navigate('Login');
          }
        } else {
          console.log('No user data, redirecting to Login');
          nav.navigate('Login');
        }
      }
    };
  
    checkToken();
  }, [nav]);
  

  const logout = async () => {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');
    nav.navigate('Home');
  };

  if (!user) {
    return <Text>Loading...</Text>; // Hoặc có thể thêm Spinner tại đây
  }

  return (
    <View>
      <Text style={[MyStyles.text, MyStyles.padding]} >Welcome, {user.first_name} {user.last_name}</Text>
      <Button title="Logout" onPress={logout} />
    </View>
  );
};

export default ResidentHome;