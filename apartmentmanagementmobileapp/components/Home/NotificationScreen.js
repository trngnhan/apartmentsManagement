import React, { useEffect, useState } from "react";
import { View, Text, FlatList, ActivityIndicator, StyleSheet } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getDatabase, ref, onValue } from "firebase/database";
import MyStyles from "../../styles/MyStyles";
import { useRoute } from "@react-navigation/native";
import { database2 } from "../../firebase/Configs";

const database = database2;

const NotificationScreen = () => {
    const [notifications, setNotifications] = useState([]);
    const route = useRoute();
    const [loading, setLoading] = useState(true);
    const { currentUserId, adminId, lockerId } = route.params || {};

    useEffect(() => {
        if (!currentUserId || !adminId || !lockerId) {
            setNotifications([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        const roomId = `${adminId}_${currentUserId}_${lockerId}`;
        const notificationsRef = ref(database, `chatRooms/${roomId}/messages`);
        const unsubscribe = onValue(notificationsRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val();
                const notiArr = Object.values(data).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
                setNotifications(notiArr);
            } else {
                setNotifications([]);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [currentUserId, adminId, lockerId]);

    if (loading) {
        return (
            <View style={MyStyles.centeredContainer}>
                <ActivityIndicator size="large" color="#0000ff" />
            </View>
        );
    }

    return (
        <View style={MyStyles.containerr}>
            <Text style={MyStyles.titlee}>Thông báo</Text>
            {notifications.length === 0 ? (
                <Text style={MyStyles.noDataText}>Không có thông báo nào.</Text>
            ) : (
                <FlatList
                    data={notifications}
                    keyExtractor={(_, index) => index.toString()}
                    renderItem={({ item }) => (
                        <View style={styles.notificationCard}>
                            <Text style={styles.notificationTitle}>{item.senderRole === "admin" ? "Thông báo về tủ đồ" : "Tin nhắn"}</Text>
                            <Text style={styles.notificationMessage}>{item.text}</Text>
                            <Text style={styles.notificationTime}>
                                {item.timestamp ? new Date(item.timestamp).toLocaleString() : ""}
                            </Text>
                        </View>
                    )}
                />
            )}
        </View>
    );
    
};

const styles = StyleSheet.create({
    notificationCard: {
        backgroundColor: "#fff",
        padding: 16,
        marginVertical: 8,
        borderRadius: 8,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    notificationTitle: {
        fontSize: 16,
        fontWeight: "bold",
    },
    notificationMessage: {
        fontSize: 14,
        marginTop: 4,
    },
    notificationTime: {
        fontSize: 12,
        color: "#888",
        marginTop: 8,
    },
});

export default NotificationScreen;