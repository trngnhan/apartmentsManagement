import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import MyStyles from "../../styles/MyStyles";

const AdminSurveyResponses = ({ route }) => {
    const { surveyId } = route.params;
    const [responses, setResponses] = useState([]); 
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null); 

    const fetchResponses = async () => {
        try {
            const token = await AsyncStorage.getItem("token");
            // const response = await fetch(`http://192.168.44.101:8000/surveys/${surveyId}/get-responses/`, {
            const response = await fetch(`http://192.168.44.103:8000/surveys/${surveyId}/get-responses/`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            if (response.ok) {
                const data = await response.json(); 
                console.log("Danh sách phản hồi từ API:", data); 
                setResponses(data.results || data);
            } else {
                console.error("Lỗi khi lấy danh sách phản hồi:", response.status); 
                setError("Không thể tải danh sách phản hồi."); 
            }
        } catch (error) {
            console.error("Lỗi khi gọi API phản hồi:", error); 
            setError("Đã xảy ra lỗi khi tải danh sách phản hồi.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchResponses(); 
    }, []);

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
        colors={['#fff', '#d7d2cc', '#FFBAC3']} 
        style={{ flex: 1 }}
        >
            <View style={styles.container}>
            <Text style={styles.header}>Phản hồi Khảo sát</Text>
                {loading ? (
                    <ActivityIndicator size="large" color="#FF6F61" /> 
                ) : error ? (
                    <Text style={MyStyles.error}>{error}</Text>
                ) : responses.length === 0 ? (
                    <Text style={MyStyles.noData}>Không có phản hồi nào để hiển thị.</Text>
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