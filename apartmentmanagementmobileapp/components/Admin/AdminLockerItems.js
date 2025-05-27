import React, { useEffect, useState } from "react";
import { View, Text, FlatList, ActivityIndicator, Alert, StyleSheet } from "react-native";
import axios from "axios";
import { useRoute } from "@react-navigation/native";
import MyStyles from "../../styles/MyStyles";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Picker } from "@react-native-picker/picker";

const AdminLockerItems = () => {
    const route = useRoute();
    const lockerId = route.params?.lockerId;
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchLockerItems = async () => {
    try {
        const token = await AsyncStorage.getItem("token");
        const response = await fetch(
            `http://192.168.44.103:8000/parcellockers/${lockerId}/items/`,
            {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            }
        );

        if (!response.ok) {
            throw new Error(`HTTP status ${response.status}`);
        }

        const data = await response.json();
        setItems(data);
        
    } catch (error) {
        console.error("Lỗi khi tải danh sách món đồ:", error);
        Alert.alert("Lỗi", "Không thể tải dữ liệu món đồ từ máy chủ.");
    } finally {
        setLoading(false);
    }
};

const handleUpdateStatus = async (lockerId, itemId, newStatus) => {
    try {
        const token = await AsyncStorage.getItem("token");

        const response = await fetch(
            `http://192.168.44.103:8000/parcellockers/${lockerId}/update-item-status/`,
            {
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    item_id: itemId,
                    status: newStatus
                })
            }
        );

        if (response.ok) {
            Alert.alert("Thành công", "Đã cập nhật trạng thái.");
            fetchLockerItems(); // Load lại danh sách
        } else {
            const errorData = await response.json();
            console.error("Lỗi:", errorData);
            Alert.alert("Lỗi", errorData.detail || "Không thể cập nhật trạng thái.");
        }
    } catch (error) {
        console.error("Lỗi mạng:", error);
        Alert.alert("Lỗi", "Đã xảy ra lỗi khi kết nối.");
    }
};




    useEffect(() => {
        fetchLockerItems();
    }, []);

    const renderItem = ({ item }) => (
    <View style={styles.card}>
        <Text style={styles.title}>Tên món đồ: {item.name}</Text>
        <Text style={styles.description}>Ghi chú: {item.note || 'Không có'}</Text>
        <Text style={styles.description}>Ngày tạo: {new Date(item.created_date).toLocaleString("vi-VN", {
                    year: "numeric", month: "2-digit", day: "2-digit",
                    hour: "2-digit", minute: "2-digit"
                })}</Text>
        <View style={styles.pickerContainer}>
            <Picker
                selectedValue={item.status}
                onValueChange={(value) => handleUpdateStatus(lockerId, item.id, value)}
                enabled={true} // Không cho chọn nếu chỉ xem
                mode="dropdown"
                style={{color: "green"}}
            >
                <Picker.Item label="Chờ nhận" value="PENDING" />
                <Picker.Item label="Đã nhận" value="RECEIVED" />
            </Picker>
        </View>
    </View>
    );

    if (loading) {
        return (
        <View style={styles.container}>
            <ActivityIndicator size="large" color="#0000ff" />
        </View>
        );
    }

    return (
    <View style={styles.container}>
        {items.length === 0 ? (
        <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>📦 Chưa có món đồ nào trong tủ đồ...</Text>
        </View>
        ) : (<FlatList
            data={items}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderItem}
            contentContainerStyle={{ paddingBottom: 16 }}
        />
        )}
    </View>
);

};

const styles = StyleSheet.create({
    container: {
        padding: 16,
        backgroundColor: "#f8f9fa",
        flexGrow: 1,
    },
    card: {
        backgroundColor: "#ffffff",
        borderRadius: 12,
        padding: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    title: {
        fontSize: 18,
        fontWeight: "600",
        color: "#343a40",
        marginBottom: 8,
    },
    description: {
        fontSize: 14,
        color: "#495057",
        marginBottom: 4,
    },
    pickerContainer: {
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 8,
        marginVertical: 4,
        backgroundColor: "#fff",
    },
    emptyContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
    },

    emptyText: {
        fontSize: 18,
        color: "#6c757d",
        textAlign: "center",
        lineHeight: 26,
    },
});

export default AdminLockerItems;
