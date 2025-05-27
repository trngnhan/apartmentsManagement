import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";
import MyStyles from "../../styles/MyStyles";
import { LinearGradient } from "expo-linear-gradient";
import { Button } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BarChart } from "react-native-chart-kit";
import { Dimensions } from "react-native";
import { ScrollView } from "react-native-gesture-handler";

const AdminHome = () => {
    const nav = useNavigation(); // Điều hướng
    const [residentCount, setResidentCount] = useState(null);
    const [apartmentCount, setApartmentCount] = useState(null);
    const [surveys, setSurveys] = useState([]);
    const [surveyChartData, setSurveyChartData] = useState([]);


    // Hàm điều hướng
    const navigateToAdminUser = () => {
        nav.navigate("AdminUser"); // Điều hướng đến trang AdminUser
    };

    const navigateToAdminResident = () => {
        nav.navigate("AdminResident"); // Điều hướng đến trang AdminResident
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

    const navigateToAdminFeedback = () => {
        nav.navigate("AdminFeedback"); // Điều hướng đến trang AdminFeedback
    };

    const navigateToAdminLocker = () => {
        nav.navigate("AdminLocker"); // Điều hướng đến trang AdminLocker
    };

    const navigateToAdminPayment = () => {
        nav.navigate("AdminPayment"); // Điều hướng đến trang AdminPayment
    };

    const navigateToAdminChatScreen = async () => {
        const token = await AsyncStorage.getItem("token");
        const user = await AsyncStorage.getItem("user");

        nav.navigate("AdminChatScreen", { token, user });
    };
    
    // Hàm gọi API
    const fetchSurveys = async () => {
        try {
            const token = await AsyncStorage.getItem("token");
            const response = await fetch("http://192.168.44.103:8000/surveys/", {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`, // Cú pháp đúng cho Bearer token
                },
            });

            if (response.ok) {
                const data = await response.json();
                console.log("Danh sách khảo sát từ API:", data);

                const actualSurveys = data.results || data; // Kiểm tra nếu có results trong data
                setSurveys(actualSurveys); // Gán dữ liệu khảo sát vào state

                // Dùng map trên actualSurveys để tạo dữ liệu cho biểu đồ
                const chartData = await Promise.all(
                    actualSurveys.map(async (survey) => {
                        if (survey.id) {  // Đảm bảo survey.id không phải null hoặc undefined
                            const token = await AsyncStorage.getItem("token");  // Lấy token
                            const res = await fetch(`http://192.168.44.103:8000/surveys/${survey.id}/response-rate/`, {
                                headers: {
                                    Authorization: `Bearer ${token}`,  // Đính kèm token vào từng request phụ
                                },
                            });
                            const json = await res.json();
                            console.log("Phản hồi từ API response-rate:", json);
                            return {
                                name: survey.title && survey.title.length > 10 ? survey.title.slice(0, 10) + "..." : survey.title,
                                rate: json.response_rate || 0,  // Đảm bảo có giá trị mặc định khi response_rate không có
                            };
                        }
                        return {
                            name: survey.title && survey.title.length > 10 ? survey.title.slice(0, 10) + "..." : survey.title,
                            rate: 0,  // Giá trị mặc định khi survey không có id
                        };
                    })
                );

                setSurveyChartData(chartData); // Gán dữ liệu biểu đồ vào state
            } else {
                console.error("Lỗi khi lấy danh sách khảo sát:", response.status);
            }
        } catch (error) {
            console.error("Lỗi khi gọi API khảo sát:", error);
        }
    };

    const fetchResidentCount = async () => {
        try {
            const token = await AsyncStorage.getItem("token");
            const res = await fetch("http://192.168.44.103:8000/residents/count-resident/", {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            const data = await res.json();
            console.log("Số lượng cư dân:", data.count);  // <- chỗ này phải đúng key
            setResidentCount(data.count);
        } catch (err) {
            console.error("Lỗi khi lấy số lượng cư dân:", err);
        }
    };

    const fetchApartmentCount = async () => {
        try {
            const token = await AsyncStorage.getItem("token");
            const res = await fetch("http://192.168.44.103:8000/apartments/total-apartments/", {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            const data = await res.json();
            console.log("Số lượng căn hộ:", data.count);
            setApartmentCount(data.count);
        }
        catch (err) {
            console.error("Lỗi khi lấy số lượng căn hộ:", err);
        }
    }

    //Hàm useEffect
    useEffect(() => {
        fetchResidentCount();
        fetchApartmentCount();
        fetchSurveys();
    }, []);

    const chartConfig = {
        backgroundGradientFrom: "#E0F7FA", // Xanh nhạt
        backgroundGradientTo: "#80DEEA",   // Xanh ngọc pastel
        decimalPlaces: 1, // Làm tròn số cho rõ ràng hơn
        color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`, // Màu chữ và cột là xanh dương đậm
        labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`, // Nhãn trục X/Y màu đen
        style: {
            borderRadius: 16,
        },
        propsForDots: {
            r: "4",
            strokeWidth: "2",
            stroke: "#0288D1",
        },
        barPercentage: 0.6, // Điều chỉnh chiều rộng cột
    };

    const screenWidth = Dimensions.get("window").width;


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
        <ScrollView style={{flex: 1}}>
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

                <TouchableOpacity onPress={navigateToAdminResident} style={MyStyles.imageContainer}>
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

                <TouchableOpacity onPress={navigateToAdminFeedback} style={MyStyles.imageContainer}>
                    <View style={{ alignItems: "center" }}>
                        <Image
                            source={require("../../assets/admin-feedback.png")} // Đường dẫn đến hình ảnh
                            style={MyStyles.image}
                        />
                        <Text style={[MyStyles.padding, MyStyles.textSmall]}>Quản lý Phản ánh</Text>
                    </View>
                </TouchableOpacity>
            </View>

            <View style={{ flexDirection: "row", justifyContent: "space-around"}}>
                <TouchableOpacity onPress={navigateToAdminLocker} style={MyStyles.imageContainer}>
                    <View style={{ alignItems: "center" }}>
                        <Image
                            source={require("../../assets/admin-locker.png")} // Đường dẫn đến hình ảnh
                            style={MyStyles.image}
                        />
                        <Text style={[MyStyles.padding, MyStyles.textSmall]}>Quản lý tủ đồ</Text>
                    </View>
                </TouchableOpacity>

                <TouchableOpacity onPress={navigateToAdminPayment} style={MyStyles.imageContainer}>
                    <View style={{ alignItems: "center" }}>
                        <Image
                            source={require("../../assets/admin_payment.png")} // Đường dẫn đến hình ảnh
                            style={MyStyles.image}
                        />
                        <Text style={[MyStyles.padding, MyStyles.textSmall]}>Quản lý thanh toán</Text>
                    </View>
                </TouchableOpacity>
            </View>

            <View style={{ flexDirection: "row", justifyContent: "space-around"}}>
                <TouchableOpacity onPress={navigateToAdminChatScreen} style={MyStyles.imageContainer}>
                    <View style={{ alignItems: "center" }}>
                        <Image
                            source={require("../../assets/admin-chatscreen.png")} // Đường dẫn đến hình ảnh
                            style={MyStyles.image}
                        />
                        <Text style={[MyStyles.padding, MyStyles.textSmall]}>Quản lý tin nhắn trực tuyến</Text>
                    </View>
                </TouchableOpacity>

                
            </View>

            <View style={{
                backgroundColor: '#fff',
                borderRadius: 16,
                padding: 8,
                flexDirection: 'row',
                alignItems: 'center',
                shadowColor: '#000',
                shadowOpacity: 0.1,
                shadowOffset: { width: 0, height: 4 },
                shadowRadius: 6,
                elevation: 3,
                justifyContent: 'space-between',
            }}>
                <View style={{
                    backgroundColor: '#e6f0ff',
                    padding: 16,
                    borderRadius: 40,
                    marginRight: 20,
                    alignItems: 'center',
                }}>
                    <Text style={{ fontSize: 24 }}>👥</Text>
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 16, color: '#555' }}>Tổng số cư dân</Text>
                    <Text style={{ fontSize: 30, fontWeight: 'bold', color: '#007AFF' }}>
                        {residentCount !== null ? residentCount : '...'}
                    </Text>
                </View>
            </View>

            {/* Phần "Tổng số căn hộ" nằm dưới */}
            <View style={{
                backgroundColor: '#fff',
                borderRadius: 16,
                padding: 8,
                flexDirection: 'row',
                alignItems: 'center',
                shadowColor: '#000',
                shadowOpacity: 0.1,
                shadowOffset: { width: 0, height: 4 },
                shadowRadius: 6,
                elevation: 3,
                marginVertical: 12,
                justifyContent: 'space-between',
            }}>
                <View style={{
                    backgroundColor: '#e6f0ff',
                    padding: 16,
                    borderRadius: 40,
                    marginRight: 20,
                    alignItems: 'center',
                }}>
                <Text style={{ fontSize: 24 }}>🏠</Text>
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 16, color: '#555' }}>Tổng số căn hộ</Text>
                    <Text style={{ fontSize: 30, fontWeight: 'bold', color: '#007AFF' }}>
                        {apartmentCount !== null ? apartmentCount : '...'}
                    </Text>
                </View>
            </View>
            
            {/* Biểu đồ hình cột */}
            <View style={{ marginTop: 20, marginBottom: 20 }}>
                <Text style={{ fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginBottom: 10, color: '#000' }}>
                    Tỉ lệ phản hồi khảo sát 
                </Text>
                <BarChart
                    data={{
                    labels: surveyChartData.map(item => item.name),
                    datasets: [
                        {
                        data: surveyChartData.map(item => item.rate),
                        },
                    ],
                    }}
                    width={screenWidth - 20}
                    height={300}
                    fromZero={true}
                    yAxisSuffix="%"
                    yAxisInterval={10} // Tăng khoảng cách trục Y để dễ phân biệt
                    chartConfig={chartConfig}
                    verticalLabelRotation={0}
                    style={{
                    marginVertical: 8,
                    borderRadius: 16,
                    }}
                />
            </View>

            <Button
                title="Logout"
                onPress={logout}
                color="#FF6F61"
            />
        </LinearGradient>
        </ScrollView>
    );
};

export default AdminHome;