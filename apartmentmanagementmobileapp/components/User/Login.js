import { Image, KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, Text, TouchableOpacity, View } from "react-native";
import MyStyles from "../../styles/MyStyles";
import { Button, HelperText, TextInput } from "react-native-paper";
import { useContext, useState } from "react";
import Apis, { authApis, endpoints } from "../../configs/Apis";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MyDispatchContext } from "../../configs/MyContexts";

const Login = () => {
    const info = [{
        label: 'Tên đăng nhập',
        icon: "text",
        secureTextEntry: false,
        field: "username"
    }, {
        label: 'Mật khẩu',
        icon: "eye",
        secureTextEntry: true,
        field: "password"
    }];
    
    const [user, setUser] = useState({});
    const [msg, setMsg] = useState(null);
    const [loading, setLoading] = useState(false);
    const nav = useNavigation();
    const dispatch = useContext(MyDispatchContext);

    const setState = (value, field) => {
        setUser({...user, [field]: value});
    };

    const validate = () => {
        if (!user?.username || !user?.password) {
            setMsg("Vui lòng nhập tên đăng nhập và mật khẩu!");
            return false;
        }

        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(user.username)) {
            setMsg("Tên đăng nhập phải là email hợp lệ.");
            return false;
        }

        // if (user.password.length < 4) {
        //     setMsg("Mật khẩu phải trên  ký tự.");
        //     return false;
        // }

        setMsg(null);
        return true;
    };

    const login = async () => {
        if (validate()) {
            try {
                setLoading(true);
                // Gửi yêu cầu đăng nhập
                let res = await Apis.post(endpoints['login'], {
                    ...user,
                    "client_id": "BV96e0rWzsGyZU0MFMjT1u19m5j0MXrJVCQaEQAZ",
                    "client_secret": "9ciZz1wa06Tju9rOfY49828GDvFRHc30RfS9wOJfrTfa2sukERvhpI4T7JHgeZaO1jxTfXsDjfeSDm9vLiQdcHtPl7ZefwvlpBthKY3doWfL8jF09BcKhOQjUE7h3CK0",
                    'grant_type': 'password'
                });

                console.info(res.data.access_token);

                // Lưu token vào AsyncStorage
                await AsyncStorage.setItem("token", res.data.access_token);

                // Lấy thông tin người dùng
                let u = await authApis(res.data.access_token).get(endpoints['current-user']);
                console.info(u.data);

                // Lưu dữ liệu người dùng và token vào AsyncStorage
                await AsyncStorage.setItem("user", JSON.stringify({
                    token: res.data.access_token,
                    ...u.data
                }));

                console.log('User data saved: ', JSON.stringify({
                    token: res.data.access_token,
                    ...u.data
                }));

                // Cập nhật thông tin người dùng vào context
                dispatch({
                    "type": "login",
                    "payload": u.data
                });

                // Điều hướng đến trang chủ (hoặc trang khác sau khi login thành công)
                nav.navigate('UpdateProfile');
                
            } catch (ex) {
                console.error("Lỗi đăng nhập:", ex);
                setMsg("Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.");
            } finally {
                setLoading(false);
            }
        }
    };

    const logout = async () => {
        // Xóa token và dispatch logout action
        await AsyncStorage.removeItem("token");
        dispatch({
            type: "logout" 
        });
        nav.navigate('Login'); // Điều hướng về màn hình đăng nhập
    };

    return (
        <View> 
            <ScrollView>
                <HelperText type="error" visible={msg}>
                    {msg}
                </HelperText>

                {info.map(i => <TextInput value={user[i.field]} 
                    onChangeText={t => setState(t, i.field)} style={MyStyles.m} key={i.field} label={i.label} 
                                        secureTextEntry={i.secureTextEntry} right={<TextInput.Icon icon={i.icon} />} />)}

                <Button disabled={loading} loading={loading} onPress={login} mode="contained">Đăng nhập</Button>
            </ScrollView>
        </View>
    );
};

export default Login;
