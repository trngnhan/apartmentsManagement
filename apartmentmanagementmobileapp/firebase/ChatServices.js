import {
    get,
    onValue,
    orderByChild,
    push,
    query,
    ref,
    serverTimestamp,
    set,
    update,
} from 'firebase/database';
import { database } from './Configs';

class ChatServices {
    async createOrGetChatRoom(adminId, residentId, apartmentId = null) {
        if (!adminId || !residentId) {
            throw new Error('adminId and residentId are required');
        }
        const roomId = this.generateChatRoomId(adminId, residentId, apartmentId);
        const roomRef = ref(database, `chatRooms/${roomId}`);
        const snapshot = await get(roomRef);

        if (!snapshot.exists()) {
        const room = {
            id: roomId,
            adminId,
            residentId,
            apartmentId: apartmentId || null,
            createdAt: serverTimestamp(),
            lastMessage: null,
            lastMessageTimestamp: null,
            participants: {
            [adminId]: { id: adminId, role: 'admin', lastRead: null },
            [residentId]: { id: residentId, role: 'user', lastRead: null }
            }
        };
        await set(roomRef, room);
            console.log('Created new chat room:', roomId);
        } else {
            console.log('Chat room already exists:', roomId);
        }
        
        return roomId;
    }

    async getChatRoomDetails(roomId) {
        try {
            const roomRef = ref(database, `chatRooms/${roomId}`);
            const snapshot = await get(roomRef);
            if (snapshot.exists()) {
                const data = snapshot.val();
                console.log("Dữ liệu phòng chat trong getChatRoomDetails:", data);
                return data;
            } else {
                console.warn("Phòng chat không tồn tại:", roomId);
                return null;
            }
        } catch (err) {
            console.error("Lỗi khi lấy chi tiết phòng chat:", err);
            return null;
        }
    }

    // Hàm mới: lấy chi tiết phòng chat theo roomId
    // async getChatRoomDetails(roomId) {
    //     const roomRef = ref(database, `chatRooms/${roomId}`);
    //     const snapshot = await get(roomRef);
    //     if (!snapshot.exists()) {
    //         throw new Error("Chat room không tồn tại");
    //     }
    //     return snapshot.val();
    // }

    generateChatRoomId(adminId, residentId, apartmentId = null) {
        const sortedIds = [adminId, residentId].sort();
        return apartmentId ? `${sortedIds[0]}_${sortedIds[1]}_${apartmentId}` : `${sortedIds[0]}_${sortedIds[1]}`;
    }

    async sendMessage(roomId, senderId, text, senderRole) {
        if (!roomId || !senderId || !text) {
            throw new Error('roomId, senderId and text are required');
        }
        const messagesRef = ref(database, `chatRooms/${roomId}/messages`);
        const newMessageRef = push(messagesRef);

        const message = {
            id: newMessageRef.key,
            text,
            senderId,
            senderRole,  // 'admin' or 'user'
            timestamp: serverTimestamp(),
            read: false
        };

        await set(newMessageRef, message);

        await update(ref(database, `chatRooms/${roomId}`), {
            lastMessage: text,
            lastMessageTimestamp: serverTimestamp(),
            lastSenderId: senderId
        });

        return newMessageRef.key;
    }

    subscribeToMessages(roomId, callback, errorCallback) {
        if (!roomId) throw new Error('roomId is required');

        const messagesRef = ref(database, `chatRooms/${roomId}/messages`);
        const messagesQuery = query(messagesRef, orderByChild('timestamp'));

        const unsubscribe = onValue(messagesQuery, (snapshot) => {
        const messages = [];
        if (snapshot.exists()) {
            snapshot.forEach(childSnap => {
            const msg = childSnap.val();
            messages.push({
                id: childSnap.key,
                ...msg,
                timestamp: msg.timestamp || Date.now()
            });
            });
        }
        callback(messages);
        }, error => {
        console.error('Error subscribing to messages:', error);
        if (errorCallback) errorCallback(error);
        });

        return unsubscribe;
    }

    

    /**
     * Lấy tất cả chat rooms cho user dựa vào vai trò admin hoặc resident
     * userType phải là 'admin' hoặc 'resident'
     */
    getUserChatRooms(userId, userType, callback, errorCallback) {
        try {
            if (!userId || !userType) {
                throw new Error('userId and userType are required');
            }

            if (userType !== 'admin' && userType !== 'resident') {
                throw new Error('userType must be "admin" or "resident"');
            }

            // Mapping userType thành field trong db
            const userIdField = userType === 'admin' ? 'adminId' : 'residentId';

            const roomsRef = ref(database, 'chatRooms');

            const unsubscribe = onValue(roomsRef, (snapshot) => {
                const chatRooms = [];

                if (snapshot.exists()) {
                    snapshot.forEach((childSnapshot) => {
                        const roomId = childSnapshot.key;
                        const roomData = childSnapshot.val();

                        if (roomData[userIdField] === userId) {
                            chatRooms.push({
                                id: roomId,
                                ...roomData
                            });
                        }
                    });
                }

                chatRooms.sort((a, b) => {
                    const timeA = a.lastMessageTimestamp || a.createdAt || 0;
                    const timeB = b.lastMessageTimestamp || b.createdAt || 0;
                    return timeB - timeA;
                });

                callback(chatRooms);
            }, (error) => {
                console.error('Error getting user chat rooms:', error);
                if (errorCallback) {
                    errorCallback(error);
                }
            });

            return unsubscribe;
        } catch (error) {
            console.error('Error setting up chat rooms subscription:', error);
            if (errorCallback) {
                errorCallback(error);
            }
            throw error;
        }
    }


    async markMessagesAsRead(roomId, userId) {
        if (!roomId || !userId) throw new Error('roomId and userId are required');

        const roomRef = ref(database, `chatRooms/${roomId}`);
        const snapshot = await get(roomRef);

        if (!snapshot.exists()) throw new Error('Chat room not found');

        // Cập nhật lastRead cho user trong participants
        await update(ref(database, `chatRooms/${roomId}/participants/${userId}`), {
        lastRead: serverTimestamp()
        });

        // Đánh dấu tất cả tin nhắn của người kia là đã đọc
        const messagesRef = ref(database, `chatRooms/${roomId}/messages`);
        const messagesSnapshot = await get(messagesRef);

        if (messagesSnapshot.exists()) {
        const updates = {};
        messagesSnapshot.forEach(childSnap => {
            const msg = childSnap.val();
            if (msg.senderId !== userId && !msg.read) {
            updates[`${childSnap.key}/read`] = true;
            }
        });
        if (Object.keys(updates).length > 0) {
            await update(messagesRef, updates);
        }
        }
    }

    async getUnreadMessageCount(roomId, userId) {
        if (!roomId || !userId) throw new Error('roomId and userId are required');

        const messagesRef = ref(database, `chatRooms/${roomId}/messages`);
        const snapshot = await get(messagesRef);

        if (!snapshot.exists()) return 0;

        let count = 0;
        snapshot.forEach(childSnap => {
        const msg = childSnap.val();
        if (msg.senderId !== userId && !msg.read) count++;
        });
        return count;
    }
}

export default new ChatServices();