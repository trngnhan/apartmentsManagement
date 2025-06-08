import React, { useEffect, useState, useCallback } from "react";
import { View, Text, FlatList, ActivityIndicator, StyleSheet, TouchableOpacity } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { endpoints, authApis } from "../../configs/Apis";

const AdminParkingRegistrations = () => {
    const [registrations, setRegistrations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState(null);

    useFocusEffect(
        useCallback(() => {
            fetchRegistrations();
        }, [])
    );

    const fetchRegistrations = async () => {
        setLoading(true);
        try {
            const token = await AsyncStorage.getItem("token");
            const api = authApis(token);
            const res = await api.get(endpoints.visitorVehicleRegistrations);
            const data = res.data;
            console.log("DATA:", data.results || data);
            setRegistrations(data.results || data);
        } catch (err) {
            setRegistrations([]);
        }
        setLoading(false);
    };

    const approveRegister = async (id) => {
        setUpdatingId(id);

        setRegistrations(prev =>
            prev.map(item =>
                item.id === id ? { ...item, approved: true } : item
            )
        );

        try {
            const token = await AsyncStorage.getItem("token");
            const api = authApis(token);
            const res = await api.patch(endpoints.approveVisitorVehicleRegistration(id), {
                approved: true
            });
            if (res.status === 200 || res.status === 204) {
                Alert.alert("Thành công", "Đã duyệt đăng ký!");
                fetchRegistrations();
            } else {
                Alert.alert("Lỗi", "Không thể duyệt đăng ký.");
            }
        } catch (err) {
            Alert.alert("Lỗi", "Có lỗi xảy ra.");
        }
        setUpdatingId(null);
    };

    const renderItem = ({ item }) => (
        <View style={styles.card}>
            <Text style={styles.title}>Tên khách: {item.visitor_name}</Text>
            <Text>Biển số xe: {item.vehicle_number}</Text>
            <Text>Cư dân đăng ký: {item.first_name} {item.last_name}</Text>
            <Text>Ngày gửi: {item.registration_date ? new Date(item.registration_date).toLocaleString("vi-VN") : ""}</Text>
            <Text>Trạng thái: 
                <Text style={{color: item.approved ? "green" : "orange"}}>
                    {item.approved ? " Đã duyệt" : " Chưa duyệt"}
                </Text>
            </Text>
            {!item.approved && (
                <View style={{ flexDirection: "row", marginTop: 10 }}>
                    <TouchableOpacity
                        style={[styles.button, { backgroundColor: "#4CAF50" }]}
                        onPress={() => approveRegister(item.id)}
                        disabled={updatingId === item.id}
                    >
                        <Text style={styles.buttonText}>Duyệt</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#FFBAC3" />
                <Text>Đang tải danh sách đăng ký gửi xe...</Text>
            </View>
        );
    }

    return (
        <View style={{ flex: 1, backgroundColor: "#f2f2f2", padding: 10 }}>
            <Text style={styles.header}>Danh sách đăng ký gửi xe</Text>
            <FlatList
                data={registrations}
                keyExtractor={item => item.id?.toString() || Math.random().toString()}
                renderItem={renderItem}
                ListEmptyComponent={<Text style={{textAlign: "center"}}>Không có đăng ký nào.</Text>}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    centered: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    header: {
        fontSize: 22,
        fontWeight: "bold",
        marginBottom: 16,
        color: "#0F4C75",
        textAlign: "center"
    },
    card: {
        backgroundColor: "#fff",
        borderRadius: 12,
        padding: 16,
        marginBottom: 14,
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
    },
    title: {
        fontWeight: "bold",
        fontSize: 16,
        marginBottom: 6,
        color: "#ff4081",
    },
    button: {
        paddingVertical: 8,
        paddingHorizontal: 18,
        borderRadius: 8,
    },
    buttonText: {
        color: "#fff",
        fontWeight: "bold",
        fontSize: 15,
    },
});

export default AdminParkingRegistrations;