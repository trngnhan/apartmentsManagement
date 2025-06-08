import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Button, TouchableOpacity, Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import MyStyles from "../../styles/MyStyles";
import { Modal, TextInput } from "react-native-paper";
import { Picker } from "@react-native-picker/picker";
import { endpoints, authApis } from "../../configs/Apis";

const AdminApartment = () => {
    const [apartments, setApartments] = useState([]); 
    const [loading, setLoading] = useState(true); 
    const [user, setUser] = useState(null); 
    const [nextPage, setNextPage] = useState(null); 
    const [loadingMore, setLoadingMore] = useState(false); 
    const [selectedApartment, setSelectedApartment] = useState(null);
    const [newOwnerId, setNewOwnerId] = useState("");
    const [note, setNote] = useState("");
    const [modalVisible, setModalVisible] = useState(false); 
    const [residents, setResidents] = useState([]); 
    const nav = useNavigation(); 
    const [selectedBuilding, setSelectedBuilding] = useState('all');
    const [selectedFloor, setSelectedFloor] = useState('all');
    const [createModalVisible, setCreateModalVisible] = useState(false);
    const [newCode, setNewCode] = useState("");
    const [newBuilding, setNewBuilding] = useState("");
    const [newFloor, setNewFloor] = useState("");
    const [newNumber, setNewNumber] = useState("");
    const [newOwnerIdCreate, setNewOwnerIdCreate] = useState("");

    const fetchApartments = async (url = endpoints.apartments) => {
        try {
            if (!nextPage) setLoading(true);
            const token = await AsyncStorage.getItem("token");
            const api = authApis(token);
            const response = await api.get(url);
            const data = response.data;
            console.log("Danh sách apartment từ API:", data); 
            console.log("URL trang tiếp theo:", data.next); 

            setApartments((prevApartments) => {
                const newApartments = (data.results || []).filter(
                    (apartment) => !prevApartments.some((prev) => prev.code === apartment.code)
                );
                return [...prevApartments, ...newApartments];
            });

            setNextPage(data.next);
        } catch (error) {
            console.error("Lỗi khi gọi API apartment:", error);
        } finally {
            if (!nextPage) setLoading(false);
            setLoadingMore(false);
        }
    };

    const loadMore = () => {
        console.log("nextPage:", nextPage); 
        console.log("loadingMore:", loadingMore); 
        if (nextPage && !loadingMore) {
            setLoadingMore(true); 
            fetchApartments(nextPage); 
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
            const api = authApis(token);
            const response = await api.get(endpoints.residentsWithoutApartment);
            const data = response.data;
            console.log("Danh sách cư dân từ API chưa có căn hộ:", data);
            setResidents(Array.isArray(data) ? data : data.results || []);
        } catch (error) {
            console.error("Lỗi khi gọi API cư dân:", error);
        }
    };

    const handleTransfer = async () => {
        if (!newOwnerId) {
            Alert.alert("Lỗi", "Vui lòng nhập ID người nhận.");
            return;
        }

        try {
            const token = await AsyncStorage.getItem("token");
            const api = authApis(token);
            const response = await api.post(
                endpoints.transfer(selectedApartment.id),
                {
                    new_owner_id: newOwnerId,
                    note: note,
                }
            );
            const data = response.data;
            console.log("Phản hồi JSON:", data);

            Alert.alert("Thành công", data.detail || "Chuyển nhượng thành công");
            setModalVisible(false);
            setApartments([]);
            fetchApartments();
            setNewOwnerId("");
            setNote("");
        } catch (error) {
            const data = error.response?.data || {};
            Alert.alert("Lỗi", data.detail || "Không thể chuyển nhượng căn hộ.");
            console.error("Lỗi khi chuyển nhượng căn hộ:", error);
        }
    };

    const handleCreateApartment = async () => {
        if (!newCode || !newBuilding || !newFloor || !newNumber || !newOwnerIdCreate) {
            Alert.alert("Lỗi", "Vui lòng nhập đầy đủ thông tin.");
            return;
        }

        try {
            const body = {
                code: newCode,                
                building: newBuilding,        
                floor: Number(newFloor),      
                number: newNumber,            
                owner: Number(newOwnerIdCreate),
                active: true,
            };
            console.log("Body to be posted:", body);
            const token = await AsyncStorage.getItem("token");
            const api = authApis(token);
            const response = await api.post(endpoints.apartments, body);
            const data = response.data;
            Alert.alert("Thành công", "Tạo căn hộ thành công");
            setCreateModalVisible(false);
            setNewCode("");
            setNewBuilding("");
            setNewFloor("");
            setNewNumber("");
            setNewOwnerIdCreate("");
            setApartments([]);
            fetchApartments();
        } catch (error) {
            const data = error.response?.data || {};
            Alert.alert("Lỗi", data.detail || "Tạo căn hộ thất bại");
            console.error("Lỗi khi tạo căn hộ:", error);
        }
    };

    useEffect(() => {
        const fetchUser = async () => {
            const userData = await AsyncStorage.getItem("user");
            if (userData) {
                setUser(JSON.parse(userData));
            }
        };

        fetchUser(); 
        fetchApartments();
        if (createModalVisible) {
            fetchResidentsWithoutApartment();
        }
    }, [createModalVisible]);

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
                    fetchResidentsWithoutApartment();
                }}
                style={[MyStyles.button, { backgroundColor: "#FFCC33", marginTop: 10 }]}
            >
                <Text style={MyStyles.buttonText}>Chuyển nhượng</Text>
            </TouchableOpacity>
            
        </View>
    );

    const filteredApartments = apartments.filter(a => {
        const buildingMatch = selectedBuilding === 'all' || a.building === selectedBuilding;
        const floorMatch = selectedFloor === 'all' || a.floor.toString() === selectedFloor;
        return buildingMatch && floorMatch;
        });

    const buildingOptions = ["A", "B", "C", "D"];
    const floorOptions = Array.from({ length: 20 }, (_, i) => (i + 1).toString());
    const roomNumberOptions = Array.from({ length: 30 }, (_, i) => (i + 1).toString().padStart(2, '0'));

    return (
        <LinearGradient
        colors={['#fff', '#d7d2cc', '#FFBAC3']}
        style={{ flex: 1 }}
        >
            <View style={styles.container}>
            <Text style={styles.header}>Danh sách Apartment</Text>

            <TouchableOpacity
                onPress={() => {
                    setCreateModalVisible(true);
                    fetchResidentsWithoutApartment();
                }}
                style={[MyStyles.createButtonn, { backgroundColor: "#FF6F61" }]}
            >
                <Text style={MyStyles.createButtonText}>Tạo căn hộ</Text>
            </TouchableOpacity>

            <View style={styles.header}>
                <Text style={{ fontWeight: 'bold', marginBottom: 5, paddingTop: 15 }}>Chọn tòa nhà:</Text>
                <Picker
                    selectedValue={selectedBuilding}
                    onValueChange={(value) => setSelectedBuilding(value)}
                    style={{ height: 50, backgroundColor: '#f0f0f0' }}
                >
                    <Picker.Item label="Tất cả" value="all" />
                    <Picker.Item label="Tòa A" value="A" />
                    <Picker.Item label="Tòa B" value="B" />
                    <Picker.Item label="Tòa C" value="C" />
                    <Picker.Item label="Tòa D" value="D" />
                </Picker>
            </View>

            <View style={styles.header}>
                <Text style={{ fontWeight: 'bold', marginBottom: 5 }}>Chọn tầng:</Text>
                <Picker
                    selectedValue={selectedFloor}
                    onValueChange={(value) => setSelectedFloor(value)}
                    style={{ height: 55, backgroundColor: '#f0f0f0' }}
                >
                    <Picker.Item label="Tất cả tầng" value="all" />
                    {[...Array(20)].map((_, i) => (
                    <Picker.Item key={i + 1} label={`Tầng ${i + 1}`} value={`${i + 1}`} />
                    ))}
                </Picker>
            </View>

            {loading ? (
                <ActivityIndicator size="large" color="#FF6F61" /> 
            ) : filteredApartments.length === 0 ? (
                <Text style={styles.noData}>Không có apartment nào để hiển thị.</Text>
            ) : (
                <FlatList
                    data={filteredApartments}
                    keyExtractor={(item, index) => index.toString()}
                    renderItem={renderApartment}
                    contentContainerStyle={{ paddingBottom: 20 }}
                    onEndReached={loadMore} 
                    onEndReachedThreshold={0.1} 
                    ListFooterComponent={
                        loadingMore && <ActivityIndicator size="small" color="#FF6F61" />
                    }
                />
            )}

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
                
                <Modal
                    visible={createModalVisible}
                    animationType="slide"
                    transparent={true}
                    onRequestClose={() => setCreateModalVisible(false)}
                >
                    <View style={MyStyles.modalOverlay}>
                        <View style={MyStyles.modalContent}>
                            <Text style={MyStyles.modalTitle}>Tạo căn hộ mới</Text>

                            <Text style={MyStyles.label}>Mã căn hộ</Text>
                            <TextInput
                                value={newCode}
                                onChangeText={setNewCode}
                                style={MyStyles.input}
                                placeholder="Nhập mã căn hộ"
                            />

                            <Text style={MyStyles.label}>Toà nhà</Text>
                            <Picker
                                selectedValue={newBuilding}
                                onValueChange={(itemValue) => setNewBuilding(itemValue)}
                                style={MyStyles.input}
                            >
                                <Picker.Item label="Chọn toà" value="" />
                                {buildingOptions.map((building) => (
                                    <Picker.Item key={building} label={building} value={building} />
                                ))}
                            </Picker>

                            <Text style={MyStyles.label}>Tầng</Text>
                            <Picker
                                selectedValue={newFloor}
                                onValueChange={(itemValue) => setNewFloor(itemValue)}
                                style={MyStyles.input}
                            >
                                <Picker.Item label="Chọn tầng" value="" />
                                {floorOptions.map((floor) => (
                                    <Picker.Item key={floor} label={`Tầng ${floor}`} value={floor} />
                                ))}
                            </Picker>

                            <Text style={MyStyles.label}>Số phòng</Text>
                            <Picker
                                selectedValue={newNumber}
                                onValueChange={(itemValue) => setNewNumber(itemValue)}
                                style={MyStyles.input}
                            >
                                <Picker.Item label="Chọn số phòng" value="" />
                                {roomNumberOptions.map((room) => (
                                    <Picker.Item key={room} label={`Phòng ${room}`} value={room} />
                                ))}
                            </Picker>

                            <Text style={MyStyles.label}>Chủ sở hữu</Text>
                            <Picker
                                selectedValue={newOwnerIdCreate}
                                onValueChange={(itemValue) => setNewOwnerIdCreate(itemValue)}
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

                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}>
                                <TouchableOpacity
                                    onPress={() => setCreateModalVisible(false)}
                                    style={[MyStyles.button, { backgroundColor: '#ccc', flex: 1, marginRight: 5 }]}
                                >
                                    <Text style={MyStyles.buttonText}>Hủy</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={handleCreateApartment}
                                    style={[MyStyles.button, { backgroundColor: '#4CAF50', flex: 1, marginLeft: 5 }]}
                                >
                                    <Text style={MyStyles.buttonText}>Lưu</Text>
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
        marginBottom: 20,
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