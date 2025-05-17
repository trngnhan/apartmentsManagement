import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    ActivityIndicator,
    TouchableOpacity,
    Modal,
    TextInput,
    Button,
    } from "react-native";
    import AsyncStorage from "@react-native-async-storage/async-storage";
    import { LinearGradient } from "expo-linear-gradient";
    import MyStyles from "../../styles/MyStyles";

    const AdminLocker = () => {
    const [lockers, setLockers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [newLocker, setNewLocker] = useState({
        code: "",
        resident_name: "",
        apartment_code: "",
        received: false,
    });

    // Lấy danh sách tủ đồ từ API
    const fetchLockers = async () => {
        try {
        const token = await AsyncStorage.getItem("token");
        const response = await fetch("http://192.168.44.103:8000/lockers/", {
            method: "GET",
            headers: {
            Authorization: `Bearer ${token}`,
            },
        });
        if (response.ok) {
            const data = await response.json();
            setLockers(data.results || data);
        } else {
            setError("Không thể tải danh sách tủ đồ.");
        }
        } catch (error) {
        console.error("Lỗi khi gọi API tủ đồ:", error);
        setError("Đã xảy ra lỗi khi tải danh sách tủ đồ.");
        } finally {
        setLoading(false);
        }
    };

    useEffect(() => {
        fetchLockers();
    }, []);

    // Tạo mới tủ đồ
    const createLocker = async () => {
        try {
        const token = await AsyncStorage.getItem("token");
        const response = await fetch("http://192.168.44.103:8000/lockers/", {
            method: "POST",
            headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(newLocker),
        });

        if (response.ok) {
            const data = await response.json();
            setLockers((prev) => [data, ...prev]);
            setShowModal(false);
            setNewLocker({
            code: "",
            resident_name: "",
            apartment_code: "",
            received: false,
            });
        } else {
            alert("Không thể tạo tủ đồ. Vui lòng thử lại.");
        }
        } catch (error) {
        console.error("Lỗi tạo tủ đồ:", error);
        alert("Đã xảy ra lỗi khi tạo tủ đồ.");
        }
    };

    // Hiển thị từng item tủ đồ
    const renderLocker = ({ item }) => (
        <View style={MyStyles.card}>
        <Text style={MyStyles.title}>Mã tủ: {item.code}</Text>
        <Text style={MyStyles.description}>Cư dân: {item.resident_name || "Chưa rõ"}</Text>
        <Text style={MyStyles.description}>Căn hộ: {item.apartment_code}</Text>
        <Text style={MyStyles.date}>
            Trạng thái: {item.received ? "Đã nhận" : "Chưa nhận"}
        </Text>
        </View>
    );

    return (
        <LinearGradient colors={["#fff", "#d7d2cc", "#C6FFDD"]} style={{ flex: 1 }}>
        <View style={{ flex: 1, padding: 20, alignItems: "center" }}>
            <Text style={MyStyles.header}>Quản lý Tủ đồ Cư dân</Text>
            <Button title="Tạo Tủ đồ" onPress={() => setShowModal(true)} color="#4CAF50" />

            {loading ? (
            <ActivityIndicator size="large" color="#4CAF50" />
            ) : error ? (
            <Text style={MyStyles.error}>{error}</Text>
            ) : lockers.length === 0 ? (
            <Text style={MyStyles.noData}>Không có tủ đồ nào để hiển thị.</Text>
            ) : (
            <FlatList
                data={lockers}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderLocker}
                contentContainerStyle={{ paddingBottom: 20 }}
            />
            )}

            {/* Modal tạo mới tủ */}
            <Modal visible={showModal} animationType="slide" transparent={true}>
            <View style={MyStyles.modalContainer}>
                <View style={MyStyles.modalContent}>
                <Text style={MyStyles.modalTitle}>Tạo Tủ Đồ Mới</Text>
                <TextInput
                    style={MyStyles.input}
                    placeholder="Mã tủ"
                    value={newLocker.code}
                    onChangeText={(text) => setNewLocker({ ...newLocker, code: text })}
                />
                <TextInput
                    style={MyStyles.input}
                    placeholder="Tên cư dân"
                    value={newLocker.resident_name}
                    onChangeText={(text) => setNewLocker({ ...newLocker, resident_name: text })}
                />
                <TextInput
                    style={MyStyles.input}
                    placeholder="Mã căn hộ"
                    value={newLocker.apartment_code}
                    onChangeText={(text) => setNewLocker({ ...newLocker, apartment_code: text })}
                />
                <Button title="Tạo" onPress={createLocker} color="#4CAF50" />
                <Button title="Hủy" onPress={() => setShowModal(false)} color="#999" />
                </View>
            </View>
            </Modal>
        </View>
        </LinearGradient>
    );
    };

export default AdminLocker;
