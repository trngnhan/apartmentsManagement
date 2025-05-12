import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Login from './components/User/Login';
import Home from './components/Home/Home';
import { MyProvider } from './configs/MyContexts';
import ResidentHome from './components/Home/ResidentHome';
import UpdateProfile from './components/Home/UpdateProfile';
import RegisterVehicle from './components/Home/RegisterVehicle';
import LockerItems from './components/Home/LockerItems';
import AdminHome from './components/Admin/AdminHome';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AdminApartment from './components/Admin/AdminApartment';
import AdminSurvey from './components/Admin/AdminSurvey';
import AdminSurveyResponses from './components/Admin/AdminSurveyResponses';
import AdminUser from './components/Admin/AdminUser';
import SubmitFeedback from './components/Home/SubmitFeedback';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <MyProvider>
        <NavigationContainer>
          <Stack.Navigator initialRouteName="Login">
            <Stack.Screen name="Login" component={Login} />
            <Stack.Screen name="Home" component={Home} />
            <Stack.Screen name='ResidentHome' component={ResidentHome}/>
            <Stack.Screen name='UpdateProfile' component={UpdateProfile}/>
            <Stack.Screen name="RegisterVehicle" component={RegisterVehicle} />
            <Stack.Screen name="LockerItems" component={LockerItems} />
            <Stack.Screen name="AdminHome" component={AdminHome} />
            <Stack.Screen name="AdminUser" component={AdminUser} />
            <Stack.Screen name="AdminApartment" component={AdminApartment} />
            <Stack.Screen name="AdminSurvey" component={AdminSurvey} />
            <Stack.Screen name="AdminSurveyResponses" component={AdminSurveyResponses} />
            <Stack.Screen name="SubmitFeedback" component={SubmitFeedback} />
          </Stack.Navigator>
        </NavigationContainer>
      </MyProvider>
    </GestureHandlerRootView>
  );
}

//"KVEQ1CQ389WFDQZXR8JVARWL"
// "BV96e0rWzsGyZU0MFMjT1u19m5j0MXrJVCQaEQAZ"
// "9ciZz1wa06Tju9rOfY49828GDvFRHc30RfS9wOJfrTfa2sukERvhpI4T7JHgeZaO1jxTfXsDjfeSDm9vLiQdcHtPl7ZefwvlpBthKY3doWfL8jF09BcKhOQjUE7h3CK0"