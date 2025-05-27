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
import AdminApartmentTransferHistorys from './components/Admin/AdminApartmentTransferHistorys';
import AdminResident from './components/Admin/AdminResident';
import SurveyListScreen from './components/Home/SurveyListScreen';
import AdminFeedback from './components/Admin/AdminFeedback';
import AdminLocker from './components/Admin/AdminLocker';
import AdminLockerItems from './components/Admin/AdminLockerItems';
import AdminPayment from './components/Admin/AdminPayment';
import AdminChatScreen from './components/Admin/AdminChatScreen';
import ChatListScreen from './components/Home/ChatListScreen';
import AdminChat from './components/Admin/AdminChat';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <MyProvider>
        <NavigationContainer>
          <Stack.Navigator initialRouteName="Login">
            {/* Login */}
            <Stack.Screen name="Login" component={Login} options={{ title: "Đăng nhập" }} />
            {/* User */}
            <Stack.Screen name="Home" component={Home} options={{ title: "Trang chủ" }} />
            <Stack.Screen name="ResidentHome" component={ResidentHome} options={{ title: "Trang chủ cư dân" }} />
            <Stack.Screen name="UpdateProfile" component={UpdateProfile} options={{ title: "Cập nhật hồ sơ" }} />
            <Stack.Screen name="RegisterVehicle" component={RegisterVehicle} options={{ title: "Đăng ký xe" }} />
            <Stack.Screen name="LockerItems" component={LockerItems} options={{ title: "Tủ đồ cư dân" }} />
            <Stack.Screen name="SubmitFeedback" component={SubmitFeedback} options={{ title: "Gửi phản ánh" }} />
            <Stack.Screen name="SurveyList" component={SurveyListScreen} options={{ title: "Khảo sát cư dân" }} />
            <Stack.Screen name="ChatListScreen" component={ChatListScreen} options={{ title: "Trò chuyện trực tuyến"}}/>
            {/* Admin */}
            <Stack.Screen name="AdminHome" component={AdminHome} options={{ title: "Trang chủ quản trị" }} />
            <Stack.Screen name="AdminUser" component={AdminUser} options={{ title: "Quản lý tài khoản" }} />
            <Stack.Screen name="AdminApartment" component={AdminApartment} options={{ title: "Quản lý căn hộ" }} />
            <Stack.Screen name="AdminResident" component={AdminResident} options={{ title: "Quản lý cư dân" }} />
            <Stack.Screen name="AdminApartmentTransferHistorys" component={AdminApartmentTransferHistorys} options={{ title: "Lịch sử chuyển nhượng" }} />
            <Stack.Screen name="AdminSurvey" component={AdminSurvey} options={{ title: "Quản lý khảo sát" }} />
            <Stack.Screen name="AdminSurveyResponses" component={AdminSurveyResponses} options={{ title: "Phản hồi khảo sát" }} />
            <Stack.Screen name="AdminFeedback" component={AdminFeedback} options={{ title: "Quản lý phản ánh" }} />
            <Stack.Screen name="AdminLocker" component={AdminLocker} options={{ title: "Quản lý tủ đồ" }} />
            <Stack.Screen name="AdminLockerItems" component={AdminLockerItems} options={{title: "Tủ đồ cư dân"}} />
            <Stack.Screen name="AdminPayment" component={AdminPayment} options={{title: "Quản lý thanh toán"}} />
            <Stack.Screen name="AdminChatScreen" component={AdminChatScreen} options={{title: "Quản lý tin nhắn trực tuyến"}} />
            <Stack.Screen name="AdminChat" component={AdminChat} options={{ title: "Trò chuyện với cư dân" }} />
            {/* Chat */}
          </Stack.Navigator>
        </NavigationContainer>
      </MyProvider>
    </GestureHandlerRootView>
  );
}

//"KVEQ1CQ389WFDQZXR8JVARWL"
// "BV96e0rWzsGyZU0MFMjT1u19m5j0MXrJVCQaEQAZ"
// "9ciZz1wa06Tju9rOfY49828GDvFRHc30RfS9wOJfrTfa2sukERvhpI4T7JHgeZaO1jxTfXsDjfeSDm9vLiQdcHtPl7ZefwvlpBthKY3doWfL8jF09BcKhOQjUE7h3CK0"