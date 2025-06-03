import React, { useEffect, useState } from "react";
import { Alert, View, ActivityIndicator, Text, FlatList, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { chatServiceLockers } from "../../firebase/ChatServices";

const AdminChatLocker = () => {
    const route = useRoute();
    const navigation = useNavigation();
    const { note, lockerId, adminId, residentId } = route.params || {};
    const [roomId, setRoomId] = useState(null);
    const [sending, setSending] = useState(true);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const [noteSent, setNoteSent] = useState(false);

    useEffect(() => {
        console.log("Params:", { lockerId, adminId, residentId, note });
        const getOrCreateRoom = async () => {
            if (!lockerId || !adminId || !residentId) {
                setSending(false);
                return;
            }
            try {
                const roomId = await chatServiceLockers.createOrGetChatRoom(adminId, residentId, lockerId);
                console.log("createdRoomId:", roomId);
                setRoomId(roomId);

                if (note && !noteSent) {
                    await chatServiceLockers.sendMessage(
                        roomId,
                        adminId,
                        note,
                        "admin",
                    );
                    setNoteSent(true);
                    // Xóa note khỏi params để không gửi lại khi vào lại màn hình
                    navigation.setParams({ 
                        note: undefined 
                    });
                }
            } catch (err) {
                Alert.alert("Lỗi", "Không thể tạo hoặc lấy phòng chat: " + err.message);
            } finally {
                setSending(false);
            }
        };
        getOrCreateRoom();
    }, [note, lockerId, adminId, residentId]);

    // Lắng nghe tin nhắn
    useEffect(() => {
        console.log("Đang lắng nghe roomId:", roomId);
        if (!roomId) return;
        setLoading(true);
        console.log("Bắt đầu lắng nghe tin nhắn cho roomId:", roomId);
        const unsubscribe = chatServiceLockers.subscribeToMessages(
            roomId,
            (msgs) => {
                console.log("Firebase messages:", msgs);
                setMessages(msgs);
                setLoading(false);
            },
            (err) => {
                setLoading(false);
                Alert.alert("Lỗi", "Không thể tải tin nhắn: " + err.message);
            }
        );
        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, [roomId]);

    // Gửi tin nhắn mới
    const handleSend = async () => {
        if (!newMessage.trim() || !roomId) return;
        try {
            await chatServiceLockers.sendMessage(
                roomId,
                adminId,
                newMessage,
                "admin"
            );
            setNewMessage("");
        } catch (err) {
            Alert.alert("Lỗi", "Không thể gửi tin nhắn: " + err.message);
        }
    };

    // Hiển thị loading khi gửi note hoặc chưa có roomId
    if (sending || !roomId) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#007bff" />
                <Text style={{ marginTop: 10 }}>Đang khởi tạo phòng chat...</Text>
            </View>
        );
    }

    return (
        <View style={{ flex: 1, backgroundColor: "#f4f6f8", padding: 10 }}>
            <FlatList
                data={[...messages].sort((a, b) => {
                    const aTime = a.timestamp?.seconds || a.timestamp || 0;
                    const bTime = b.timestamp?.seconds || b.timestamp || 0;
                    return aTime - bTime;
                })}
                keyExtractor={(item, index) => item.id || index.toString()}
                renderItem={({ item }) => {
                    const isSender = item.senderId === adminId;
                    let timeString = "";
                    if (item.timestamp) {
                        let utcDate;
                        if (typeof item.timestamp === "object" && item.timestamp.seconds) {
                            utcDate = new Date(item.timestamp.seconds * 1000);
                        } else {
                            utcDate = new Date(item.timestamp);
                        }
                        const vietnamDate = new Date(utcDate.getTime());
                        timeString = vietnamDate.toLocaleString("vi-VN", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: false
                        });
                    }
                    
                    // Trạng thái đã xem/đã gửi
                    let statusText = "";
                    if (isSender) {
                        if (item.read === true) statusText = "Đã xem";
                        else statusText = "Đã gửi";
                    }
                    return (
                        <View
                            style={{
                                alignSelf: isSender ? "flex-end" : "flex-start",
                                backgroundColor: isSender ? "#007bff" : "#e2e2e2",
                                borderRadius: 20,
                                padding: 12,
                                marginVertical: 6,
                                marginHorizontal: 4,
                                maxWidth: "75%",
                                shadowColor: "#000",
                                shadowOffset: { width: 0, height: 1 },
                                shadowOpacity: 0.1,
                                shadowRadius: 2,
                                elevation: 2,
                            }}
                        >
                            <Text style={{ color: isSender ? "white" : "#333", fontSize: 16 }}>
                                {item.text}
                            </Text>
                            {timeString ? (
                                <Text style={{ color: isSender ? "#e0e0e0" : "#666", fontSize: 12, marginTop: 4, textAlign: "right" }}>
                                    {timeString}
                                </Text>
                            ) : null}
                            {/* Hiển thị trạng thái đã xem/đã gửi */}
                            {isSender && (
                                <Text style={{ color: isSender ? "#e0e0e0" : "#666", fontSize: 12, marginTop: 2, textAlign: "right" }}>
                                    {statusText}
                                </Text>
                            )}
                        </View>
                    );
                }}
                contentContainerStyle={{ paddingVertical: 10 }}
            />

            <View
                style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginVertical: 20,
                    paddingHorizontal: 10,
                    paddingTop: 6,
                    backgroundColor: "#fff",
                    borderTopWidth: 1,
                    borderTopColor: "#ccc",
                }}
            >
                <TextInput
                    value={newMessage}
                    onChangeText={setNewMessage}
                    placeholder="Nhập tin nhắn..."
                    style={{
                        flex: 1,
                        borderWidth: 1,
                        borderColor: "#ccc",
                        borderRadius: 25,
                        paddingHorizontal: 15,
                        paddingVertical: 8,
                        fontSize: 16,
                        backgroundColor: "#fff",
                    }}
                />
                <TouchableOpacity
                    onPress={handleSend}
                    style={{
                        backgroundColor: "#007bff",
                        borderRadius: 25,
                        paddingVertical: 10,
                        paddingHorizontal: 18,
                        marginLeft: 10,
                        justifyContent: "center",
                        alignItems: "center",
                    }}
                >
                    <Text style={{ color: "white", fontSize: 16, fontWeight: "500" }}>Gửi</Text>
                </TouchableOpacity>
            </View>
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
        padding: 16,
        backgroundColor: "#007bff",
        alignItems: "center",
    },
    headerText: {
        color: "#fff",
        fontWeight: "bold",
        fontSize: 18,
    },
    messageBubble: {
        borderRadius: 20,
        paddingHorizontal: 14,
        paddingVertical: 8,
        marginVertical: 3,
        maxWidth: "85%",
        alignSelf: "flex-start",
    },
    messageBubbleSender: {
        alignSelf: "flex-end",
        backgroundColor: "#0b93f6",
        shadowColor: "#0b93f6",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
    },
    messageBubbleReceiver: {
        alignSelf: "flex-start",
        backgroundColor: "#e5e5ea",
    },
    messageTextSender: {
        color: "white",
        fontSize: 15,
        lineHeight: 20,
    },
    messageTextReceiver: {
        color: "#222",
        fontSize: 15,
        lineHeight: 20,
    },
    timestamp: {
        fontSize: 12,
        color: "#000",
        marginTop: 6,
        textAlign: "right",
    },
    inputContainer: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 12,
        paddingVertical: 8,
        backgroundColor: "#fff",
        borderTopWidth: 1,
        borderTopColor: "#ccc",
    },
    textInput: {
        flex: 1,
        fontSize: 16,
        paddingVertical: 10,
        paddingHorizontal: 15,
        color: "#222",
        backgroundColor: "#f5f5f5",
        borderRadius: 20,
        maxHeight: 100,
    },
    sendButton: {
        backgroundColor: "#007bff",
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 20,
        marginLeft: 10,
        justifyContent: "center",
        alignItems: "center",
    },
    sendButtonText: {
        color: "white",
        fontWeight: "600",
        fontSize: 16,
    },
});

export default AdminChatLocker;