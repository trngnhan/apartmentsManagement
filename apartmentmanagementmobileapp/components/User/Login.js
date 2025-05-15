import {
    Alert,
    Image,
    ScrollView,
    View,
    Animated,
    StyleSheet,
} from "react-native";
import MyStyles from "../../styles/MyStyles";
import { Button, HelperText, TextInput } from "react-native-paper";
import { useContext, useState, useRef, useEffect } from "react";
import Apis, { authApis, endpoints } from "../../configs/Apis";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MyDispatchContext } from "../../configs/MyContexts";
import { LinearGradient } from "expo-linear-gradient";

const Login = () => {
    const info = [
        {
            label: "Tên đăng nhập",
            icon: "text",
            secureTextEntry: false,
            field: "username",
        },
        {
            label: "Mật khẩu",
            icon: "eye",
            secureTextEntry: true,
            field: "password",
        },
    ];

    const [user, setUser] = useState({});
    const [msg, setMsg] = useState(null);
    const [loading, setLoading] = useState(false);
    const nav = useNavigation();
    const dispatch = useContext(MyDispatchContext);
    const translateX = useRef(new Animated.Value(-200)).current; // bắt đầu lệch trái
    const opacity = useRef(new Animated.Value(0)).current;        // bắt đầu mờ

    const setState = (value, field) => {
        setUser({ ...user, [field]: value });
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

    useEffect(() => {
        Animated.parallel([
        Animated.timing(translateX, {
            toValue: 0,
            duration: 3500,
            useNativeDriver: true,
        }),
        Animated.timing(opacity, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
        }),
        ]).start();
    }, []);

    const login = async () => {
        if (validate()) {
            try {
                setLoading(true);
                // Gửi yêu cầu đăng nhập
                let res = await Apis.post(endpoints["login"], {
                    ...user,
                    // client_id: "BV96e0rWzsGyZU0MFMjT1u19m5j0MXrJVCQaEQAZ",
                    client_id: "aRgWqcaZzcRboHVnz6xZp5VR30eeiV4gBTC3cud6",
                    //client_id: "1nYlsTyukqBsyGyb7dhLVQcly1KeT4dmTObAf4lk",
                    client_secret: "jwA8QVO1jqScm0taMdfbTDLBfqovrqvQKXQo0L8fbd9CzEJWdbRfww4yFMpSSZjt3e9jG9V3S8fHcKFnrTo8lUwbFyAliMAsKAdgmXzccGZiwGFCzyt0DyFNz6jHHYRB",
                    grant_type: "password",
                });

                console.info(res.data.access_token);

                // Lưu token vào AsyncStorage
                await AsyncStorage.setItem("token", res.data.access_token);

                // Lấy thông tin người dùng
                let u = await authApis(res.data.access_token).get(
                    endpoints["current-user"]
                );
                console.info("Dữ liệu người dùng từ API: ", u.data);

                // Kiểm tra nếu tài khoản bị khóa
                if (u.data.active === false) {
                    Alert.alert(
                        "Tài khoản bị khóa",
                        "Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên để được hỗ trợ."
                    );
                    setLoading(false);
                    return; // Dừng quá trình đăng nhập
                }

                // Lưu dữ liệu người dùng và token vào AsyncStorage
                await AsyncStorage.setItem(
                    "user",
                    JSON.stringify({
                        token: res.data.access_token,
                        resident_id: u.data.resident_id, // Đảm bảo lưu resident_id
                        ...u.data,
                    })
                );

                console.log(
                    "User data saved: ",
                    JSON.stringify({
                        token: res.data.access_token,
                        ...u.data,
                    })
                );

                // Cập nhật thông tin người dùng vào context
                dispatch({
                    type: "login",
                    payload: u.data,
                });

                // Điều hướng dựa trên quyền của người dùng
                if (u.data.must_change_password) {
                    nav.navigate("UpdateProfile"); // Điều hướng đến UpdateProfile nếu cần đổi mật khẩu
                } else if (u.data.is_superuser) {
                    nav.navigate("AdminHome"); // Điều hướng đến trang admin
                } else {
                    nav.navigate("ResidentHome"); // Điều hướng đến ResidentHome
                }
            } catch (ex) {
                console.error("Lỗi đăng nhập:", ex);
                setMsg("Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.");
            } finally {
                setLoading(false);
            }
        }
    };

    return (
        <LinearGradient
            colors={['#fff', '#d7d2cc', '#FFBAC3']} // Màu gradient
            style={{ flex: 1 }} // Đảm bảo gradient bao phủ toàn màn hình
        >
            <View>
            <ScrollView>
                <Image
                    source={require("../../assets/logo.png")} // Đường dẫn đến hình ảnh logo
                    style={{
                        marginTop: 50,
                        width: 300,
                        height: 150,
                        borderRadius: 20,
                        alignSelf: "center",
                    }}
                />

                <View style={styles.container}>
                    <Animated.Text
                        style={[
                        styles.text,
                            {
                                transform: [{ translateX }],
                                opacity,
                            },
                        ]}
                    >
                        Chào mừng đến với 
                    </Animated.Text>
                    <Animated.Text
                        style={[
                        styles.text,
                            {
                                transform: [{ translateX }],
                                opacity,
                            },
                        ]}
                    >
                        Dream Home Palace
                    </Animated.Text>
                    </View>

                <HelperText type="error" visible={msg}>
                    {msg}
                </HelperText>

                {info.map((i) => (
                    <TextInput
                        value={user[i.field]}
                        onChangeText={(t) => setState(t, i.field)}
                        style={MyStyles.m}
                        key={i.field}
                        label={i.label}
                        secureTextEntry={i.secureTextEntry}
                        right={<TextInput.Icon icon={i.icon} />}
                    />
                ))}

                <Button
                    disabled={loading}
                    loading={loading}
                    onPress={login}
                    mode="contained"
                    style={{
                        backgroundColor: "#FF6F61", // Màu nền nút
                        borderRadius: 15, // Bo góc
                        paddingVertical: 2, // Khoảng cách trên dưới
                        width: 350,
                        alignSelf: "center", // Căn giữa
                        elevation: 5, // Đổ bóng
                        marginTop: 20, // Khoảng cách phía trên
                    }}
                    labelStyle={{
                        color: "white", // Màu chữ
                        fontSize: 16, // Kích thước chữ
                        fontWeight: "bold", // Đậm chữ
                    }}
                >
                    Đăng nhập
                </Button>
            </ScrollView>
        </View>
        </LinearGradient>   
    );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 30,
    alignItems: 'center',
  },
  text: {
    fontSize: 26,
    fontWeight: '700',
    color: '#4A90E2', // màu xanh nhã
    letterSpacing: 1.5, // giãn cách chữ
    textTransform: 'capitalize', // viết hoa chữ đầu
    textShadowColor: '#00000055', // bóng mờ nhẹ
    textShadowOffset: { width: 1, height: 2 },
    textShadowRadius: 4,
  },
});

export default Login;
