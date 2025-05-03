import React, { useEffect, useState } from "react";
import { View, Text, Button, ScrollView } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { Card, Title, Paragraph } from "react-native-paper";
import MyStyles from "../../styles/MyStyles";

const ResidentHome = () => {
    const [user, setUser] = useState(null);
    const [apartments, setApartments] = useState([]); // State lưu căn hộ
    const nav = useNavigation();

    useEffect(() => {
        const checkToken = async () => {
            const token = await AsyncStorage.getItem("token");
            console.log("Token: ", token); // Kiểm tra token

            if (!token) {
                console.log("No token, redirecting to Login");
                nav.navigate("Login");
            } else {
                const userData = await AsyncStorage.getItem("user");
                console.log("User data: ", userData); // Kiểm tra dữ liệu người dùng

                if (userData) {
                    try {
                        const parsedUser = JSON.parse(userData);
                        console.log("Parsed User:", parsedUser); // Kiểm tra người dùng sau khi parse

                        setUser(parsedUser);
                        //---
                        // Hàm lấy API căn hộ
                        const fetchApartments = async (token) => {
                            try {
                                const response = await fetch(
                                    "https://trngnhan.pythonanywhere.com/apartments/",
                                    {
                                        headers: {
                                            Authorization: `Bearer ${token}`,
                                        },
                                    }
                                );

                                if (response.ok) {
                                    const data = await response.json();
                                    setApartments(data.results || data); // Nếu dùng pagination
                                } else {
                                    console.error(
                                        "Lỗi khi lấy thông tin căn hộ:",
                                        response.status
                                    );
                                }
                            } catch (error) {
                                console.error("Lỗi khi gọi API căn hộ:", error);
                            }
                        };

                        // GỌI API ở đây!
                        await fetchApartments(token);
                        //---
                        // Kiểm tra nếu người dùng phải thay đổi mật khẩu
                        if (parsedUser.must_change_password === true) {
                            console.log(
                                "User needs to update profile, redirecting to UpdateProfile"
                            );
                            nav.navigate("UpdateProfile"); // Chuyển hướng đến trang UpdateProfile
                        }
                    } catch (error) {
                        console.error("Error parsing user data:", error);
                        nav.navigate("Login");
                    }
                } else {
                    console.log("No user data, redirecting to Login");
                    nav.navigate("Login");
                }
            }
        };

        checkToken();
    }, [nav]);

    const logout = async () => {
        await AsyncStorage.removeItem("token");
        await AsyncStorage.removeItem("user");
        nav.navigate("Home");
    };

    if (!user) {
        return <Text>Loading...</Text>; // Hoặc có thể thêm Spinner tại đây
    }

    //   return (
    //     <View>
    //       <Text style={[MyStyles.text, MyStyles.padding]} >Welcome, {user.first_name} {user.last_name}</Text>
    //       <Button title="Logout" onPress={logout} />
    //     </View>
    //   );
    // };

    return (
        <ScrollView contentContainerStyle={{ padding: 16 }}>
            <Text style={[MyStyles.text, MyStyles.padding]}>
                Welcome, {user.first_name} {user.last_name}
            </Text>
            {apartments.length === 0 ? (
                <Text>Bạn chưa sở hữu căn hộ nào.</Text>
            ) : (
                apartments.map((apartment, index) => (
                    <Card key={index} style={{ marginBottom: 12 }}>
                        <Card.Content>
                            <Title>Căn hộ: {apartment.code}</Title>
                            <Paragraph>Tòa: {apartment.building}</Paragraph>
                            <Paragraph>Tầng: {apartment.floor}</Paragraph>
                            <Paragraph>Số: {apartment.number}</Paragraph>
                        </Card.Content>
                    </Card>
                ))
            )}
            <Button title="Logout" onPress={logout} />
        </ScrollView>
    );
};

export default ResidentHome;
