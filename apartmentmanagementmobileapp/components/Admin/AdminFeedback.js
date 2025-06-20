import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Modal, TextInput, Button, Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import MyStyles from "../../styles/MyStyles";
import { endpoints, authApis } from "../../configs/Apis";
import { Picker } from "@react-native-picker/picker";

const AdminFeedback = () => {
    const [feedbacks, setFeedbacks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showReplyModal, setShowReplyModal] = useState(false);
    const [selectedFeedbackId, setSelectedFeedbackId] = useState(null);
    const [selectedStatuses, setSelectedStatuses] = useState({});

    const fetchFeedbacks = async () => {
        try {
            const token = await AsyncStorage.getItem("token");
            const api = authApis(token);
            const response = await api.get(endpoints.feedbacks);
            const data = response.data;
            setFeedbacks(data.results || data);
        } catch (err) {
            console.error(err);
            setError("Đã xảy ra lỗi khi tải phản ánh.");
        } finally {
            setLoading(false);
        }
    };
    
    const handleUpdateStatus = async (id, newStatus) => {
        try {
            const token = await AsyncStorage.getItem("token");
            const api = authApis(token);
            const response = await api.patch(endpoints.updateFeedbackStatus(id),
                { status: newStatus }
            );
            if (response.status === 200 || response.status === 204) {
                Alert.alert("Thành công", "Đã cập nhật trạng thái.");
                fetchFeedbacks();
            } else {
                console.error("Lỗi:", response.data);
                Alert.alert("Lỗi", "Không thể cập nhật trạng thái.");
            }
        } catch (error) {
            console.error("Lỗi mạng:", error);
            Alert.alert("Lỗi", "Đã xảy ra lỗi khi kết nối.");
        }
    };



    const renderFeedback = ({ item }) => (
        <TouchableOpacity style={MyStyles.card} onPress={() => {
            setSelectedFeedbackId(item.id);
            setShowReplyModal(true);
        }}>
            <Text style={MyStyles.title}>Tiêu đề: {item.title}</Text>
            <Text style={MyStyles.description}>Nội dung: {item.content}</Text>
            <Text styles={MyStyles.description}>Cư dân: {item.first_name} {item.last_name}</Text>
            <Text style={MyStyles.description}>Email: {item.resident_email}</Text>
            <Text style={MyStyles.date}>
                Ngày gửi: {new Date(item.created_date).toLocaleDateString("vi-VN", {
                    year: "numeric", month: "2-digit", day: "2-digit",
                    hour: "2-digit", minute: "2-digit"
                })}
            </Text>
            <View style={{ marginTop: 4, flexDirection: "row", alignItems: "center" }}>
                <Text styles={MyStyles.description}>Trạng thái: </Text>
                <Picker
                    selectedValue={selectedStatuses[item.id] || item.status || 'NEW'}
                    onValueChange={(value) => {
                    const updated = { ...selectedStatuses, [item.id]: value };
                    setSelectedStatuses(updated);
                    handleUpdateStatus(item.id, value);
                    }}
                    style={{
                    backgroundColor: "#f0f0f0",
                    borderWidth: 1,
                    borderColor: "#ccc",
                    color: "green",
                    marginLeft: 8,
                    width: 250,
                    borderRadius: 6,
                    marginBottom: 8,
                    marginTop: 8,
                    }}
                >
                    <Picker.Item label="Mới" value="NEW" />
                    <Picker.Item label="Đang xử lý" value="PROCESSING" />
                    <Picker.Item label="Đã xử lý" value="RESOLVED" />
                </Picker>
            </View>
        </TouchableOpacity>
    );

    useEffect(() => {
        fetchFeedbacks();
    }, []);

    return (
        <LinearGradient colors={["#fff", "#d7d2cc", "#FFBAC3"]} style={{ flex: 1 }}>
            <View style={{ flex: 1, padding: 20, borderRadius: 20, alignItems: "center" }}>
                <Text style={MyStyles.header}>Danh sách Phản ánh</Text>
                {loading ? (
                    <ActivityIndicator size="large" color="#FF6F61" />
                ) : error ? (
                    <Text style={MyStyles.error}>{error}</Text>
                ) : feedbacks.length === 0 ? (
                    <Text style={MyStyles.noData}>Không có phản ánh nào.</Text>
                ) : (
                    <FlatList
                        data={feedbacks}
                        keyExtractor={(item) => item.id.toString()}
                        renderItem={renderFeedback}
                        contentContainerStyle={{ paddingBottom: 20 }}
                    />
                )}

                {/* Modal phản hồi
                <Modal visible={showReplyModal} animationType="slide" transparent={true}>
                    <View style={MyStyles.modalContainer}>
                        <View style={MyStyles.modalContent}>
                            <Text style={MyStyles.modalTitle}>Phản hồi phản ánh</Text>
                            <TextInput
                                style={MyStyles.input}
                                placeholder="Nội dung phản hồi"
                                value={replyContent}
                                onChangeText={setReplyContent}
                                multiline
                            />
                            <Button title="Gửi" onPress={sendReply} color="#FF6F61" />
                            <Button title="Hủy" onPress={() => setShowReplyModal(false)} color="#999" />
                        </View>
                    </View>
                </Modal> */}
            </View>
        </LinearGradient>
    );
};

export default AdminFeedback;
