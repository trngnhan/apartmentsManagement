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

const AdminApartmentTransferHistorys = () => {
    const [transferHistory, setTransferHistory] = useState([]); // Danh sách lịch sử chuyển nhượng
    const [loading, setLoading] = useState(true); // Trạng thái tải dữ liệu
    const [nextPage, setNextPage] = useState(null); // URL của trang tiếp theo
    const [loadingMore, setLoadingMore] = useState(false); // Trạng thái tải thêm dữ liệu

    // Hàm gọi API để lấy danh sách lịch sử chuyển nhượng
    // const fetchTransferHistory = async (url = "http://192.168.44.101:8000/apartmentstranshistories/") => {
    const fetchTransferHistory = async (url = "http://192.168.44.103:8000/apartmentstranshistories/") => {
        try {
            const token = await AsyncStorage.getItem("token");
            const response = await fetch(url, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                console.log("Lịch sử chuyển nhượng từ API:", data);

                // Lọc dữ liệu trùng lặp trước khi cập nhật state
                setTransferHistory((prevHistory) => {
                    const newHistory = [...prevHistory, ...data.results];
                    const uniqueHistory = newHistory.filter(
                        (item, index, self) => item?.id && self.findIndex((i) => i.id === item.id) === index
                    );
                    return uniqueHistory;
                });

                setNextPage(data.next); // Cập nhật URL của trang tiếp theo
            } else {
                console.error("Lỗi khi lấy lịch sử chuyển nhượng:", response.status);
            }
        } catch (error) {
            console.error("Lỗi khi gọi API lịch sử chuyển nhượng:", error);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    // Hàm tải thêm dữ liệu khi cuộn đến cuối danh sách
    const loadMore = () => {
        if (nextPage && !loadingMore) {
            setLoadingMore(true);
            fetchTransferHistory(nextPage);
        }
    };

    // Gọi API khi component được render lần đầu
    useEffect(() => {
        fetchTransferHistory();
    }, []);

    // Hàm render từng mục trong danh sách
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
            colors={['#fff', '#d7d2cc', '#FFBAC3']} // Màu gradient
            style={{ flex: 1 }} // Đảm bảo gradient bao phủ toàn màn hình
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
                        keyExtractor={(item) => item.id.toString()} // Sử dụng id duy nhất từ API
                        renderItem={renderItem}
                        contentContainerStyle={{ paddingBottom: 20 }}
                        onEndReached={loadMore} // Gọi hàm loadMore khi cuộn đến cuối danh sách
                        onEndReachedThreshold={0.1} // Ngưỡng để gọi loadMore
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