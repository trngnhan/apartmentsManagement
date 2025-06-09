import React, { useEffect, useState } from "react";
import { View, Text, Button, ScrollView, TouchableOpacity, Image } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { Card, Title, Paragraph } from "react-native-paper";
import MyStyles from "../../styles/MyStyles";
import { LinearGradient } from "expo-linear-gradient";
import { endpoints, authApis } from "../../configs/Apis";
import { useFocusEffect } from "@react-navigation/native";

const ResidentHome = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [apartments, setApartments] = useState([]); 
    const [registrations, setRegistrations] = useState([]);
    const [lockerItems, setLockerItems] = useState([]); 
    const [token, setToken] = useState(null);
    const [currentUserId, setCurrentUserId] = useState(null);
    const [lockerId, setLockerId] = useState(null);
    const [adminId, setAdminId] = useState(null);
    const nav = useNavigation();

    const getAdminIdForResident = async (residentId) => {
        const token = await AsyncStorage.getItem("token");
        try {
            const api = authApis(token);
            const res = await api.get(endpoints.admin);
            if (res.status === 200) {
                const data = res.data;
                console.log("Data admin API:", data);
                return data.admin_id;
            } else {
                console.error("Lỗi response admin:", res.status);
                return null;
            }
        } catch (error) {
            console.error("Lỗi fetch admin:", error);
            return null;
        }
    };


    const onGoToChat = async () => {
        if (!currentUserId) {
            alert("Chưa đăng nhập hoặc chưa lấy được residentId");
            return;
        }
        const adminId = await getAdminIdForResident(currentUserId);
        console.log("Admin ID:", adminId);
        if (!adminId) {
            alert("Chưa xác định được Admin");
            return;
        }
        nav.navigate("ChatListScreen", { currentUserId, adminId });
    };

    const goLockerItems = async () => {
        if (!currentUserId) {
            alert("Chưa đăng nhập hoặc chưa lấy được residentId");
            return;
        }
        const adminId = await getAdminIdForResident(currentUserId);
        console.log("Admin ID:", adminId);
        console.log("Current User ID:", currentUserId);
        console.log("Locker Items:", lockerId);
        if (!adminId) {
            alert("Chưa xác định được Admin");
            return;
        }
        nav.navigate("LockerItems", { currentUserId, adminId });
    };

    useFocusEffect(
    React.useCallback(() => {
        const checkToken = async () => {
            const token = await AsyncStorage.getItem("token");
            setToken(token);

            if (!token) {
                nav.navigate("Login");
            } else {
                const userData = await AsyncStorage.getItem("user");
                if (userData) {
                    try {
                        const parsedUser = JSON.parse(userData);
                        setCurrentUserId(parsedUser.resident_id);
                        setUser(parsedUser);
                        setLockerId(parsedUser.locker_id);

                        const fetchApartments = async (token) => {
                            try {
                                const api = authApis(token);
                                const res = await api.get(endpoints.getApartment);
                                if (res.status === 200) {
                                    setApartments(res.data.results || res.data);
                                }
                            } catch (error) {
                                console.error("Lỗi khi gọi API căn hộ:", error);
                            }
                        };

                        const fetchRegistrations = async (token) => {
                            try {
                                const api = authApis(token);
                                const res = await api.get(endpoints.myVehicleRegistrations);
                                if (res.status === 200) {
                                    setRegistrations(res.data);
                                }
                            } catch (error) {
                                console.error("Lỗi khi gọi API đăng ký giữ xe:", error);
                            }
                        };

                        await fetchApartments(token);
                        await fetchRegistrations(token);
                    } catch (error) {
                        nav.navigate("Login");
                    }
                } else {
                    nav.navigate("Login");
                }
            }
        };

        checkToken();
    }, [nav])
);

    const logout = async () => {
        await AsyncStorage.removeItem("token");
        await AsyncStorage.removeItem("user");

        nav.reset({
            index: 0,
            routes: [{ name: "Login" }],
        });
    };

    if (!user) {
        return <Text>Loading...</Text>;
    }

    return (
    <LinearGradient
    colors={['#fff', '#d7d2cc', '#FFBAC3']} 
    style={{ flex: 1 }}
    >
        <ScrollView contentContainerStyle={{ padding: 16 }}>
            <Text style={[MyStyles.text, MyStyles.padding]}>
                Welcome, {user.first_name} {user.last_name}
            </Text>
            <Text style={MyStyles.padding}>Căn hộ của bạn:</Text>
            {apartments.length === 0 ? (
                <Text>Bạn chưa sở hữu căn hộ nào.</Text>
            ) : (
                apartments.map((apartment, index) => (
                    <Card key={index} style={{ marginBottom: 12 }}>
                        <Card.Content>
                            <Title style={MyStyles.text}>Căn hộ: {apartment.code}</Title>
                            <Paragraph>Tòa: {apartment.building}</Paragraph>
                            <Paragraph>Tầng: {apartment.floor}</Paragraph>
                            <Paragraph>Căn số: {apartment.number}</Paragraph>
                        </Card.Content>
                    </Card>
                ))
            )}

            {/* Các chức năng chuyển trang để ở đây */}
            <View style={{ flexDirection: "row", justifyContent: "space-around", marginVertical: 10 }}>
                {/* Hình ảnh để chuyển đến trang RegisterVehicle */}
                <TouchableOpacity onPress={() => nav.navigate("RegisterVehicle")}>
                    <View style={{ alignItems: "flex-start" }}>
                        <Image
                            source={require("../../assets/register_vehicle.png")}
                            style={MyStyles.image}
                        />
                        <Text style={[MyStyles.padding, MyStyles.textSmall]}>Đăng ký xe cho người thân</Text>
                    </View>
                </TouchableOpacity>

                {/* Hình ảnh để chuyển đến trang LockerItems*/}
                <TouchableOpacity onPress={() => goLockerItems()}>
                    <View style={{ alignItems: "center" }}>
                        <Image
                            source={require("../../assets/locker_items.png")}
                            style={MyStyles.image}
                        />
                        <Text style={[MyStyles.padding, MyStyles.textSmall]}>Tủ đồ</Text>
                    </View>
                </TouchableOpacity>
            
                {/* Hình ảnh để chuyển đến trang SubmitFeedback*/}
                <TouchableOpacity onPress={() => nav.navigate("SubmitFeedback")}>
                    <View style={{ alignItems: "flex-end" }}>
                        <Image
                            source={require("../../assets/feedback.png")}
                            style={MyStyles.image}
                        />
                        <Text style={[MyStyles.padding, MyStyles.textSmall]}>Gửi phản hồi</Text>
                    </View>
                </TouchableOpacity>

            </View>

            <View style={{ flexDirection: "row", justifyContent: "space-around", marginVertical: 10 }}>
                {/* Hình ảnh để chuyển đến trang SurveyList */}
                <TouchableOpacity onPress={() => nav.navigate("SurveyList")}>
                    <View style={{ alignItems: "center" }}>
                        <Image
                            source={require("../../assets/survey-feedback-checklist.png")}
                            style={MyStyles.image}
                        />
                        <Text style={[MyStyles.padding, MyStyles.textSmall]}>Phản hồi khảo sát</Text>
                    </View>
                </TouchableOpacity>

                {/* Hình ảnh để chuyển đến trang ChatScreen */}
                <TouchableOpacity onPress={onGoToChat}>
                    <View style={{ alignItems: "center" }}>
                        <Image
                            source={require("../../assets/chat-user.png")}
                            style={MyStyles.image}
                        />
                        <Text style={[MyStyles.padding, MyStyles.textSmall]}>Chat trực tuyến</Text>
                    </View>
                </TouchableOpacity>

                {/* Hình ảnh để chuyển đến trang PaymentScreen */}
                <TouchableOpacity onPress={() => nav.navigate("PaymentScreen")}>
                    <View style={{ alignItems: "center" }}>
                        <Image
                            source={require("../../assets/payment.png")}
                            style={MyStyles.image}
                        />
                        <Text style={[MyStyles.padding, MyStyles.textSmall]}>Thanh toán phí chung cư</Text>
                    </View>
                </TouchableOpacity>
            </View>

            {/* Hiển thị danh sách đăng ký giữ xe */}
            <Text style={MyStyles.sectionTitle}>Danh sách đăng ký giữ xe:</Text>
                {registrations.length === 0 ? (
                    <Text style={MyStyles.padding}>Bạn chưa có đăng ký giữ xe nào.</Text>
                ) : (
                    registrations.map((registration, index) => (
                        <Card key={index} style={MyStyles.cardd}>
                            <Card.Content>
                                <Title>Khách: {registration.visitor_name}</Title>
                                <Paragraph>Biển số xe: {registration.vehicle_number}</Paragraph>
                                <Paragraph>Ngày đăng ký: {registration.registration_date}</Paragraph>
                                <Paragraph>
                                    Trạng thái:
                                    <Text style={{color: registration.approved ? "green" : "orange"}}> {registration.approved ? "Đã duyệt" : "Chưa duyệt"}</Text>
                                </Paragraph>
                            </Card.Content>
                        </Card>
                    ))
                )}
                
            <Button
            style={{
                backgroundColor: "#FF6F61",
                borderRadius: 15, 
                paddingVertical: 2,
                width: 350,
                alignSelf: "center",
                elevation: 5, 
                marginTop: 20,
            }}
            labelStyle={{
                color: "white", 
                fontSize: 16,
                fontWeight: "bold",
            }}
            title="Logout" onPress={logout} />
        </ScrollView>
    </LinearGradient>
    );
};

export default ResidentHome;
