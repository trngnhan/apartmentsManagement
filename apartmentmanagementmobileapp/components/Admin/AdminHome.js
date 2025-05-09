import React from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";
import MyStyles from "../../styles/MyStyles";
import { LinearGradient } from "expo-linear-gradient";
import { Button } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const AdminHome = () => {
    const nav = useNavigation(); // Điều hướng

    // Hàm điều hướng đến AdminApartment
    const navigateToAdminApartment = () => {
        nav.navigate("AdminApartment"); // Điều hướng đến trang AdminApartment
    };

    const navigateToAdminSurvey = () => {
        nav.navigate("AdminSurvey"); // Điều hướng đến trang AdminSurvey
    };

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
            <View style={{ flexDirection: "row", justifyContent: "space-around", marginVertical: 10 }}>
                <TouchableOpacity onPress={navigateToAdminApartment} style={MyStyles.imageContainer}>
                    <View style={{ alignItems: "center" }}>
                        <Image
                            source={require("../../assets/apartment.png")} // Đường dẫn đến hình ảnh
                            style={MyStyles.image}
                        />
                        <Text style={[MyStyles.padding, MyStyles.textSmall]}>Quản lý căn hộ</Text>
                    </View>
                </TouchableOpacity>

                <TouchableOpacity onPress={navigateToAdminSurvey} style={MyStyles.imageContainer}>
                    <View style={{ alignItems: "center" }}>
                        <Image
                            source={require("../../assets/survey.png")} // Đường dẫn đến hình ảnh
                            style={MyStyles.image}
                        />
                        <Text style={[MyStyles.padding, MyStyles.textSmall]}>Quản lý khảo sát</Text>
                    </View>
                </TouchableOpacity>

                <TouchableOpacity onPress={navigateToAdminSurvey} style={MyStyles.imageContainer}>
                    <View style={{ alignItems: "center" }}>
                        <Image
                            source={require("../../assets/survey.png")} // Đường dẫn đến hình ảnh
                            style={MyStyles.image}
                        />
                        <Text style={[MyStyles.padding, MyStyles.textSmall]}>Chức năng khác</Text>
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