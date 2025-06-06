import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    Image,
    StyleSheet,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getDatabase, ref, get, onValue, push, serverTimestamp } from "firebase/database";
import { TextInput } from "react-native-paper";

const database = getDatabase();

const ChatListScreen = ({ navigation, route }) => {
    const { currentUserId, adminId } = route.params;
    const [chatRooms, setChatRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [adminsInfo, setAdminsInfo] = useState({});
    const [newMessage, setNewMessage] = useState("");
    const [selectedRoomId, setSelectedRoomId] = useState(null);

    const sendMessage = async () => {
        if (!newMessage.trim()) return;

        if (!selectedRoomId) {
            console.warn("Chưa chọn phòng để gửi tin nhắn.");
            return;
        }

        const message = {
            text: newMessage,
            senderId: currentUserId,
            timestamp: serverTimestamp(),
        };

        try {
            await push(ref(database, `messages/${selectedRoomId}`), message);
            setNewMessage("");
            setChatRooms(prevRooms => {
            return prevRooms.map(room => {
                if (room.id === selectedRoomId) {
                    return {
                        ...room,
                        messages: [...room.messages, message],
                    };
                }
                return room;
            });
        });
        } catch (error) {
            console.error("Lỗi khi gửi tin nhắn:", error);
        }
    };

    const fetchAdminInfo = async (adminId) => {
        if (adminsInfo[adminId]) return adminsInfo[adminId];
        try {
            const token = await AsyncStorage.getItem("token");
            const response = await fetch(`http://192.168.44.103:8000/users/admins/`, {
            //const response = await fetch(`http://192.168.44.106:8000/users/admins/`, {
                headers: {
                Authorization: `Bearer ${token}`,
                },
            });
        if (!response.ok) throw new Error("Lỗi tải thông tin admin");
        const data = await response.json();
        if (data && data.admin_id === adminId) {
            const adminData = {
                id: data.admin_id,
                first_name: data.admin_name,
                last_name: "",
                avatarUrl: data.avatar_url || null,
            };
            console.log(adminData)
            setAdminsInfo((prev) => ({ ...prev, [adminId]: adminData }));
            return adminData;
        } else {
            console.warn("Không tìm thấy admin với id:", adminId);
            return null;
        }
        } catch (err) {
        console.warn("Lỗi fetch admin info:", err.message);
        return null;
        }
    };

    useEffect(() => {
        if (!currentUserId || !adminId) {
            setError("Thiếu thông tin user hoặc admin");
            setLoading(false);
            return;
        }

        const database = getDatabase();
        const roomsRef = ref(database, "chatRooms");
        const messagesRef = ref(database, "messages");

        const unsubscribeRooms = onValue(roomsRef, async (snapshot) => {
            try {
                setLoading(true);
                setError(null);

                if (!snapshot.exists()) {
                    setChatRooms([]);
                    setLoading(false);
                    return;
                }

                const allRooms = snapshot.val();

                const userRooms = Object.values(allRooms).filter(
                    (room) => room.residentId === currentUserId && room.adminId === adminId
                );

                const messagesSnapshot = await get(messagesRef);
                const allMessages = messagesSnapshot.exists() ? messagesSnapshot.val() : {};

                const roomsWithMessages = await Promise.all(
                    userRooms.map(async (room) => {
                        const roomMessages = allMessages[room.id] || {};
                        const messages = Object.values(roomMessages).sort((a, b) => {
                            return (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0);
                        });

                        const lastMessage = messages[0];
                        console.log("📩 roomMessages:", roomMessages);

                        return {
                            ...room,
                            messages: messages.map(msg => ({
                                text: msg.text,
                                senderId: msg.senderId,
                                timestamp: msg.timestamp,
                            })),
                        };
                    })
                );

                if (userRooms.length > 0 && !adminsInfo[adminId]) {
                    await fetchAdminInfo(adminId);
                }

                setChatRooms(roomsWithMessages);
            } catch (err) {
                setError("Không tải được phòng chat: " + err.message);
            } finally {
                setLoading(false);
            }
        });

        return () => {
            unsubscribeRooms();
        };
    }, [currentUserId, adminId]);

        if (loading) {
            return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#FFBAC3" />
                <Text>Đang tải danh sách phòng chat...</Text>
            </View>
            );
        }

        if (error) {
            return (
            <View style={styles.centered}>
                <Text style={{ color: "red" }}>{error}</Text>
            </View>
            );
        }

        if (chatRooms.length === 0) {
            return (
            <View style={styles.centered}>
                <Text>Chưa có phòng chat nào.</Text>
            </View>
            );
        }

        const renderItem = ({ item }) => {
            const admin = adminsInfo[item.adminId];

            return (
                <TouchableOpacity
                    style={styles.chatCard}
                    onPress={() => setSelectedRoomId(item.id)}
                >
                    {admin?.avatarUrl ? (
                        <Image source={{ uri: admin.avatarUrl }} style={styles.avatar} />
                    ) : (
                        <View style={styles.placeholderAvatar}>
                            <Text style={styles.placeholderText}>Admin</Text>
                        </View>
                    )}

                    <View style={styles.chatInfo}>
                        <View style={{ maxHeight: 7000 }}>
                            {item.messages.map((msg, index) => {
                                const isSender = msg.senderId === currentUserId;

                                let timeString = "";
                                if (msg.timestamp) {
                                    let utcDate;
                                    if (typeof msg.timestamp === "object" && msg.timestamp.seconds) {
                                        utcDate = new Date(msg.timestamp.seconds * 1000);
                                    } else {
                                        utcDate = new Date(msg.timestamp);
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

                                return (
                                    <View
                                        key={index}
                                        style={isSender ? styles.messageBubbleSender : styles.messageBubbleReceiver}
                                    >
                                        <Text style={isSender ? styles.messageTextSender : styles.messageTextReceiver}>
                                            {msg.text}
                                        </Text>
                                        {timeString ? (
                                            <Text style={styles.timestamp}>{timeString}</Text>
                                        ) : null}
                                    </View>
                                );
                            })}
                        </View>
                    </View>
                </TouchableOpacity>
            );
        };


    return (
        <View style={{ flex: 1, backgroundColor: "#f2f2f2" }}>
            <FlatList
                data={chatRooms}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                contentContainerStyle={{ padding: 5 }}
            />

            <View style={styles.inputContainer}>
                <TextInput
                    value={newMessage}
                    onChangeText={setNewMessage}
                    placeholder="Nhập tin nhắn..."
                    placeholderTextColor="#888"
                    multiline={true}
                    style={styles.textInput}
                />
                <TouchableOpacity onPress={sendMessage} style={styles.sendButton}>
                    <Text style={styles.sendButtonText}>Gửi</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

    const styles = StyleSheet.create({
        inputContainer: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 12,
        paddingVertical: 8,
        marginHorizontal: 16,
        marginBottom: 20,
        backgroundColor: "#fff",
        borderRadius: 25,
        elevation: 3,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
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
        centered: {
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
        },
        chatCard: {
            width: "100%",
            flexDirection: "row",
            backgroundColor: "#ffffff",
            marginBottom: 16,
            borderRadius: 15,
            padding: 15,
            elevation: 4,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            alignItems: "flex-start", 
            height: 800,
        },
        avatar: {
            width: 64,
            height: 64,
            borderRadius: 32,
            backgroundColor: "#eee",
        },
        placeholderAvatar: {
            width: 64,
            height: 64,
            borderRadius: 32,
            backgroundColor: "#f0f0f0",
            justifyContent: "center",
            alignItems: "center",
            borderWidth: 1,
            borderColor: "#ccc",
        },
        placeholderText: {
            color: "#999",
            fontSize: 14,
            fontWeight: "600",
        },
        chatInfo: {
            marginLeft: 10,
            flex: 1,
        },
        messageBubbleSender: {
            alignSelf: "flex-end",
            backgroundColor: "#0b93f6",
            borderRadius: 20,
            paddingHorizontal: 14,
            paddingVertical: 8,
            marginVertical: 3,
            maxWidth: "85%",
            shadowColor: "#0b93f6",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.3,
            shadowRadius: 3,
        },
        messageTextSender: {
            color: "white",
            fontSize: 15,
            lineHeight: 20,
        },
        messageBubbleReceiver: {
            alignSelf: "flex-start",
            backgroundColor: "#e5e5ea",
            borderRadius: 20,
            paddingHorizontal: 14,
            paddingVertical: 8,
            marginVertical: 3,
            maxWidth: "85%",
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
        },
});


export default ChatListScreen;