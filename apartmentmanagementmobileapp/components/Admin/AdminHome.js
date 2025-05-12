import React from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";
import MyStyles from "../../styles/MyStyles";
import { LinearGradient } from "expo-linear-gradient";
import { Button } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const AdminHome = () => {
    const nav = useNavigation(); // Điều hướng

    // Hàm điều hướng
    const navigateToAdminUser = () => {
            nav.navigate("AdminUser"); // Điều hướng đến trang AdminUser
    };

    const navigateToAdminApartment = () => {
        nav.navigate("AdminApartment"); // Điều hướng đến trang AdminApartment
    };

    const navigateToAdminApartmentTransferHistorys = () => {
        nav.navigate("AdminApartmentTransferHistorys"); // Điều hướng đến trang AdminApartmentTransferHistorys
    };

    const navigateToAdminSurvey = () => {
        nav.navigate("AdminSurvey"); // Điều hướng đến trang AdminSurvey
    };

    // Hàm đăng xuất
    // Xóa token và thông tin người dùng khỏi AsyncStorage
    const logout = async () => {
        try {
            await AsyncStorage.removeItem("token");
            await AsyncStorage.removeItem("user");
    
            nav.reset({
                index: 0,
                routes: [{ name: "Login" }],
            });
        } catch (error) {
            console.error("Lỗi khi logout:", error);
        }
    };

    return (
        <LinearGradient
            colors={['#fff', '#d7d2cc', '#FFBAC3']} // Màu gradient
            style={{flex: 1, padding: 10}} // Đảm bảo gradient bao phủ toàn màn hình
        >
            <View style={{ flexDirection: "row", justifyContent: "space-around"}}>
                <TouchableOpacity onPress={navigateToAdminUser} style={MyStyles.imageContainer}>
                    <View style={{ alignItems: "center" }}>
                        <Image
                            source={require("../../assets/user.png")} // Đường dẫn đến hình ảnh
                            style={MyStyles.image}
                        />
                        <Text style={[MyStyles.padding, MyStyles.textSmall]}>Quản lý Tài khoản</Text>
                    </View>
                </TouchableOpacity>

                <TouchableOpacity onPress={navigateToAdminSurvey} style={MyStyles.imageContainer}>
                    <View style={{ alignItems: "center" }}>
                        <Image
                            source={require("../../assets/resident.png")} // Đường dẫn đến hình ảnh
                            style={MyStyles.image}
                        />
                        <Text style={[MyStyles.padding, MyStyles.textSmall]}>Quản lý Cư dân</Text>
                    </View>
                </TouchableOpacity>
            </View>

            <View style={{ flexDirection: "row", justifyContent: "space-around"}}>
                <TouchableOpacity onPress={navigateToAdminApartment} style={MyStyles.imageContainer}>
                    <View style={{ alignItems: "center" }}>
                        <Image
                            source={require("../../assets/apartment.png")} // Đường dẫn đến hình ảnh
                            style={MyStyles.image}
                        />
                        <Text style={[MyStyles.padding, MyStyles.textSmall]}>Quản lý Căn hộ</Text>
                    </View>
                </TouchableOpacity>

                <TouchableOpacity onPress={navigateToAdminApartmentTransferHistorys} style={MyStyles.imageContainer}>
                    <View style={{ alignItems: "center" }}>
                        <Image
                            source={require("../../assets/apartment-transfer-historys.png")} // Đường dẫn đến hình ảnh
                            style={MyStyles.image}
                        />
                        <Text style={[MyStyles.padding, MyStyles.textSmall]}>Lịch sử chuyển nhượng</Text>
                    </View>
                </TouchableOpacity>     
            </View>

            <View style={{ flexDirection: "row", justifyContent: "space-around"}}>
                <TouchableOpacity onPress={navigateToAdminSurvey} style={MyStyles.imageContainer}>
                    <View style={{ alignItems: "center" }}>
                        <Image
                            source={require("../../assets/survey.png")} // Đường dẫn đến hình ảnh
                            style={MyStyles.image}
                        />
                        <Text style={[MyStyles.padding, MyStyles.textSmall]}>Quản lý Khảo sát</Text>
                    </View>
                </TouchableOpacity>

                <TouchableOpacity onPress={navigateToAdminSurvey} style={MyStyles.imageContainer}>
                    <View style={{ alignItems: "center" }}>
                        <Image
                            source={require("../../assets/survey.png")} // Đường dẫn đến hình ảnh
                            style={MyStyles.image}
                        />
                        <Text style={[MyStyles.padding, MyStyles.textSmall]}>Quản lý Phản ánh</Text>
                    </View>
                </TouchableOpacity>
            </View>

            <Button
                title="Logout"
                onPress={logout}
                color="#FF6F61"
            />
        </LinearGradient>
    );
};

export default AdminHome;