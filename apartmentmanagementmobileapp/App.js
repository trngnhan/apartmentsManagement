import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Login from './components/User/Login';
import Home from './components/Home/Home';
import { MyProvider } from './configs/MyContexts';
import ResidentHome from './components/Home/ResidentHome';
import UpdateProfile from './components/Home/UpdateProfile';
import RegisterVehicle from './components/Home/RegisterVehicle';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <MyProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Login">
          <Stack.Screen name="Login" component={Login} />
          <Stack.Screen name="Home" component={Home} />
          <Stack.Screen name='ResidentHome' component={ResidentHome}/>
          <Stack.Screen name='UpdateProfile' component={UpdateProfile}/>
          <Stack.Screen name="RegisterVehicle" component={RegisterVehicle} />
        </Stack.Navigator>
      </NavigationContainer>
    </MyProvider>
  );
}


// "BV96e0rWzsGyZU0MFMjT1u19m5j0MXrJVCQaEQAZ"
// "9ciZz1wa06Tju9rOfY49828GDvFRHc30RfS9wOJfrTfa2sukERvhpI4T7JHgeZaO1jxTfXsDjfeSDm9vLiQdcHtPl7ZefwvlpBthKY3doWfL8jF09BcKhOQjUE7h3CK0"