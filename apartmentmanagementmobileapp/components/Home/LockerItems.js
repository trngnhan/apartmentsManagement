import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Card, Title, Paragraph } from "react-native-paper";
import { LinearGradient } from "expo-linear-gradient";
import MyStyles from "../../styles/MyStyles";

const LockerItems = () => {
    const [lockerItems, setLockerItems] = useState([]); // State lưu danh sách món hàng trong tủ đồ

    useEffect(() => {
        const fetchLockerItems = async () => {
            try {
                const token = await AsyncStorage.getItem("token");
                const userData = await AsyncStorage.getItem("user");

                if (!userData) {
                    console.error("Không tìm thấy thông tin người dùng.");
                    return;
                }

                const user = JSON.parse(userData);
                console.log("User data:", user);
                console.log("Resident ID:", user.resident_id);
                if (!user.resident_id) {
                    console.error("Resident ID không tồn tại trong dữ liệu người dùng.");
                    return;
                }

                const response = await fetch(
                    // `http://192.168.44.101:8000/parcellockers/${user.resident_id}/items/`,
                    `http://192.168.44.103:8000/parcellockers/${user.resident_id}/items/`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                if (response.ok) {
                    const data = await response.json();
                    console.log("Danh sách món hàng trong tủ đồ:", data);
                    setLockerItems(data); // Lưu danh sách món hàng vào state
                } else {
                    console.error("Lỗi khi lấy danh sách món hàng:", response.status);
                }
            } catch (error) {
                console.error("Lỗi khi gọi API món hàng:", error);
            }
        };

        fetchLockerItems();
    }, []);

    return (
        <LinearGradient 
        colors={['#fff', '#d7d2cc', '#FFBAC3']} // Màu gradient
        style={{ flex: 1 }} // Đảm bảo gradient bao phủ toàn màn hình
        >
            <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.title}>Danh sách món hàng trong tủ đồ</Text>
            {lockerItems.length === 0 ? (
                <Text style={styles.noItems}>Không có món hàng nào trong tủ đồ.</Text>
            ) : (
                lockerItems.map((item, index) => (
                    <Card key={index} style={styles.card}>
                        <Card.Content>
                            <Title style={MyStyles.text}>Món hàng: {item.name}</Title>
                            <Paragraph>Trạng thái: {item.status}</Paragraph>
                            <Paragraph>Ngày nhận: {item.created_date ? new Date(item.created_date).
                                toLocaleDateString('vi-VN', { year: 'numeric', month: '2-digit', 
                                day: '2-digit', hour: '2-digit', minute: '2-digit' }) : "Chưa nhận"}</Paragraph>
                            <Paragraph>Ghi chú: {item.note}</Paragraph>
                        </Card.Content>
                    </Card>
                ))
            )}
            </ScrollView>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 16,
    },
    title: {
        fontSize: 20,
        fontWeight: "bold",
        marginBottom: 16,
    },
    noItems: {
        fontSize: 16,
        color: "gray",
    },
    card: {
        marginBottom: 12,
    },
});

export default LockerItems;