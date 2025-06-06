import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Modal, TextInput, Button } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import {Picker} from '@react-native-picker/picker';
import MyStyles from "../../styles/MyStyles";

const AdminSurvey = () => {
    const [surveys, setSurveys] = useState([]); 
    const [loading, setLoading] = useState(true); 
    const [error, setError] = useState(null); 
    const [showModal, setShowModal] = useState(false);
    const [showOptionModal, setShowOptionModal] = useState(false); 
    const [newSurvey, setNewSurvey] = useState({ title: "", description: "", deadline: "" }); 
    const [newOption, setNewOption] = useState({ surveyId: "", option_text: "" }); 
    const [selectedSurveyId, setSelectedSurveyId] = useState(""); 
    const nav = useNavigation(); // Điều hướng

    // Hàm gọi API để lấy danh sách khảo sát
    const fetchSurveys = async () => {
        try {
            const token = await AsyncStorage.getItem("token");
            const response = await fetch("http://192.168.44.103:8000/surveys/", {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            if (response.ok) {
                const data = await response.json(); 
                console.log("Danh sách khảo sát từ API:", data); 
                setSurveys(data.results || data); 
            } else {
                console.error("Lỗi khi lấy danh sách khảo sát:", response.status); 
                setError("Không thể tải danh sách khảo sát.");
            }
        } catch (error) {
            console.error("Lỗi khi gọi API khảo sát:", error); 
            setError("Đã xảy ra lỗi khi tải danh sách khảo sát.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSurveys();
    }, []);
    
    const createSurvey = async () => {
        try {
            const token = await AsyncStorage.getItem("token");
            const response = await fetch("http://192.168.44.103:8000/surveys/", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(newSurvey),
            });
            if (response.ok) {
                const data = await response.json();
                console.log("Khảo sát mới được tạo:", data);
                setSurveys((prevSurveys) => [data, ...prevSurveys]);
                setShowModal(false);
                setNewSurvey({ title: "", description: "", deadline: "" })
            } else {
                console.error("Lỗi khi tạo khảo sát:", response.status);
                alert("Không thể tạo khảo sát. Vui lòng thử lại.");
            }
        } catch (error) {
            console.error("Lỗi khi gọi API tạo khảo sát:", error);
            alert("Đã xảy ra lỗi khi tạo khảo sát.");
        }
    };

    const createSurveyOption = async () => {
        try {
            const token = await AsyncStorage.getItem("token");
            const payload = {
                surveyId: selectedSurveyId,
                option_text: newOption.option_text,
            };
            const response = await fetch("http://192.168.44.103:8000/surveyoptions/", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                console.log("Option mới được tạo:", await response.json());
                alert("Tùy chọn khảo sát đã được tạo thành công!");
                setShowOptionModal(false); 
                setNewOption({ surveyId: "", option_text: "" });
            } else {
                const errorData = await response.json();
                console.error("Lỗi khi tạo option:", response.status);
                alert("Không thể tạo tùy chọn khảo sát. Vui lòng thử lại.\n"  + JSON.stringify(errorData));
            }
        } catch (error) {
            console.error("Lỗi khi gọi API tạo option:", error);
            alert("Đã xảy ra lỗi khi tạo tùy chọn khảo sát.");
        }
        // Log dữ liệu gửi lên để debug
        console.log("Dữ liệu gửi lên:", {
            survey: selectedSurveyId,
            option_text: newOption.option_text,
        });
        console.log("Survey ID được chọn:", selectedSurveyId);
    };

    // Hàm render từng khảo sát
    const renderSurvey = ({ item }) => (
        <TouchableOpacity
            style={MyStyles.card}
            onPress={() => nav.navigate("AdminSurveyResponses", { surveyId: item.id })}
        >
            <Text style={MyStyles.title}>Tên khảo sát: {item.title}</Text>
            <Text style={MyStyles.description}>Nội dung khảo sát: {item.description}</Text>
            <Text style={MyStyles.date}>
                Ngày tạo:{" "}
                {item.created_date
                    ? new Date(item.created_date).toLocaleDateString("vi-VN", {
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                    })
                    : "Không xác định"}
            </Text>
            <Text style={MyStyles.date}>
                Hạn chót:{" "}
                {item.deadline
                    ? new Date(item.deadline).toLocaleDateString("vi-VN", {
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                    })
                    : "Không xác định"}
            </Text>
        </TouchableOpacity>
    );

    return (
        <LinearGradient
            colors={["#fff", "#d7d2cc", "#FFBAC3"]}
            style={{ flex: 1 }}
        >
            <View style={{ flex: 1, padding: 20, borderRadius: 20, alignItems: "center" }}>
                <Text style={MyStyles.header}>Danh sách Khảo sát</Text>
                <View style={{ flexDirection: "row", justifyContent: "space-between", width: "100%" }}>
                    <Button title="Tạo Khảo Sát" onPress={() => setShowModal(true)} color="#FF6F61" />
                    <Button title="Tạo Lựa chọn Khảo Sát" onPress={() => setShowOptionModal(true)} color="#FF6F61" />
                </View>
                {loading ? (
                    <ActivityIndicator size="large" color="#FF6F61" />
                ) : error ? (
                    <Text style={MyStyles.error}>{error}</Text>
                ) : surveys.length === 0 ? (
                    <Text style={MyStyles.noData}>Không có khảo sát nào để hiển thị.</Text>
                ) : (
                    <FlatList
                        data={surveys}
                        keyExtractor={(item) => item.id.toString()}
                        renderItem={renderSurvey}
                        contentContainerStyle={{ paddingBottom: 20 }}
                    />
                )}

                <Modal visible={showModal} animationType="slide" transparent={true}>
                    <View style={MyStyles.modalContainer}>
                        <View style={MyStyles.modalContent}>
                            <Text style={MyStyles.modalTitle}>Tạo Khảo Sát Mới</Text>
                            <TextInput
                                style={MyStyles.input}
                                placeholder="Tên khảo sát"
                                value={newSurvey.title}
                                onChangeText={(text) => setNewSurvey({ ...newSurvey, title: text })}
                            />
                            <TextInput
                                style={MyStyles.input}
                                placeholder="Nội dung khảo sát"
                                value={newSurvey.description}
                                onChangeText={(text) => setNewSurvey({ ...newSurvey, description: text })}
                            />
                            <TextInput
                                style={MyStyles.input}
                                placeholder="Hạn chót (YYYY-MM-DD)"
                                value={newSurvey.deadline}
                                onChangeText={(text) => setNewSurvey({ ...newSurvey, deadline: text })}
                            />
                            <Button title="Tạo" onPress={createSurvey} color="#FF6F61" />
                            <Button title="Hủy" onPress={() => setShowModal(false)} color="#999" />
                        </View>
                    </View>
                </Modal>

                <Modal visible={showOptionModal} animationType="slide" transparent={true}>
                    <View style={MyStyles.modalContainer}>
                        <View style={MyStyles.modalContent}>
                            <Text style={MyStyles.modalTitle}>Tạo Tùy Chọn Khảo Sát</Text>
                            
                            {/* Dropdown chọn khảo sát */}
                            <Picker
                                selectedValue={selectedSurveyId}
                                onValueChange={(itemValue) => setSelectedSurveyId(itemValue)}
                                style={MyStyles.picker}
                            >
                                <Picker.Item label="Chọn khảo sát" value="" />
                                {surveys.map((survey) => (
                                    <Picker.Item key={survey.id} label={survey.title} value={survey.id} />
                                ))}
                            </Picker>

                            <TextInput
                                style={MyStyles.input}
                                placeholder="Nội dung tùy chọn"
                                value={newOption.option_text}
                                onChangeText={(text) => setNewOption({ ...newOption, option_text: text })}
                            />

                            <Button
                                title="Tạo"
                                onPress={() => {
                                    setNewOption({ ...newOption, surveyId: selectedSurveyId });
                                    createSurveyOption();
                                }}
                                color="#FF6F61"
                            />
                            <Button title="Hủy" onPress={() => setShowOptionModal(false)} color="#999" />
                        </View>
                    </View>
                </Modal>
            </View>
        </LinearGradient>
    );
};

export default AdminSurvey;