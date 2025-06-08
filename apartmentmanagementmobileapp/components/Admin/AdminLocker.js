    import React, { useEffect, useState } from "react";
    import {
    View,
    Text,
    StyleSheet,
    FlatList,
    ActivityIndicator,
    TouchableOpacity,
    Modal,
    Button,
    Image,
    Alert,
    } from "react-native";
    import AsyncStorage from "@react-native-async-storage/async-storage";
    import { LinearGradient } from "expo-linear-gradient";
    import MyStyles from "../../styles/MyStyles";
    import { useNavigation, useRoute } from "@react-navigation/native";
    import { Picker } from "@react-native-picker/picker";
    import { endpoints, authApis } from "../../configs/Apis";

    const AdminLocker = () => {
    const route = useRoute();
    const [lockers, setLockers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [unregisteredResidents, setUnregisteredResidents] = useState([]);
    const [newLocker, setNewLocker] = useState({
        resident_id: null,
    });
    const adminId = route.params?.adminId;
    const residentId = route.params?.residentId;

    const sortedLockers = [...lockers].sort((a, b) => a.id - b.id);
    const nav = useNavigation();

    // Lấy danh sách tủ đồ từ API
    const fetchLockers = async () => {
        try {
            const token = await AsyncStorage.getItem("token");
            const api = authApis(token);
            const response = await api.get(endpoints.lockers);
            const data = response.data;
            console.log("Danh sách tủ đồ:", data);
            setLockers(data.results || data);
        } catch (error) {
            console.error("Lỗi khi gọi API tủ đồ:", error);
            setError("Đã xảy ra lỗi khi tải danh sách tủ đồ.");
        } finally {
            setLoading(false);
        }
    };

    // Lấy danh sách cư dân chưa có tủ đồ
    const fetchUnregisteredResidents = async () => {
        try {
            const token = await AsyncStorage.getItem("token");
            const api = authApis(token);
            const response = await api.get(endpoints.unregisteredResidentsLocker);
            const data = response.data;
            console.log("Danh sách cư dân chưa có tủ đồ:", data);
            setUnregisteredResidents(Array.isArray(data) ? data : data.results || []);
        } catch (error) {
            console.error("Lỗi mạng:", error);
        }
    };

    useEffect(() => {
        fetchLockers();
    }, []);

    useEffect(() => {
        if (showModal) {
            fetchUnregisteredResidents();
            setNewLocker({ resident_id: null });
        }
    }, [showModal]);

    // Tạo mới tủ đồ
    const createLocker = async () => {
        if (!newLocker.resident_id) {
            alert("Vui lòng chọn cư dân để tạo tủ đồ");
            return;
        }

        try {
            const token = await AsyncStorage.getItem("token");
            const api = authApis(token);
            console.log("Sending resident_id:", newLocker.resident_id);
            const response = await api.post(endpoints.lockers, {
                resident_id: newLocker.resident_id,
            });

            const data = response.data;
            setLockers((prev) => [data, ...prev]);
            setShowModal(false);
            Alert.alert("Thành công", "Tủ đồ mới đã được thêm.");
        } catch (error) {
            alert("Không thể tạo tủ đồ. Vui lòng thử lại.");
            console.error("Lỗi tạo tủ đồ:", error);
        }
    };

    // Hiển thị từng item tủ đồ
    const renderLocker = ({ item }) => (
        <TouchableOpacity
        style={[MyStyles.card, styles.lockerCard]}
        onPress={() => nav.navigate("AdminLockerItems", { 
            lockerId: item.id,
            adminId: adminId,
            residentId: item.resident,
        })}
        >
        <View style={{ alignItems: "center" }}>
            <Image
            source={require("../../assets/locker_resident.png")}
            style={MyStyles.image}
            />
        </View>
        <Text style={styles.Text}>{item.id}</Text>
        <Text style={[MyStyles.description, { textAlign: "center" }]}>
            {item.first_name} {item.last_name}
        </Text>
        <Text style={[MyStyles.description, { fontSize: 12 }]}>
            {item.active ? "✅" : "❌"}
        </Text>
        </TouchableOpacity>
    );

    return (
        <LinearGradient colors={["#fff", "#d7d2cc", "#C6FFDD"]} style={{ flex: 1 }}>
        <View style={MyStyles.containerr}>
            <Text style={MyStyles.header}>Quản lý Tủ đồ Cư dân</Text>
            <Button
            title="Tạo Tủ đồ"
            onPress={() => setShowModal(true)}
            color="#4CAF50"
            />

            {loading ? (
            <ActivityIndicator size="large" color="#4CAF50" />
            ) : error ? (
            <Text style={MyStyles.error}>{error}</Text>
            ) : lockers.length === 0 ? (
            <Text style={MyStyles.noData}>Không có tủ đồ nào để hiển thị.</Text>
            ) : (
            <FlatList
                data={sortedLockers}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderLocker}
                numColumns={4}
                contentContainerStyle={{ paddingBottom: 20 }}
                columnWrapperStyle={{ justifyContent: "space-between", marginBottom: 10 }}
                style={{ paddingTop: 20 }}
            />
            )}

            {/* Modal tạo mới tủ */}
            <Modal visible={showModal} animationType="slide" transparent={true}>
            <View style={MyStyles.modalContainer}>
                <View style={MyStyles.modalContent}>
                <Text style={MyStyles.modalTitle}>Tạo Tủ Đồ Mới</Text>

                <Picker
                    selectedValue={newLocker.resident_id}
                    onValueChange={(value) =>
                    setNewLocker({ ...newLocker, resident_id: value })
                    }
                >
                    <Picker.Item label="Chọn cư dân" value={null} />
                    {unregisteredResidents.map((resident) => (
                    <Picker.Item
                        key={resident.id}
                        label={resident.email}
                        value={resident.id}
                    />
                    ))}
                </Picker>

                <Button title="Tạo" onPress={createLocker} color="#4CAF50" />
                <Button
                    title="Hủy"
                    onPress={() => setShowModal(false)}
                    color="#999"
                />
                </View>
            </View>
            </Modal>
        </View>
        </LinearGradient>
    );
    };

    const styles = StyleSheet.create({
    lockerCard: {
        width: "23%",
        marginBottom: 10,
        alignItems: "center",
        padding: 10,
    },
    Text: {
        fontSize: 18,
        fontWeight: "bold",
    },
    });

    export default AdminLocker;
