import React, { useState, useEffect, useCallback } from "react";
import {
    View,
    Text,
    FlatList,
    ActivityIndicator,
    StyleSheet,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import MyStyles from "../../styles/MyStyles";
import { endpoints, authApis } from "../../configs/Apis";

const AdminApartmentTransferHistorys = () => {
    const [transferHistory, setTransferHistory] = useState([]); 
    const [loading, setLoading] = useState(true); 
    const [nextPage, setNextPage] = useState(null); 
    const [loadingMore, setLoadingMore] = useState(false); 

    const fetchTransferHistory = async (url = endpoints.apartmentTransferHistories) => {
        try {
            const token = await AsyncStorage.getItem("token");
            const api = authApis(token);
            const response = await api.get(url);
            const data = response.data;
            setTransferHistory((prevHistory) => {
                const newHistory = [...prevHistory, ...(data.results || [])];
                const uniqueHistory = newHistory.filter(
                    (item, index, self) => item?.id && self.findIndex((i) => i.id === item.id) === index
                );
                return uniqueHistory;
            });
            setNextPage(data.next);
        } catch (error) {
            console.error("Lỗi khi gọi API lịch sử chuyển nhượng:", error);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    const loadMore = () => {
        if (nextPage && !loadingMore) {
            setLoadingMore(true);
            fetchTransferHistory(nextPage);
        }
    };

    useEffect(() => {
        fetchTransferHistory();
    }, []);

    const renderItem = useCallback(({ item }) => (
        <View style={MyStyles.card}>
            <Text style={MyStyles.title}>Căn hộ: {item.apartment_code}</Text>
            <Text>Chủ sở hữu trước: {item.previous_owner_email || "Không xác định"}</Text>
            <Text>Chủ sở hữu mới: {item.new_owner_email || "Không xác định"}</Text>
            <Text>Ngày chuyển nhượng:{" "}
                {item.transfer_date ? new Date(item.transfer_date).toLocaleDateString("vi-VN", {
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                }) : "Không xác định"}
            </Text>
        </View>
    ), []);

    return (
        <LinearGradient
            colors={['#fff', '#d7d2cc', '#FFBAC3']}
            style={{ flex: 1 }}
        >
            <View style={MyStyles.containerr}>
                <Text style={MyStyles.header}>Lịch sử chuyển nhượng căn hộ</Text>

                {loading ? (
                    <ActivityIndicator size="large" color="#FF6F61" />
                ) : transferHistory.length === 0 ? (
                    <Text style={MyStyles.noData}>Không có lịch sử chuyển nhượng nào để hiển thị.</Text>
                ) : (
                    <FlatList
                        data={transferHistory}
                        keyExtractor={(item) => item.id.toString()} 
                        renderItem={renderItem}
                        contentContainerStyle={{ paddingBottom: 20 }}
                        onEndReached={loadMore} 
                        onEndReachedThreshold={0.1}
                        ListFooterComponent={
                            loadingMore && <ActivityIndicator size="small" color="#FF6F61" />
                        }
                    />
                )}
            </View>
        </LinearGradient>
    );
};

export default AdminApartmentTransferHistorys;