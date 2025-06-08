import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Card, Title, Paragraph } from "react-native-paper";
import { LinearGradient } from "expo-linear-gradient";
import MyStyles from "../../styles/MyStyles";
import { useNavigation, useRoute } from "@react-navigation/native";
import { getDatabase, ref, update, get } from "firebase/database";
import { database2 } from "../../firebase/Configs";
import { endpoints, authApis } from "../../configs/Apis";

const database = database2;

const LockerItems = () => {
    const [lockerItems, setLockerItems] = useState([]);
    const [lockerId, setLockerId] = useState(null);
    const navigation = useNavigation();
    const route = useRoute();
    const { currentUserId, adminId: adminIdFromParams} = route.params || {};

    console.log("Current User ID:", currentUserId);
    console.log("Admin ID from params:", adminIdFromParams);
    console.log("Locker ID:", lockerId);

    useEffect(() => {
        const fetchLockerId = async () => {
            const userData = await AsyncStorage.getItem("user");
            if (userData) {
                const user = JSON.parse(userData);
                setLockerId(user.locker_id);
            }
        };
        fetchLockerId();
    }, []);

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
                if (!user.resident_id) {
                    console.error("Resident ID không tồn tại trong dữ liệu người dùng.");
                    return;
                }

                const api = authApis(token);
                const res = await api.get(endpoints.lockerItems(user.locker_id));
                if (res.status === 200) {
                    console.log("Danh sách món hàng trong tủ đồ:", res.data);
                    setLockerItems(res.data);
                } else {
                    console.error("Lỗi khi lấy danh sách món hàng:", res.status);
                }
            } catch (error) {
                console.error("Lỗi khi gọi API món hàng:", error);
            }
        };

        fetchLockerItems();
    }, []);

    const handleBellPress = async () => {
        let adminId = adminIdFromParams;
        if (!adminId) {
            adminId = await getAdminIdForResident(currentUserId);
        }
        if (!currentUserId || !adminId || !lockerId) {
            alert("Thiếu thông tin!");
            return;
        }

        try {
            const db = database
            const roomId = `${adminId}_${currentUserId}_${lockerId}`;
            const messagesRef = ref(db, `chatRooms/${roomId}/messages`);
            const snapshot = await get(messagesRef);
            if (snapshot.exists()) {
                const updates = {};
                snapshot.forEach(child => {
                    updates[`${child.key}/read`] = true;
                });
                await update(messagesRef, updates);
            }
        } catch (err) {
            console.error("Lỗi cập nhật trạng thái read:", err);
        }
        navigation.navigate("NotificationScreen", { currentUserId, adminId, lockerId });
    };

    return (
        <LinearGradient 
        colors={['#fff', '#d7d2cc', '#FFBAC3']}
        style={{ flex: 1 }}
        >
            <ScrollView contentContainerStyle={styles.container}>
            <Text style={MyStyles.titlee}>Danh sách món hàng trong tủ đồ</Text>
            <TouchableOpacity onPress={handleBellPress}>
                <Text style={MyStyles.bellIcon}>🔔 Thông báo</Text>
            </TouchableOpacity>
            {lockerItems.length === 0 ? (
                <Text style={MyStyles.noItems}>Không có món hàng nào trong tủ đồ.</Text>
            ) : (
                lockerItems.map((item, index) => (
                    <Card key={index} style={MyStyles.card}>
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