import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Button, TouchableOpacity, Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import MyStyles from "../../styles/MyStyles";
import { Modal, TextInput } from "react-native-paper";
import { Picker } from "@react-native-picker/picker";

const AdminApartment = () => {
    const [apartments, setApartments] = useState([]); // State lưu danh sách apartment
    const [loading, setLoading] = useState(true); // State hiển thị trạng thái loading
    const [user, setUser] = useState(null); // State lưu thông tin người dùng
    const [nextPage, setNextPage] = useState(null); // URL của trang tiếp theo
    const [loadingMore, setLoadingMore] = useState(false); // Trạng thái tải thêm dữ liệu
    const [selectedApartment, setSelectedApartment] = useState(null); // Căn hộ được chọn để chuyển nhượng
    const [newOwnerId, setNewOwnerId] = useState(""); // ID người nhận
    const [note, setNote] = useState(""); // Ghi chú chuyển nhượng
    const [modalVisible, setModalVisible] = useState(false); // Trạng thái hiển thị Modal
    const [residents, setResidents] = useState([]); // Danh sách cư dân chưa có căn hộ
    const nav = useNavigation(); // Điều hướng

    // Hàm gọi API để lấy danh sách apartment
    // const fetchApartments = async (url = "http://192.168.44.101:8000/apartments/") => {
    const fetchApartments = async (url = "http://192.168.44.103:8000/apartments/") => {
        try {
            if (!nextPage) setLoading(true); // Bật trạng thái tải dữ liệu ban đầu
            const token = await AsyncStorage.getItem("token");
            const response = await fetch(url, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
    
            if (response.ok) {
                const data = await response.json();
                console.log("Danh sách apartment từ API:", data); // Log dữ liệu trả về
                console.log("URL trang tiếp theo:", data.next); // Log URL của trang tiếp theo
    
                // Loại bỏ dữ liệu trùng lặp và thêm dữ liệu mới
                setApartments((prevApartments) => {
                    const newApartments = data.results.filter(
                        (apartment) => !prevApartments.some((prev) => prev.code === apartment.code)
                    );
                    return [...prevApartments, ...newApartments];
                });
    
                setNextPage(data.next); // Cập nhật URL của trang tiếp theo (hoặc null nếu không còn trang)
            } else {
                console.error("Lỗi khi lấy danh sách apartment:", response.status);
            }
        } catch (error) {
            console.error("Lỗi khi gọi API apartment:", error);
        } finally {
            if (!nextPage) setLoading(false); // Tắt trạng thái loading nếu đây là lần tải đầu tiên
            setLoadingMore(false); // Tắt trạng thái tải thêm dữ liệu
        }
    };

    // Hàm tải thêm dữ liệu khi cuộn đến cuối danh sách
    const loadMore = () => {
        console.log("nextPage:", nextPage); // Log giá trị của nextPage
        console.log("loadingMore:", loadingMore); // Log trạng thái loadingMore
        if (nextPage && !loadingMore) {
            setLoadingMore(true); // Bật trạng thái tải thêm dữ liệu
            fetchApartments(nextPage); // Gọi API để tải thêm dữ liệu
        }
    };

    // Hàm logout
    const logout = async () => {
        await AsyncStorage.removeItem("token");
        await AsyncStorage.removeItem("user");

        nav.reset({
            index: 0,
            routes: [{ name: "Login" }],
        });
    };

    const fetchResidentsWithoutApartment = async () => {
        try {
            const token = await AsyncStorage.getItem("token");
            // const response = await fetch("http://192.168.44.101:8000/apartments/resident-without-apartment/", {
            const response = await fetch("http://192.168.44.103:8000/apartments/resident-without-apartment/", {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                console.log("Danh sách cư dân từ API chưa có căn hộ:", data); // Log dữ liệu trả về
                setResidents(data); // Lưu danh sách cư dân vào state
            } else {
                console.error("Lỗi khi lấy danh sách cư dân:", response.status);
            }
        } catch (error) {
            console.error("Lỗi khi gọi API cư dân:", error);
        }
    };

    // Hàm xử lý chuyển nhượng căn hộ
    const handleTransfer = async () => {
        if (!newOwnerId) {
            Alert.alert("Lỗi", "Vui lòng nhập ID người nhận.");
            return;
        }

        try {
            const token = await AsyncStorage.getItem("token");
            const response = await fetch(
                // `http://192.168.44.101:8000/apartments/${selectedApartment.id}/transfer/`,
                `http://192.168.44.103:8000/apartments/${selectedApartment.id}/transfer/`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        new_owner_id: newOwnerId,
                        note: note,
                    }),
                }
            );

            const data = await response.json();
            console.log("Phản hồi JSON:", data);

            if (response.ok) {
                Alert.alert("Thành công", data.detail);
                setModalVisible(false); // Đóng Modal
                setNewOwnerId(""); // Reset trường nhập liệu
                setNote("");
            } else {
                Alert.alert("Lỗi", data.detail || "Không thể chuyển nhượng căn hộ.");
            }
        } catch (error) {
            console.error("Lỗi khi chuyển nhượng căn hộ:", error);
            Alert.alert("Lỗi", "Đã xảy ra lỗi khi chuyển nhượng căn hộ.");
        }
    };

    // Gọi API khi component được render
    useEffect(() => {
        const fetchUser = async () => {
            const userData = await AsyncStorage.getItem("user");
            if (userData) {
                setUser(JSON.parse(userData)); // Lưu thông tin người dùng vào state
            }
        };

        fetchUser(); // Gọi hàm lấy thông tin người dùng
        fetchApartments(); // Gọi API để tải dữ liệu ban đầu
        if (modalVisible) {
            fetchResidentsWithoutApartment(); // Gọi API khi Modal mở
        }
    }, [modalVisible]);

    // Render từng apartment
    const renderApartment = ({ item }) => (
        <View style={styles.card}>
            <Text style={styles.name}>Căn hộ: {item.code}</Text>
            <Text>Toà: {item.building}</Text>
            <Text>Tầng: {item.floor}</Text>
            <Text>Phòng: {item.number}</Text>
            <Text>
            Chủ sở hữu: {item.first_name && item.last_name 
                ? `${item.first_name} ${item.last_name}` 
                : item.owner_email || "Không xác định"}
            </Text>
            <Text>Email: {item.owner_email}</Text>
            <Text>Trạng thái: {item.active ? "Hoạt động" : "Không hoạt động"}</Text>

            {/* Nút chuyển nhượng */}
            <TouchableOpacity
                onPress={() => {
                    setSelectedApartment(item); // Lưu căn hộ được chọn
                    setModalVisible(true); // Hiển thị Modal
                }}
                style={[MyStyles.button, { backgroundColor: "#FFCC33", marginTop: 10 }]}
            >
                <Text style={MyStyles.buttonText}>Chuyển nhượng</Text>
            </TouchableOpacity>
            
        </View>
    );

    return (
        <LinearGradient
        colors={['#fff', '#d7d2cc', '#FFBAC3']} // Màu gradient
        style={{ flex: 1 }} // Đảm bảo gradient bao phủ toàn màn hình
        >
            <View style={styles.container}>
            <Text style={styles.header}>Danh sách Apartment</Text>

            {loading ? (
                <ActivityIndicator size="large" color="#FF6F61" /> // Hiển thị loading khi đang tải dữ liệu ban đầu
            ) : apartments.length === 0 ? (
                <Text style={styles.noData}>Không có apartment nào để hiển thị.</Text>
            ) : (
                <FlatList
                    data={apartments}
                    keyExtractor={(item, index) => index.toString()}
                    renderItem={renderApartment}
                    contentContainerStyle={{ paddingBottom: 20 }}
                    onEndReached={loadMore} // Gọi hàm loadMore khi cuộn đến cuối danh sách
                    onEndReachedThreshold={0.1} // Ngưỡng để gọi loadMore
                    ListFooterComponent={
                        loadingMore && <ActivityIndicator size="small" color="#FF6F61" /> // Hiển thị loading khi tải thêm dữ liệu
                    }
                />
            )}

            {/* Modal chuyển nhượng */}
                <Modal
                    visible={modalVisible}
                    animationType="slide"
                    transparent={true}
                    onRequestClose={() => setModalVisible(false)}
                >
                    <View style={MyStyles.modalOverlay}>
                        <View style={MyStyles.modalContent}>
                            <Text style={MyStyles.modalTitle}>Chuyển nhượng căn hộ</Text>
                            <Picker
                                selectedValue={newOwnerId}
                                onValueChange={(itemValue) => setNewOwnerId(itemValue)}
                                style={MyStyles.input}
                            >
                                <Picker.Item label="Chọn cư dân" value="" />
                                {residents.map((resident) => (
                                    <Picker.Item
                                        key={resident.id}
                                        label={`${resident.first_name} ${resident.last_name} (${resident.email})`}
                                        value={resident.id}
                                    />
                                ))}
                            </Picker>
                            <TextInput
                                placeholder="Ghi chú (tuỳ chọn)"
                                value={note}
                                onChangeText={setNote}
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
                                    onPress={handleTransfer}
                                    style={MyStyles.buttonnn}
                                >
                                    <Text style={MyStyles.buttonText}>Chuyển</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>

            <Button
                title="Logout"
                onPress={logout}
                color="#FF6F61"
            />
            
        </View>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
    },
    header: {
        fontSize: 24,
        fontWeight: "bold",
        marginBottom: 20,
        textAlign: "center",
        color: "#333",
    },
    userInfo: {
        fontSize: 16,
        marginBottom: 20,
        textAlign: "center",
        color: "#555",
    },
    noData: {
        fontSize: 16,
        textAlign: "center",
        color: "#999",
    },
    card: {
        backgroundColor: "#f9f9f9",
        padding: 15,
        borderRadius: 10,
        marginBottom: 10,
        elevation: 3,
    },
    name: {
        fontSize: 18,
        fontWeight: "bold",
        marginBottom: 5,
    },
});

export default AdminApartment;