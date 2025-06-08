import React, { useState, useEffect } from "react";
import { View, ScrollView, Alert, Text } from "react-native";
import { TextInput, Button, Title, Card } from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import MyStyles from "../../styles/MyStyles";
import { endpoints, authApis } from "../../configs/Apis";

const SubmitFeedback = () => {
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [loading, setLoading] = useState(false);
    const [myFeedbacks, setMyFeedbacks] = useState([]);
    const [token, setToken] = useState("");

    // Lấy token và phản hồi khi vào màn hình
    useEffect(() => {
        const fetchData = async () => {
            const savedToken = await AsyncStorage.getItem("token");
            setToken(savedToken);
            fetchMyFeedbacks(savedToken);
        };
        fetchData();
    }, []);

    // Gọi API lấy phản hồi của người dùng
    const fetchMyFeedbacks = async (tokenParam = token) => {
        try {
            const api = authApis(tokenParam);
            const res = await api.get(endpoints.myFeedbacks);
            if (res.status === 200) {
                setMyFeedbacks(res.data);
            } else {
                console.warn("Không thể tải danh sách phản hồi.");
            }
        } catch (err) {
            console.error("Lỗi khi tải phản hồi:", err);
        }
    };

    // Xử lý gửi phản hồi
    const handleSubmit = async () => {
        if (!title || !content) {
            Alert.alert("Thông báo", "Vui lòng nhập đầy đủ tiêu đề và nội dung.");
            return;
        }

        setLoading(true);

        try {
            const api = authApis(token);
            const res = await api.post(endpoints.feedbacks, { title, content });
            if (res.status === 201 || res.status === 200) {
                Alert.alert("Thành công", "Gửi phản hồi thành công.");
                setTitle("");
                setContent("");
                fetchMyFeedbacks();
            } else {
                console.error("Lỗi gửi phản hồi:", res.data);
                Alert.alert("Lỗi", res.data.detail || "Không thể gửi phản hồi.");
            }
        } catch (err) {
            console.error("Lỗi mạng:", err);
            Alert.alert("Lỗi", "Đã xảy ra lỗi khi gửi phản hồi.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView contentContainerStyle={{ padding: 16 }}>
            <Title style={MyStyles.text}>Gửi phản hồi</Title>

            <TextInput
                label="Tiêu đề"
                value={title}
                onChangeText={setTitle}
                style={MyStyles.input}
                mode="outlined"
            />
            <TextInput
                label="Nội dung"
                value={content}
                onChangeText={setContent}
                multiline
                numberOfLines={5}
                style={MyStyles.input}
                mode="outlined"
            />

            <Button
                mode="contained"
                onPress={handleSubmit}
                loading={loading}
                style={{
                    marginTop: 16,
                    backgroundColor: "#FF6F61",
                    elevation: 5 
                }}
            >
                Gửi phản hồi
            </Button>

            <Title style={[MyStyles.text, { marginTop: 32 }]}>Phản hồi của bạn</Title>

            {myFeedbacks.length === 0 ? (
                <Text style={{ color: "#888", marginTop: 8 }}>Chưa có phản hồi nào.</Text>
            ) : (
                myFeedbacks.map((fb) => (
                    <Card
                        key={fb.id}
                        style={{
                            marginVertical: 8,
                            backgroundColor: "#f9f9f9",
                            borderRadius: 12,
                            elevation: 2,
                        }}
                    >
                        <Card.Title
                            title={fb.title}
                            titleStyle={{ fontWeight: "bold", fontSize: 18, marginTop: 10 }}
                        />
                        <Card.Content>
                            <Text style={{ marginBottom: 6, fontSize: 14 }}>{fb.content}</Text>
                            <Text style={{ fontSize: 13, color: "green" }}>
                                Trạng thái: {fb.status === "pending" ? "Chờ xử lý" : fb.status}
                            </Text>
                        </Card.Content>
                    </Card>
                ))
            )}
        </ScrollView>

    );
};

export default SubmitFeedback;
