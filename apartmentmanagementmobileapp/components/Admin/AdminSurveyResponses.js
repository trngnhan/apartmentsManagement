import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import MyStyles from "../../styles/MyStyles";

const AdminSurveyResponses = ({ route }) => {
    const { surveyId } = route.params; // Lấy surveyId từ params
    const [responses, setResponses] = useState([]); // State lưu danh sách phản hồi
    const [loading, setLoading] = useState(true); // State hiển thị trạng thái tải dữ liệu
    const [error, setError] = useState(null); // State hiển thị lỗi

    // Hàm gọi API để lấy danh sách phản hồi
    const fetchResponses = async () => {
        try {
            const token = await AsyncStorage.getItem("token"); // Lấy token từ AsyncStorage
            // const response = await fetch(`http://192.168.44.101:8000/surveys/${surveyId}/get-responses/`, {
            const response = await fetch(`http://192.168.44.103:8000/surveys/${surveyId}/get-responses/`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            if (response.ok) {
                const data = await response.json(); // Chuyển đổi dữ liệu trả về thành JSON
                console.log("Danh sách phản hồi từ API:", data); // Log dữ liệu phản hồi
                setResponses(data.results || data); // Lưu danh sách phản hồi vào state
            } else {
                console.error("Lỗi khi lấy danh sách phản hồi:", response.status); // Log lỗi nếu có
                setError("Không thể tải danh sách phản hồi."); // Cập nhật lỗi vào state
            }
        } catch (error) {
            console.error("Lỗi khi gọi API phản hồi:", error); // Log lỗi nếu có
            setError("Đã xảy ra lỗi khi tải danh sách phản hồi."); // Cập nhật lỗi vào state
        } finally {
            setLoading(false); // Tắt trạng thái tải dữ liệu
        }
    };

    // Gọi API khi component được mount
    useEffect(() => {
        fetchResponses(); // Gọi hàm lấy danh sách phản hồi
    }, []); // Chỉ chạy một lần khi component được mount

    // Hàm render từng phản hồi
    const renderResponse = ({ item }) => (
        <View style={MyStyles.card}>
            <Text style={MyStyles.resident}>
                Cư dân: {item.first_name && item.last_name 
                    ? `${item.first_name} ${item.last_name}` 
                    : "Không xác định"}
            </Text>
            <Text style={MyStyles.resident}>
                Email: {item.resident_email || "Không xác định"}
            </Text>
            <Text style={MyStyles.response}>
                Phản hồi: {item.option_text || "Không xác định"}
            </Text>
        </View>
    );

    return (
        <LinearGradient
        colors={['#fff', '#d7d2cc', '#FFBAC3']} // Màu gradient
        style={{ flex: 1 }} // Đảm bảo gradient bao phủ toàn màn hình
        >
            <View style={styles.container}>
            <Text style={styles.header}>Phản hồi Khảo sát</Text>
                {loading ? (
                    <ActivityIndicator size="large" color="#FF6F61" /> // Hiển thị trạng thái đang tải
                ) : error ? (
                    <Text style={MyStyles.error}>{error}</Text> // Hiển thị lỗi nếu có
                ) : responses.length === 0 ? (
                    <Text style={MyStyles.noData}>Không có phản hồi nào để hiển thị.</Text> // Hiển thị khi danh sách rỗng
                ) : (
                    <FlatList
                        data={responses}
                        keyExtractor={(item) => item.id.toString()}
                        renderItem={renderResponse}
                        contentContainerStyle={{ paddingBottom: 20 }}
                    />
                )}
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
});

export default AdminSurveyResponses;