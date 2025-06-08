import React, { useEffect, useState } from "react";
import { View, Text, FlatList, ActivityIndicator, Alert, StyleSheet, Modal, TextInput, TouchableOpacity } from "react-native";
import axios from "axios";
import { useNavigation, useRoute } from "@react-navigation/native";
import MyStyles from "../../styles/MyStyles";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Picker } from "@react-native-picker/picker";
import { endpoints, authApis } from "../../configs/Apis";

const AdminLockerItems = () => {
    const route = useRoute();
    const lockerId = route.params?.lockerId;
    const adminId = route.params?.adminId;
    const residentId = route.params?.residentId;
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);

    const [addModalVisible, setAddModalVisible] = useState(false);
    const [newItemName, setNewItemName] = useState("");
    const [newItemNote, setNewItemNote] = useState("");
    const [adding, setAdding] = useState(false);
    const [lastCreatedNote, setLastCreatedNote] = useState("");
    const navigation = useNavigation();

    useEffect(() => {
        fetchLockerItems();
    }, []);

    const fetchLockerItems = async () => {
        try {
            const token = await AsyncStorage.getItem("token");
            const api = authApis(token);
            const response = await api.get(endpoints.lockerItems(lockerId));
            setItems(response.data);
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
            const api = authApis(token);
            const response = await api.patch(
                endpoints.updateLockerItemStatus(lockerId, itemId),
                {
                    item_id: itemId,
                    status: newStatus
                }
            );
            if (response.status === 200 || response.status === 204) {
                Alert.alert("Thành công", "Đã cập nhật trạng thái.");
                fetchLockerItems();
            } else {
                console.error("Lỗi:", response.data);
                Alert.alert("Lỗi", response.data.detail || "Không thể cập nhật trạng thái.");
            }
        } catch (error) {
            console.error("Lỗi mạng:", error);
            Alert.alert("Lỗi", "Đã xảy ra lỗi khi kết nối.");
        }
    };

    const navigateToChatLocker = () => {
        if (!adminId || !residentId || !lockerId) {
            Alert.alert("Thiếu thông tin", "Không xác định được admin, cư dân hoặc tủ đồ.");
            return;
        }
        navigation.navigate("AdminChatLocker", {
            lockerId,
            adminId,
            residentId,
        });
    };

    const handleAddItem = async () => {
        if (!newItemName.trim()) {
            Alert.alert("Lỗi", "Tên món đồ không được để trống.");
            return;
        }
        setAdding(true);
        try {
            const token = await AsyncStorage.getItem("token");
            const api = authApis(token);
            const response = await api.post(
                endpoints.addLockerItem(lockerId),
                {
                    item_name: newItemName,
                    note: newItemNote
                }
            );
            if (response.status === 200 || response.status === 201) {
                setAddModalVisible(false);
                const noteToSend = newItemNote;
                setNewItemName("");
                setNewItemNote("");
                fetchLockerItems();
                navigation.navigate("AdminChatLocker", {
                    lockerId,
                    adminId,
                    residentId,
                    note: noteToSend,
                });
                Alert.alert("Thành công", "Đã thêm món đồ mới!");
            } else {
                Alert.alert("Lỗi", response.data.detail || "Không thể thêm món đồ.");
            }
        } catch (error) {
            Alert.alert("Lỗi", "Đã xảy ra lỗi khi kết nối.");
        } finally {
            setAdding(false);
        }
    };

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
                    enabled={true}
                    mode="dropdown"
                    style={{ color: "green" }}
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
            <TouchableOpacity
                style={{
                    backgroundColor: "#4CAF50",
                    padding: 12,
                    borderRadius: 8,
                    marginBottom: 12,
                    alignItems: "center"
                }}
                onPress={() => setAddModalVisible(true)}
            >
                <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 16 }}>+ Thêm món đồ</Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={{
                    backgroundColor: "#4CAF50",
                    padding: 12,
                    borderRadius: 8,
                    marginBottom: 12,
                    alignItems: "center"
                }}
                onPress={navigateToChatLocker}
            >
                <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 16 }}>+ Gửi tin nhắn cho cư dân</Text>
            </TouchableOpacity>

            <Modal
                visible={addModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setAddModalVisible(false)}
            >
                <View style={{
                    flex: 1,
                    backgroundColor: "rgba(0,0,0,0.3)",
                    justifyContent: "center",
                    alignItems: "center"
                }}>
                    <View style={{
                        backgroundColor: "#fff",
                        borderRadius: 12,
                        padding: 20,
                        width: "85%",
                        elevation: 5
                    }}>
                        <Text style={{ fontSize: 18, fontWeight: "bold", marginBottom: 12 }}>Thêm món đồ mới</Text>
                        <TextInput
                            placeholder="Tên món đồ"
                            value={newItemName}
                            onChangeText={setNewItemName}
                            style={{
                                borderWidth: 1,
                                borderColor: "#ccc",
                                borderRadius: 8,
                                padding: 10,
                                marginBottom: 12
                            }}
                        />
                        <TextInput
                            placeholder="Ghi chú (không bắt buộc)"
                            value={newItemNote}
                            onChangeText={setNewItemNote}
                            style={{
                                borderWidth: 1,
                                borderColor: "#ccc",
                                borderRadius: 8,
                                padding: 10,
                                marginBottom: 12
                            }}
                        />
                        <View style={{ flexDirection: "row", justifyContent: "flex-end" }}>
                            <TouchableOpacity
                                style={{
                                    backgroundColor: "#ccc",
                                    padding: 10,
                                    borderRadius: 8,
                                    marginRight: 10
                                }}
                                onPress={() => setAddModalVisible(false)}
                                disabled={adding}
                            >
                                <Text>Hủy</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={{
                                    backgroundColor: "#4CAF50",
                                    padding: 10,
                                    borderRadius: 8
                                }}
                                onPress={handleAddItem}
                                disabled={adding}
                            >
                                <Text style={{ color: "#fff", fontWeight: "bold" }}>
                                    {adding ? "Đang thêm..." : "Thêm"}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {items.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>📦 Chưa có món đồ nào trong tủ đồ...</Text>
                </View>
            ) : (
                <FlatList
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
        padding: 25,
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
        marginBottom: 12,
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