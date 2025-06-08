import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    FlatList,
    ActivityIndicator,
    StyleSheet,
    TextInput,
    Image,
    Alert,
    TouchableOpacity,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import MyStyles from "../../styles/MyStyles";
import { Modal } from "react-native-paper";
import { Picker } from "@react-native-picker/picker";
import { endpoints, authApis } from "../../configs/Apis";

const AdminResident = () => {
    const [residents, setResidents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchText, setSearchText] = useState("");
    const [unregisteredUsers, setUnregisteredUsers] = useState([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [newResident, setNewResident] = useState({
        first_name: "",
        last_name: "",
        email: "",
    });

    const fetchResidents = async (search = "") => {
        try {
            const token = await AsyncStorage.getItem("token");
            const api = authApis(token);
            const res = await api.get(`${endpoints.residents}?search=${search}`);
            if (res.status === 200) {
                const filteredResidents = res.data.filter(item => item.user.role === 'RESIDENT');
                setResidents(filteredResidents);
            } else {
                console.error("Lỗi khi lấy danh sách cư dân:", res.status);
            }
        } catch (error) {
            console.error("Lỗi khi gọi API cư dân:", error);
        } finally {
            setLoading(false);
        }
    };

    // Hàm thêm cư dân mới
    const addResident = async () => {
        try {
            if (!newResident.email || !newResident.user_id) {
                Alert.alert("Lỗi", "Vui lòng chọn một cư dân trước khi thêm.");
                return;
            }
            const token = await AsyncStorage.getItem("token");
            const api = authApis(token);
            const res = await api.post(endpoints.residents, { user_id: newResident.user_id });
            if (res.status === 201 || res.status === 200) {
                const data = res.data;
                setResidents((prevResidents) => [data, ...prevResidents]);
                setModalVisible(false);
                setNewResident({ first_name: "", last_name: "", email: "", user_id: "" });
                Alert.alert("Thành công", "Cư dân mới đã được thêm.");
            } else {
                Alert.alert("Lỗi", `Không thể thêm cư dân: ${res.data.detail || "Dữ liệu không hợp lệ"}`);
            }
        } catch (error) {
            Alert.alert("Lỗi", "Đã xảy ra lỗi khi thêm cư dân.");
        }
    };

    const fetchUnregisteredUsers = async () => {
        try {
            const token = await AsyncStorage.getItem("token");
            const api = authApis(token);
            const res = await api.get(endpoints.unregisteredUsers);
            if (res.status === 200) {
                setUnregisteredUsers(res.data);
            } else {
                console.error("Lỗi khi lấy danh sách user chưa đăng ký:", res.status);
            }
        } catch (error) {
            console.error("Lỗi khi gọi API user chưa đăng ký:", error);
        }
    };

    useEffect(() => {
        fetchResidents();
        if (modalVisible) {
            fetchUnregisteredUsers();
        }
    }, [modalVisible]);

    const handleSearch = (text) => {
        setSearchText(text);
        fetchResidents(text);
    };

    const renderItem = ({ item }) => {
        return (
            <View style={MyStyles.card}>
                {/* Hiển thị ảnh đại diện nếu có */}
                {item.user?.profile_picture ? (
                    <Image
                        source={{ uri: item.user?.profile_picture }}
                        style={styles.avatar}
                    />
                ) : (
                    <View style={styles.placeholderAvatar}>
                        <Text style={styles.placeholderText}>Ảnh</Text>
                    </View>
                )}
                <Text style={MyStyles.name}>Tên: {item.user?.first_name} {item.user?.last_name}</Text>
                <Text>Email: {item.user?.email || "Không có"}</Text>
                <Text>Vai trò: {item.user?.role || "Không xác định"}</Text>
                <Text>Trạng thái: {item.user?.active ? "Hoạt động" : "Đã khoá"}</Text>
            </View>
        );
    };

    return (
        <LinearGradient
            colors={['#fff', '#d7d2cc', '#FFBAC3']}
            style={{ flex: 1 }}
        >
            <View style={MyStyles.containerr}>
                <Text style={MyStyles.header}>Quản lý Cư dân</Text>
                <TextInput
                    style={MyStyles.searchInput}
                    placeholder="Tìm kiếm cư dân..."
                    value={searchText}
                    onChangeText={handleSearch}
                />

                <TouchableOpacity
                    onPress={() => {
                        setModalVisible(true);
                    }}
                    style={[MyStyles.button, { backgroundColor: "#FFCC33", marginBottom: 10 }]}
                >
                    <Text style={MyStyles.buttonText}>Thêm cư dân</Text>
                </TouchableOpacity>
                {loading ? (
                    <ActivityIndicator size="large" color="#FF6F61" />
                ) : residents.length === 0 ? (
                    <Text style={MyStyles.noData}>Không có cư dân nào để hiển thị.</Text>
                ) : (
                    <FlatList
                        data={residents}
                        keyExtractor={(item) => item.id.toString()}
                        renderItem={renderItem}
                        contentContainerStyle={{ paddingBottom: 20 }}
                        style={{ flexGrow: 0 }}
                    />
                )}

                {/* Modal thêm cư dân */}
                <Modal
                    visible={modalVisible}
                    animationType="slide"
                    transparent={true}
                    onRequestClose={() => setModalVisible(false)}
                >
                    <View style={MyStyles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <Text style={styles.modalTitle}>Thêm cư dân mới</Text>
                            <Picker
                                selectedValue={newResident.user_id}
                                onValueChange={(itemValue) => {
                                    const selectedUser = unregisteredUsers.find((user) => user.id === itemValue);
                                    setNewResident({
                                        first_name: selectedUser?.first_name || "",
                                        last_name: selectedUser?.last_name || "",
                                        email: selectedUser?.email || "",
                                        user_id: selectedUser?.id || "",
                                    });
                                }}
                                style={MyStyles.picker}
                            >
                                <Picker.Item label="Chọn cư dân" value="" />
                                {unregisteredUsers.map((user) => (
                                    <Picker.Item
                                        key={user.id}
                                        label={`${user.first_name} ${user.last_name} (${user.email})`}
                                        value={user.id}
                                    />
                                ))}
                            </Picker>
                            <View style={styles.modalButtons}>
                                <TouchableOpacity
                                    style={[styles.modalButton, { backgroundColor: "#ccc" }]}
                                    onPress={() => setModalVisible(false)}
                                >
                                    <Text style={styles.modalButtonText}>Hủy</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.modalButton, { backgroundColor: "#FF6F61" }]}
                                    onPress={addResident}
                                >
                                    <Text style={styles.modalButtonText}>Thêm</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>
            </View>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    modalContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
    },
    modalContent: {
        width: "90%",
        backgroundColor: "#fff",
        borderRadius: 10,
        padding: 20,
        alignItems: "center",
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: "bold",
        marginBottom: 20,
    },
    input: {
        width: "100%",
        height: 40,
        borderColor: "#ccc",
        borderWidth: 1,
        borderRadius: 5,
        paddingHorizontal: 10,
        marginBottom: 10,
    },
    modalButtons: {
        flexDirection: "row",
        justifyContent: "space-between",
        width: "100%",
        marginTop: 20,
    },
    modalButton: {
        flex: 1,
        padding: 10,
        borderRadius: 5,
        alignItems: "center",
        marginHorizontal: 5,
    },
    modalButtonText: {
        color: "#fff",
        fontWeight: "bold",
    },
    avatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
        marginRight: 15,
        backgroundColor: "#eee",
    },
    placeholderAvatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: "#ccc",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 15,
    },
    placeholderText: {
        color: "#fff",
        fontWeight: "bold",
    },
});

export default AdminResident;