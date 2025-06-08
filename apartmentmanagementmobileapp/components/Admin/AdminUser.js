import React, { useEffect, useState } from "react";
import { View, Text, FlatList, ActivityIndicator, StyleSheet, Alert, TouchableOpacity } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import MyStyles from "../../styles/MyStyles";
import { LinearGradient } from "expo-linear-gradient";
import { Button, Modal, TextInput } from "react-native-paper";
import { Picker } from "@react-native-picker/picker";
import { endpoints, authApis } from "../../configs/Apis";

const AdminUser = () => {
    const [users, setUsers] = useState([]); 
    const [loading, setLoading] = useState(true); 
    const [error, setError] = useState(null); 
    const [searchText, setSearchText] = useState(""); 
    const [isModalVisible, setModalVisible] = useState(false); 
    const [email, setEmail] = useState("");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [password, setPassword] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    
    const createUser = async (newUser) => {
        try {
            const token = await AsyncStorage.getItem("token");
            const api = authApis(token);
            const res = await api.post(endpoints.users, newUser);
            if (res.status === 201 || res.status === 200) {
                Alert.alert("Thành công", "Tài khoản đã được tạo.");
                setUsers((prevUsers) => [...prevUsers, res.data]);
            } else {
                console.error("Lỗi khi tạo tài khoản:", res.status);
                Alert.alert("Lỗi", "Không thể tạo tài khoản. Vui lòng thử lại.");
            }
        } catch (error) {
            console.error("Lỗi khi gọi API tạo tài khoản:", error);
            Alert.alert("Lỗi", "Đã xảy ra lỗi khi tạo tài khoản.");
        }
    };

    const fetchUsers = async (search = "") => {
        try {
            const token = await AsyncStorage.getItem("token");
            const api = authApis(token);
            const res = await api.get(`${endpoints.users}?search=${search}`);
            if (res.status === 200) {
                setUsers(res.data.results || res.data);
            } else {
                console.error("Lỗi khi lấy danh sách người dùng:", res.status);
                setError("Không thể tải danh sách người dùng.");
            }
        } catch (error) {
            console.error("Lỗi khi gọi API người dùng:", error);
            setError("Đã xảy ra lỗi khi tải danh sách người dùng.");
        } finally {
            setLoading(false);
        }
    };

    const lockUser = async (userId) => {
        try {
            const token = await AsyncStorage.getItem("token");
            const api = authApis(token);
            const res = await api.patch(endpoints.userLock(userId), { active: false });
            if (res.status === 200 || res.status === 204) {
                Alert.alert("Thành công", "Tài khoản đã được khóa.");
                setUsers((prevUsers) =>
                    prevUsers.map((user) =>
                        user.id === userId ? { ...user, active: false } : user
                    )
                );
            } else {
                console.error("Lỗi khi khóa tài khoản:", res.status);
                Alert.alert("Lỗi", "Không thể khóa tài khoản. Vui lòng thử lại.");
            }
        } catch (error) {
            console.error("Lỗi khi gọi API khóa tài khoản:", error);
            Alert.alert("Lỗi", "Đã xảy ra lỗi khi khóa tài khoản.");
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const showCreateUserDialog = () => {
        setModalVisible(true);
    };

    // Hàm xử lý tìm kiếm
    const handleSearch = (text) => {
        setSearchText(text);
        fetchUsers(text);
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
                disabled={item.active === false}
            >
                <Text style={MyStyles.buttonText}>
                    {item.active === false ? "Đã khóa" : "Khóa tài khoản"}
                </Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <LinearGradient
            colors={['#fff', '#d7d2cc', '#FFBAC3']}
            style={{ flex: 1 }}
        >
            <View style={MyStyles.containerr}>
                <Text style={[MyStyles.header, MyStyles.center]}>Danh sách Người dùng</Text>

                <TextInput
                    style={MyStyles.searchInput}
                    placeholder="Tìm kiếm cư dân..."
                    value={searchText}
                    onChangeText={handleSearch}
                />

                <TouchableOpacity
                    onPress={showCreateUserDialog}
                    style={[MyStyles.createButton, { backgroundColor: "#FF6F61" }]}
                >
                    <Text style={MyStyles.createButtonText}>Tạo tài khoản</Text>
                </TouchableOpacity>

                <Modal
                    visible={isModalVisible}
                    animationType="fade"
                    transparent={true}
                    onRequestClose={() => setModalVisible(false)}
                >
                    <View style={MyStyles.modalOverlay}>
                        <View style={MyStyles.modalContent}>
                            <Text style={MyStyles.modalTitle}>Tạo tài khoản mới</Text>

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