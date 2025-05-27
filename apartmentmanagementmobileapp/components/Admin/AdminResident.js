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

const AdminResident = () => {
    const [residents, setResidents] = useState([]); // Danh sách cư dân
    const [loading, setLoading] = useState(true); // Trạng thái tải dữ liệu
    const [searchText, setSearchText] = useState(""); // Văn bản tìm kiếm
    const [unregisteredUsers, setUnregisteredUsers] = useState([]); // Danh sách user chưa đăng ký
    const [modalVisible, setModalVisible] = useState(false); // Trạng thái hiển thị modal
    const [newResident, setNewResident] = useState({
        first_name: "",
        last_name: "",
        email: "",
    }); // Thông tin cư dân mới

    // Hàm gọi API để lấy danh sách cư dân
    const fetchResidents = async (search = "") => {
        try {
            const token = await AsyncStorage.getItem("token");
            // const url = `http://192.168.44.101:8000/residents/?search=${search}`;
            const url = `http://192.168.44.103:8000/residents/?search=${search}`;
            const response = await fetch(url, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                console.log("Phản hồi từ API:", data);
                const filteredResidents = data.filter(item => item.user.role === 'RESIDENT');
                setResidents(filteredResidents); // Sử dụng `results` nếu có, nếu không thì dùng toàn bộ `data`
            } else {
                console.error("Lỗi khi lấy danh sách cư dân:", response.status);
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
            // const url = `http://192.168.44.101:8000/residents/`;
            const url = `http://192.168.44.103:8000/residents/`;
            const response = await fetch(url, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ user_id: newResident.user_id }), // Gửi user_id thay vì email
            });

            if (response.ok) {
                const data = await response.json();
                console.log("Cư dân mới đã được thêm:", data);
                setResidents((prevResidents) => [data, ...prevResidents]); // Cập nhật danh sách cư dân
                setModalVisible(false); // Đóng modal
                setNewResident({ first_name: "", last_name: "", email: "", user_id: "" }); // Reset form
                Alert.alert("Thành công", "Cư dân mới đã được thêm.");
            } else {
                const errorData = await response.json();
                console.error("Chi tiết lỗi từ API:", errorData);
                Alert.alert("Lỗi", `Không thể thêm cư dân: ${errorData.detail || "Dữ liệu không hợp lệ"}`);
            }
        } catch (error) {
            console.error("Lỗi khi gọi API thêm cư dân:", error);
            Alert.alert("Lỗi", "Đã xảy ra lỗi khi thêm cư dân.");
        }
    };

    const fetchUnregisteredUsers = async () => {
    try {
        const token = await AsyncStorage.getItem("token");
        // const url = `http://192.168.44.101:8000/users/unregistered-users/`;
        const url = `http://192.168.44.103:8000/users/unregistered-users/`;
        const response = await fetch(url, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (response.ok) {
            const data = await response.json();
            console.log("Danh sách user chưa đăng ký:", data);
            setUnregisteredUsers(data); // Lưu danh sách user chưa đăng ký
        } else {
            console.error("Lỗi khi lấy danh sách user chưa đăng ký:", response.status);
        }
    } catch (error) {
        console.error("Lỗi khi gọi API user chưa đăng ký:", error);
    }
};

    // Gọi API khi component được render lần đầu
    useEffect(() => {
        fetchResidents();
        if (modalVisible) {
            fetchUnregisteredUsers();
        }
    }, [modalVisible]);

    // Hàm xử lý tìm kiếm
    const handleSearch = (text) => {
        setSearchText(text);
        fetchResidents(text); // Gọi API với từ khóa tìm kiếm
    };

    // Hàm render từng mục trong danh sách
    const renderItem = ({ item }) => {
        return (
            <View style={MyStyles.card}>
                {/* Hiển thị ảnh đại diện nếu có */}
                {item.image || item.user?.profile_picture ? (
                    <Image
                        source={{ uri: item.image || item.user?.profile_picture }}
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
            colors={['#fff', '#d7d2cc', '#FFBAC3']} // Màu gradient
            style={{ flex: 1 }} // Đảm bảo gradient bao phủ toàn màn hình
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
                        setModalVisible(true); // Hiển thị Modal
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
                                        value={user.id} // Sử dụng user.id làm giá trị
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
        backgroundColor: "rgba(0, 0, 0, 0.5)", // Làm mờ nền phía sau modal
    },
    modalContent: {
        width: "90%", // Chiếm 90% chiều rộng màn hình
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
});

export default AdminResident;