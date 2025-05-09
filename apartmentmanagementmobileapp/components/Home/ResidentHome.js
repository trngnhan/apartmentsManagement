import React, { useEffect, useState } from "react";
import { View, Text, Button, ScrollView, TouchableOpacity, Image } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { Card, Title, Paragraph } from "react-native-paper";
import MyStyles from "../../styles/MyStyles";
import { LinearGradient } from "expo-linear-gradient";

const ResidentHome = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true); // State hiển thị trạng thái loading
    const [apartments, setApartments] = useState([]); // State lưu căn hộ
    const [registrations, setRegistrations] = useState([]); // State lưu đăng ký giữ xe
    const [lockerItems, setLockerItems] = useState([]); // State lưu danh sách món hàng trong tủ đồ
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
                                    "http://10.17.50.31:8000/apartments/get-apartment/",
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

                        // Gọi API lấy danh sách đăng ký giữ xe
                        const fetchRegistrations = async () => {
                          try {
                              const response = await fetch(
                                  "http://10.17.50.31:8000/visitorvehicleregistrations/my-registrations/",
                                  {
                                      headers: {
                                          Authorization: `Bearer ${token}`,
                                      },
                                  }
                              );
                      
                              if (response.ok) {
                                  const data = await response.json();
                                  console.log("Dữ liệu trả về từ API:", data); // Log dữ liệu trả về
                                  setRegistrations(data); // Lưu danh sách đăng ký giữ xe vào state
                              } else {
                                  console.error("Lỗi khi lấy danh sách đăng ký giữ xe:", response.status);
                              }
                          } catch (error) {
                              console.error("Lỗi khi gọi API đăng ký giữ xe:", error);
                          }
                        };

                        // GỌI API ở đây!
                        await fetchApartments(token);
                        await fetchRegistrations();
                        //---
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

        nav.reset({
            index: 0,
            routes: [{ name: "Login" }],
        });
    };

    if (!user) {
        return <Text>Loading...</Text>; // Hoặc có thể thêm Spinner tại đây
    }

    return (
      <LinearGradient
      colors={['#fff', '#d7d2cc', '#FFBAC3']} // Màu gradient
      style={{ flex: 1 }} // Đảm bảo gradient bao phủ toàn màn hình
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
                  <View style={{ alignItems: "center" }}>
                      <Image
                          source={require("../../assets/register_vehicle.png")} // Đường dẫn đến hình ảnh
                          style={MyStyles.image}
                      />
                      <Text style={[MyStyles.padding, MyStyles.textSmall]}>Đăng ký xe cho người thân</Text>
                  </View>
              </TouchableOpacity>

              {/* Hình ảnh để chuyển đến trang LockerItems*/}
              <TouchableOpacity onPress={() => nav.navigate("LockerItems")}>
                    <View style={{ alignItems: "center" }}>
                        <Image
                            source={require("../../assets/locker_items.png")} // Đường dẫn đến hình ảnh
                            style={MyStyles.image}
                        />
                        <Text style={[MyStyles.padding, MyStyles.textSmall]}>Tủ đồ</Text>
                    </View>
                </TouchableOpacity>
              
              </View>

              {/* Hiển thị danh sách đăng ký giữ xe */}
              <Text style={MyStyles.sectionTitle}>Danh sách đăng ký giữ xe:</Text>
                {registrations.length === 0 ? (
                    <Text style={MyStyles.padding}>Bạn chưa có đăng ký giữ xe nào.</Text>
                ) : (
                    registrations.map((registration, index) => (
                        <Card key={index} style={MyStyles.card}>
                            <Card.Content>
                                <Title>Khách: {registration.visitor_name}</Title>
                                <Paragraph>Biển số xe: {registration.vehicle_number}</Paragraph>
                                <Paragraph>Ngày đăng ký: {registration.registration_date}</Paragraph>
                                <Paragraph>
                                    Trạng thái: {registration.approved ? "Đã duyệt" : "Chưa duyệt"}
                                </Paragraph>
                            </Card.Content>
                        </Card>
                    ))
                )}

              <Button
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
              title="Logout" onPress={logout} />
          </ScrollView>
      </LinearGradient>
    );
};

export default ResidentHome;
