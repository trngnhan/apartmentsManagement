import React, { useEffect, useState } from "react";
import { View, TextInput, FlatList, Text, TouchableOpacity } from "react-native";
import { ref, push, serverTimestamp, onValue } from "firebase/database";
import { database1 } from "../../firebase/Configs";

const ChatListScreen = ({ route }) => {
  const { roomId, currentUserId } = route.params;
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");

  useEffect(() => {
    const messagesRef = ref(database1, `messages/${roomId}`);
    const unsubscribe = onValue(messagesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const messagesArray = Object.values(data).sort((a, b) => {
          const aTime = a.timestamp?.seconds || a.timestamp || 0;
          const bTime = b.timestamp?.seconds || b.timestamp || 0;
          return aTime - bTime;
        });
        setMessages(messagesArray);
      } else {
        setMessages([]);
      }
    });

    return () => unsubscribe();
  }, [roomId]);

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    const message = {
      text: newMessage,
      senderId: currentUserId,
      timestamp: serverTimestamp(),
    };

    try {
      await push(ref(database1, `messages/${roomId}`), message);
      setNewMessage("");
    } catch (error) {
      console.error("Lỗi khi gửi tin nhắn:", error);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#f4f6f8", padding: 10 }}>
      <FlatList
        data={messages}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => {
        const isSender = item.senderId === currentUserId;

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
          onPress={sendMessage}
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

export default ChatListScreen;
