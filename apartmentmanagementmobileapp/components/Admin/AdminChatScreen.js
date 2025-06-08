import React, { useEffect, useState } from "react";
import { Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { ActivityIndicator, Avatar, Card } from "react-native-paper";
import MyStyles from "../../styles/MyStyles";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { chatServices } from "../../firebase/ChatServices";
import { endpoints, authApis } from "../../configs/Apis";
import { Image } from "react-native-svg";

const AdminChatScreen = ({ navigation, route }) => {
const { user, token } = route.params;
const [residents, setResidents] = useState([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);

useEffect(() => {
    const loadResidents = async () => {
        try {
            setLoading(true);
            setError(null);

            const token = await AsyncStorage.getItem("token");
            const api = authApis(token);
            const response = await api.get(endpoints.residents || "/residents/");
            const data = response.data;
            // Nếu API trả về phân trang
            const residentsArr = Array.isArray(data) ? data : data.results || [];
            const filteredResidents = residentsArr.filter(item => item.user.role === 'RESIDENT');
            setResidents(filteredResidents);
            setLoading(false);
        } catch (err) {
            setError("Không thể tải danh sách cư dân: " + err.message);
            setLoading(false);
        }
    };

    loadResidents();
}, []);

const navigateToChatWithResident = async (resident) => {
    try {
        const userObj = typeof user === 'string' ? JSON.parse(user) : user;
        console.log("Đã gọi navigateToChatWithResident", resident);

        // if (!userObj || !userObj.id) {
        //     alert("Không xác định được Admin hiện tại.");
        //     return;
        // }

        const roomId = await chatServices.createOrGetChatRoom(userObj.id, resident.id);
        console.log("Phòng chat đã tạo hoặc lấy:", roomId);

        const chatRoomDetails = await chatServices.getChatRoomDetails(roomId);
        console.log("Chi tiết phòng chat:", chatRoomDetails);
        navigation.navigate("AdminChat", {
            roomId,
            candidateId: resident.id,
            candidateName: resident.name,
            candidateAvatar: resident.avatarUrl,
            currentUserId: userObj.id,
            lastMessage: chatRoomDetails?.lastMessage || null,
            participants: chatRoomDetails?.participants || null,
        });


    } catch (err) {
        alert("Không thể mở cuộc trò chuyện: " + err.message);
    }
};




if (loading) {
    return (
    <View style={styles.centered}>
        <ActivityIndicator size="large" />
        <Text>Đang tải danh sách cư dân...</Text>
    </View>
    );
}

if (error) {
    return (
        <View style={styles.centered}>
            <Text style={{ color: "red" }}>{error}</Text>
        </View>
    );
}

if (residents.length === 0) {
    return (
        <View style={styles.centered}>
            <Text>Chưa có cư dân nào để chat</Text>
        </View>
    );
}

const renderItem = ({ item }) => {
    return (
        <TouchableOpacity
            style={MyStyles.card}
            onPress={() => navigateToChatWithResident(item)}
        >
        <Text style={MyStyles.name}>Tên: {item.user?.first_name} {item.user?.last_name}</Text>
        <Text>Email: {item.user?.email || "Không có"}</Text>
        <Text>Vai trò: {item.user?.role || "Không xác định"}</Text>
        <Text>Trạng thái: {item.user?.active ? "Hoạt động" : "Đã khoá"}</Text>
        </TouchableOpacity>
    );
};



return (
    <LinearGradient
        colors={["#fff", "#d7d2cc", "#FFBAC3"]} style={{ flex: 1 }}
    >
        <FlatList
        data={residents}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        />
    </LinearGradient>
    );
};

const styles = StyleSheet.create({
    avatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: "#ccc",
    },

    placeholderAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#ddd",
    justifyContent: "center",
    alignItems: "center",
    },

    placeholderText: {
    color: "#888",
    fontSize: 12,
    },
    centered: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    listContainer: {
        padding: 16,
    },
    chatCard: {
        marginBottom: 10,
        elevation: 1,
    },
    chatCardContent: {
        flexDirection: "row",
        alignItems: "center",
    },
    chatInfo: {
        marginLeft: 15,
        flex: 1,
    },
    residentName: {
        fontWeight: "bold",
        fontSize: 16,
    },
    residentEmail: {
        fontSize: 14,
        color: "#757575",
    },
});

export default AdminChatScreen;
