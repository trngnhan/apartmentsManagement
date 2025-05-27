import React, { useEffect, useState } from "react";
import { View, Text, FlatList, ActivityIndicator, StyleSheet, Alert, TouchableOpacity } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import MyStyles from "../../styles/MyStyles";
import { LinearGradient } from "expo-linear-gradient";
import { Button, Modal, TextInput } from "react-native-paper";
import { Picker } from "@react-native-picker/picker";

const AdminUser = () => {
    const [users, setUsers] = useState([]); // State lưu danh sách người dùng
    const [loading, setLoading] = useState(true); // State hiển thị trạng thái tải dữ liệu
    const [error, setError] = useState(null); // State hiển thị lỗi
    const [searchText, setSearchText] = useState(""); // Văn bản tìm kiếm
    const [isModalVisible, setModalVisible] = useState(false); // Trạng thái hiển thị Modal
    const [email, setEmail] = useState("");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [password, setPassword] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    

    // Hàm gọi API để tạo tài khoản người dùng
    const createUser = async (newUser) => {
        try {
            const token = await AsyncStorage.getItem("token"); // Lấy token từ AsyncStorage
            // const response = await fetch("http://192.168.44.101:8000/users/", {
            const response = await fetch("http://192.168.44.103:8000/users/", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(newUser), // Gửi thông tin người dùng mới
            });

            if (response.ok) {
                const createdUser = await response.json();
                Alert.alert("Thành công", "Tài khoản đã được tạo.");
                // Cập nhật danh sách người dùng
                setUsers((prevUsers) => [...prevUsers, createdUser]);
            } else {
                console.error("Lỗi khi tạo tài khoản:", response.status);
                Alert.alert("Lỗi", "Không thể tạo tài khoản. Vui lòng thử lại.");
            }
        } catch (error) {
            console.error("Lỗi khi gọi API tạo tài khoản:", error);
            Alert.alert("Lỗi", "Đã xảy ra lỗi khi tạo tài khoản.");
        }
    };

    // Hàm gọi API để lấy danh sách người dùng
    const fetchUsers = async (search = "") => {
        try {
            const token = await AsyncStorage.getItem("token"); // Lấy token từ AsyncStorage
            const url = `http://192.168.44.103:8000/users/?search=${search}`; // URL API với từ khóa tìm kiếm
            // const response = await fetch("http://192.168.44.101:8000/users/", {
            const response = await fetch(url, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const data = await response.json(); // Chuyển đổi dữ liệu trả về thành JSON
                console.log("Danh sách người dùng từ API:", data); // Log dữ liệu người dùng
                setUsers(data.results || data); // Lưu danh sách người dùng vào state
            } else {
                console.error("Lỗi khi lấy danh sách người dùng:", response.status); // Log lỗi nếu có
                setError("Không thể tải danh sách người dùng."); // Cập nhật lỗi vào state
            }
        } catch (error) {
            console.error("Lỗi khi gọi API người dùng:", error); // Log lỗi nếu có
            setError("Đã xảy ra lỗi khi tải danh sách người dùng."); // Cập nhật lỗi vào state
        } finally {
            setLoading(false); // Tắt trạng thái tải dữ liệu
        }
    };

    // Hàm gọi API để khóa tài khoản người dùng
    const lockUser = async (userId) => {
        try {
            const token = await AsyncStorage.getItem("token"); // Lấy token từ AsyncStorage
            // const response = await fetch(`http://192.168.44.101:8000/users/${userId}/`, {
            const response = await fetch(`http://192.168.44.103:8000/users/${userId}/`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ active: false }), // Gửi trạng thái active = false
            });

            if (response.ok) {
                Alert.alert("Thành công", "Tài khoản đã được khóa.");
                // Cập nhật trạng thái người dùng trong danh sách
                setUsers((prevUsers) =>
                    prevUsers.map((user) =>
                        user.id === userId ? { ...user, active: false } : user
                    )
                );
            } else {
                console.error("Lỗi khi khóa tài khoản:", response.status);
                Alert.alert("Lỗi", "Không thể khóa tài khoản. Vui lòng thử lại.");
            }
        } catch (error) {
            console.error("Lỗi khi gọi API khóa tài khoản:", error);
            Alert.alert("Lỗi", "Đã xảy ra lỗi khi khóa tài khoản.");
        }
    };

    // Gọi API khi component được mount
    useEffect(() => {
        fetchUsers();
    }, []);

    const showCreateUserDialog = () => {
        setModalVisible(true); // Hiển thị Modal
    };

    // Hàm xử lý tìm kiếm
    const handleSearch = (text) => {
        setSearchText(text);
        fetchUsers(text); // Gọi API với từ khóa tìm kiếm
    };

    const handleCreateUser = () => {
        if (!email || !firstName || !lastName || !password || !phoneNumber) {
            Alert.alert("Lỗi", "Vui lòng nhập đầy đủ thông tin.");
            return;
        }

        createUser({
            email,
            first_name: firstName,
            last_name: lastName,
            password,
            phone_number: phoneNumber,
        });

        // Đóng Modal và reset các trường nhập liệu
        setModalVisible(false);
        setEmail("");
        setFirstName("");
        setLastName("");
        setPassword("");
        setPhoneNumber("");
    };
    

    // Hàm render từng người dùng
    const renderUser = ({ item }) => (
        <View style={MyStyles.card}>
            <Text style={MyStyles.name}>Tên: {item.first_name && item.last_name 
                    ? `${item.first_name} ${item.last_name}` 
                    : "Admin"}</Text>
            <Text style={MyStyles.email}>Email: {item.email || "Không xác định"}</Text>
            <Text style={MyStyles.role}>
                Vai trò: {item.is_superuser === false ? "Cư dân" : "Admin"}
            </Text>
            <Text style={MyStyles.email}>Đã đổi mật khẩu: {item.must_change_password === false ? "Đã đổi" : "Chưa đổi"}</Text>
            <Text style={MyStyles.email}>Trạng thái: {item.active === false ? "Đã khóa" : "Hoạt động"}</Text>
            <TouchableOpacity
                onPress={() => {
                    if (item.active) {
                        Alert.alert(
                            "Xác nhận",
                            `Bạn có chắc chắn muốn khóa tài khoản của ${item.first_name || "người dùng"}?`,
                            [
                                { text: "Hủy", style: "cancel" },
                                { text: "Đồng ý", onPress: () => lockUser(item.id) },
                            ]
                        );
                    }
                }}
                style={[
                    MyStyles.buttonnn,
                    { backgroundColor: item.active === false ? "#999" : "#FF6F61" },
                ]}
                disabled={item.active === false} // Vô hiệu hóa nút nếu tài khoản đã bị khóa
            >
                <Text style={MyStyles.buttonText}>
                    {item.active === false ? "Đã khóa" : "Khóa tài khoản"}
                </Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <LinearGradient
            colors={['#fff', '#d7d2cc', '#FFBAC3']} // Màu gradient
            style={{ flex: 1 }} // Đảm bảo gradient bao phủ toàn màn hình
        >
            <View style={MyStyles.containerr}>
                <Text style={[MyStyles.header, MyStyles.center]}>Danh sách Người dùng</Text>

                <TextInput
                    style={MyStyles.searchInput}
                    placeholder="Tìm kiếm cư dân..."
                    value={searchText}
                    onChangeText={handleSearch}
                />

                {/* Nút Tạo Tài Khoản */}
                <TouchableOpacity
                    onPress={showCreateUserDialog}
                    style={[MyStyles.createButton, { backgroundColor: "#FF6F61" }]}
                >
                    <Text style={MyStyles.createButtonText}>Tạo tài khoản</Text>
                </TouchableOpacity>

                {/* Modal Nhập Liệu */}
                <Modal
                    visible={isModalVisible}
                    animationType="fade"
                    transparent={true}
                    onRequestClose={() => setModalVisible(false)}
                >
                    <View style={MyStyles.modalOverlay}>
                        <View style={MyStyles.modalContent}>
                            <Text style={MyStyles.modalTitle}>Tạo tài khoản mới</Text>

                            {/* Trường nhập liệu */}
                            <TextInput
                                placeholder="Email"
                                value={email}
                                onChangeText={setEmail}
                                style={MyStyles.input}
                            />
                            <TextInput
                                placeholder="Họ"
                                value={firstName}
                                onChangeText={setFirstName}
                                style={MyStyles.input}
                            />
                            <TextInput
                                placeholder="Tên"
                                value={lastName}
                                onChangeText={setLastName}
                                style={MyStyles.input}
                            />
                            <TextInput
                                placeholder="Mật khẩu"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry={true}
                                style={MyStyles.input}
                            />
                            <TextInput
                                placeholder="Số điện thoại"
                                value={phoneNumber}
                                onChangeText={setPhoneNumber}
                                keyboardType="phone-pad"
                                maxLength={11}
                                secureTextEntry={true}
                                style={MyStyles.input}
                            />

                            {/* Nút hành động */}
                            <View style={MyStyles.modalButtonContainer}>
                                <TouchableOpacity
                                    onPress={() => setModalVisible(false)}
                                    style={MyStyles.buttonCancel}
                                >
                                    <Text style={MyStyles.buttonText}>Hủy</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={handleCreateUser}
                                    style={MyStyles.buttonnn}
                                >
                                    <Text style={MyStyles.buttonText}>Tạo</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>

                {/* Danh Sách Người Dùng */}
                <View style={{ flex: 2, padding: 10 }}>
                    {loading ? (
                        <ActivityIndicator size="large" color="#FF6F61" />
                    ) : error ? (
                        <Text style={MyStyles.error}>{error}</Text>
                    ) : users.length === 0 ? (
                        <Text style={MyStyles.noData}>Không có người dùng nào để hiển thị.</Text>
                    ) : (
                        !isModalVisible && (
                            <FlatList
                                data={users}
                                keyExtractor={(item, index) => (item.id ? item.id.toString() : index.toString())}
                                renderItem={renderUser}
                                contentContainerStyle={{ paddingBottom: 20 }}
                            />
                        )
                    )}
                </View>
            </View>
        </LinearGradient>
    );
};

export default AdminUser;