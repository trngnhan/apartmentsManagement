import React, { useEffect, useState } from "react";
import { View, Text, FlatList, ActivityIndicator, Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Line } from "react-native-svg";
import { LinearGradient } from "expo-linear-gradient";
import { Picker } from "@react-native-picker/picker";
import { endpoints, authApis } from "../../configs/Apis";

const PaymentTransactionList = ({ route }) => {
    const { categoryId, categoryName } = route.params;
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTransactions = async () => {
            setLoading(true);
            try {
                const token = await AsyncStorage.getItem("token");
                const api = authApis(token);
                const res = await api.get(`${endpoints.paymentsTransactions}?category=${categoryId}`);
                setTransactions(res.data.results || res.data);
            } catch (err) {
                Alert.alert("Lỗi", "Không thể tải danh sách giao dịch.");
            } finally {
                setLoading(false);
            }
        };
        fetchTransactions();
    }, [categoryId]);

    const updateStatus = async (transactionId, newStatus) => {
        try {
            console.log("transactionId", transactionId)
            const token = await AsyncStorage.getItem("token");
            const api = authApis(token);
            const res = await api.patch(`${endpoints.updatePaymentStatus(transactionId)}`, { status: newStatus });
            if (res.status === 200 || res.status === 204) {
                setTransactions((prev) =>
                    prev.map((item) =>
                        item.id === transactionId ? { ...item, status: newStatus } : item
                    )
                );
                Alert.alert("Thành công", "Cập nhật trạng thái thành công!");
            } else {
                Alert.alert("Lỗi", "Không thể cập nhật trạng thái.");
            }
        } catch (err) {
            Alert.alert("Lỗi", "Có lỗi xảy ra khi cập nhật trạng thái.");
        }
    };

    const STATUS_OPTIONS = [
        { value: "PENDING", label: "Chờ xử lý" },
        { value: "COMPLETED", label: "Hoàn tất" },
        { value: "FAILED", label: "Thất bại" },
        { value: "REFUNDED", label: "Đã hoàn lại" },
    ];

    const methodDisplay = (method) => {
        switch (method) {
            case "MOMO": return "MoMo";
            case "VNPAY": return "VNPay";
            default: return method;
        }
    };

    const renderItem = ({ item }) => (
        <View style={{
            backgroundColor: "#f9f9f9",
            padding: 15,
            borderRadius: 10,
            marginBottom: 10,
        }}>
            <Text>Phương thức: {methodDisplay(item.method)}</Text>
            <Text>Số tiền: {parseInt(item.amount).toLocaleString("vi-VN")} VNĐ</Text>
            <Text>Ngày thanh toán: {item.paid_date ? new Date(item.paid_date).toLocaleString("vi-VN") : "Chưa thanh toán"}</Text>
            {item.transaction_id && <Text>Mã giao dịch: {item.transaction_id}</Text>}
            <Text style={{ marginTop: 8, marginBottom: 2 }}>Trạng thái:</Text>
            <View style={{
                borderWidth: 1,
                borderColor: "#ccc",
                borderRadius: 5,
                overflow: "hidden",
                marginBottom: 5,
            }}>
                <Picker
                    selectedValue={item.status}
                    onValueChange={(value) => {
                        if (value !== item.status) updateStatus(item.id, value);
                    }}
                    mode="dropdown"
                >
                    {STATUS_OPTIONS.map(opt => (
                        <Picker.Item key={opt.value} label={opt.label} value={opt.value} style={{color: "green"}}/>
                    ))}
                </Picker>
            </View>
        </View>
    );

    return (
        <LinearGradient
            colors={['#fff', '#d7d2cc', '#FFBAC3']}
            style={{ flex: 1 }} 
        >
            <View style={{ flex: 1, padding: 16 }}>
            <Text style={{ fontWeight: "bold", fontSize: 20, marginBottom: 10, textAlign: "center" }}>
                Giao dịch của loại phí: {categoryName}
            </Text>
            {loading ? (
                <ActivityIndicator size="large" color="#FF6F61" />
            ) : (
                <FlatList
                    data={transactions}
                    keyExtractor={(item) => item.id?.toString()}
                    renderItem={renderItem}
                    ListEmptyComponent={<Text style={{ textAlign: "center", marginTop: 20 }}>Không có giao dịch nào.</Text>}
                />
            )}
        </View>
        </LinearGradient>
    );
};

export default PaymentTransactionList;