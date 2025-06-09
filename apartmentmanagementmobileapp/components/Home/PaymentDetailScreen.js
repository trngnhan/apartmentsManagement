import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Button, Alert, ActivityIndicator, Linking, Image, Platform } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import MyStyles from '../../styles/MyStyles';

const Storage = {
  getItem: async (key) => {
    try {
      if (Platform.OS === 'web') {
        return localStorage.getItem(key);
      }
      return await AsyncStorage.getItem(key);
    } catch (e) {
      console.error('Storage getItem error:', e.toString());
      return null;
    }
  },
};

const PaymentDetailScreen = ({ route }) => {
  const { categoryId, categoryName, amount } = route.params;
  const [loading, setLoading] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState(null);
  const [imageError, setImageError] = useState(false);
  const [transactionId, setTransactionId] = useState(null);
  const [isPolling, setIsPolling] = useState(false);
  const [lastStatus, setLastStatus] = useState(null);
  const navigation = useNavigation();
  const intervalRef = useRef(null);
  const timeoutRef = useRef(null);

  const initiatePayment = async () => {
    setLoading(true);
    setImageError(false);
    try {
      const token = await Storage.getItem('token');
      console.log('Retrieved token:', token);
      if (!token) {
        Alert.alert('Lỗi', 'Không tìm thấy token. Vui lòng đăng nhập lại.');
        return;
      }
      console.log('categoryId:', categoryId, 'categoryName:', categoryName, 'amount:', amount);
      // const url = `http://192.168.44.103:8000/paymenttransactions/${categoryId}/create-momo-payment/`;
      const url = `http://192.168.44.103:8000/paymenttransactions/${categoryId}/create-momo-payment/`;
      console.log('Calling URL:', url);
      const response = await axios.post(
        url,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log('API Response:', JSON.stringify(response.data, null, 2));
      const { qrCodeUrl } = response.data.momo_response;
      const { transaction_id } = response.data.transaction;

      if (qrCodeUrl && typeof qrCodeUrl === 'string') {
        console.log('QR Code URL:', qrCodeUrl);
        const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrCodeUrl)}`;
        console.log('QR Image URL:', qrImageUrl);
        setQrCodeUrl(qrImageUrl);
        setTransactionId(transaction_id);
        setIsPolling(true);
      } else {
        console.error('Invalid QR Code URL:', qrCodeUrl);
        Alert.alert('Lỗi', 'Không nhận được QR Code hợp lệ từ server');
        setQrCodeUrl(null);
      }
    } catch (error) {
      const errorMessage = error.response?.data?.detail || error.message;
      console.error('Lỗi khi tạo mã QR:', errorMessage, error.response?.status);
      Alert.alert('Lỗi', `Khởi tạo thanh toán thất bại: ${errorMessage}`);
      setQrCodeUrl(null);
    } finally {
      setLoading(false);
    }
  };

  const updateTransactionStatus = async (transactionId, resultCode) => {
    try {
      const token = await Storage.getItem('token');
      if (!token) {
        console.error('No token for updating transaction');
        Alert.alert('Lỗi', 'Không tìm thấy token.');
        return;
      }
      console.log(`Updating transaction ${transactionId} with resultCode ${resultCode}`);
      const response = await axios.post(
        // `http://192.168.44.103:8000/paymenttransactions/update-status/`,
        `http://192.168.44.103:8000/paymenttransactions/update-status/`,
        { transaction_id: transactionId, result_code: resultCode },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log(`Update response: ${JSON.stringify(response.data)}`);
    } catch (error) {
      console.error('Error updating transaction status:', error.response?.data || error.message);
      Alert.alert('Lỗi', 'Không thể cập nhật trạng thái giao dịch.');
    }
  };

  // Polling với retry và timeout
  useEffect(() => {
    const maxRetries = 5;
    let retryCount = 0;
    const POLLING_TIMEOUT = 5 * 60 * 1000; // 5 phút

    const pollTransactionStatus = async () => {
      if (!isPolling) {
        console.log('Polling stopped');
        return;
      }
      try {
        const token = await Storage.getItem('token');
        if (!token) {
          console.error('No token for polling');
          Alert.alert('Lỗi', 'Không tìm thấy token. Vui lòng đăng nhập lại.');
          setIsPolling(false);
          if (intervalRef.current) clearInterval(intervalRef.current);
          if (timeoutRef.current) clearTimeout(timeoutRef.current);
          return;
        }
        const response = await axios.get(
          // `http://192.168.44.103:8000/paymenttransactions/transaction/${transactionId}/`,
          `http://192.168.44.103:8000/paymenttransactions/transaction/${transactionId}/`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const transaction = response.data;
        console.log('Polling for transactionId:', transactionId, 'status:', transaction.status);
        if (transaction && transaction.status !== lastStatus) {
          console.log('Transaction status:', transaction.status, 'details:', JSON.stringify(transaction, null, 2));
          setLastStatus(transaction.status);
          if (transaction.status === 'COMPLETED' || transaction.status === 'SUCCESS') {
            setIsPolling(false);
            if (intervalRef.current) clearInterval(intervalRef.current);
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            Alert.alert('Thành công', 'Thanh toán hoàn tất!', [
              {
                text: 'OK',
                onPress: () => {
                  setQrCodeUrl(null);
                  setTransactionId(null);
                  navigation.navigate('PaymentScreen');
                },
              },
            ]);
          } else if (transaction.status === 'FAILED') {
            setIsPolling(false);
            if (intervalRef.current) clearInterval(intervalRef.current);
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            Alert.alert('Lỗi', 'Thanh toán thất bại');
          }
        }
        retryCount = 0;
      } catch (error) {
        console.error('Poll error:', error.response?.data || error.message);
        retryCount++;
        if (retryCount >= maxRetries) {
          setIsPolling(false);
          if (intervalRef.current) clearInterval(intervalRef.current);
          if (timeoutRef.current) clearTimeout(timeoutRef.current);
          Alert.alert('Lỗi', 'Không thể kiểm tra trạng thái giao dịch');
        }
      }
    };

    if (transactionId && qrCodeUrl && isPolling) {
      console.log('Starting polling for transactionId:', transactionId);
      intervalRef.current = setInterval(pollTransactionStatus, 5000);
      timeoutRef.current = setTimeout(() => {
        setIsPolling(false);
        if (intervalRef.current) clearInterval(intervalRef.current);
        Alert.alert('Hết thời gian', 'Không nhận được phản hồi từ MoMo. Vui lòng kiểm tra lại.');
      }, POLLING_TIMEOUT);
    }

    return () => {
      console.log('Cleaning up polling interval and timeout');
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [transactionId, qrCodeUrl, isPolling]);

  // Xử lý deep link
  useEffect(() => {
    const handleDeepLink = async ({ url }) => {
      console.log('Deep link received:', url);
      if (!url || !url.includes('apartmentmanagement://payment-callback')) return;
      try {
        const params = new URLSearchParams(url.split('?')[1]);
        const resultCode = params.get('resultCode');
        console.log('Result code:', resultCode);
        if (resultCode === '0' && transactionId) {
          await updateTransactionStatus(transactionId, resultCode);
          setIsPolling(false);
          if (intervalRef.current) clearInterval(intervalRef.current);
          if (timeoutRef.current) clearTimeout(timeoutRef.current);
          Alert.alert('Thành công', 'Thanh toán hoàn tất!', [
            {
              text: 'OK',
              onPress: () => {
                setQrCodeUrl(null);
                setTransactionId(null);
                navigation.navigate('PaymentScreen');
              },
            },
          ]);
        } else {
          setIsPolling(false);
          if (intervalRef.current) clearInterval(intervalRef.current);
          if (timeoutRef.current) clearTimeout(timeoutRef.current);
          Alert.alert('Lỗi', `Thanh toán thất bại: resultCode ${resultCode}`);
        }
      } catch (e) {
        console.error('Lỗi xử lý deep link:', e.toString());
        Alert.alert('Lỗi', 'Không thể xử lý deep link');
      }
    };

    const listener = Linking.addEventListener('url', handleDeepLink);
    Linking.getInitialURL().then(url => {
      if (url) {
        console.log('Initial deep link:', url);
        handleDeepLink({ url });
      }
    });

    return () => {
      console.log('Cleaning up deep link listener');
      listener.remove();
    };
  }, [navigation, transactionId]);

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Text style={[MyStyles.sectionTitle, { marginBottom: 10 }]}>Thanh toán phí</Text>
      <Text style={{ fontSize: 18, fontWeight: 'bold' }}>Khoản phí: {categoryName}</Text>
      <Text style={{ fontSize: 16, marginVertical: 10 }}>
        Số tiền: {amount.toLocaleString('vi-VN')} VND
      </Text>
      <Button
        title={loading ? "Đang xử lý..." : "Thanh toán MoMo"}
        onPress={initiatePayment}
        disabled={loading}
        color="#FF6F61"
      />
      {loading && <ActivityIndicator size="large" color="#0000ff" style={{ marginTop: 20 }} />}
      {qrCodeUrl && !imageError ? (
        <View style={{ alignItems: 'center', marginTop: 20 }}>
          <Image
            key={qrCodeUrl}
            source={{ uri: qrCodeUrl }}
            style={{ width: 200, height: 200, backgroundColor: '#f0f0f0' }}
            resizeMode="contain"
            onError={(e) => {
              console.error('Image load error:', e.nativeEvent.error);
              setImageError(true);
              Alert.alert('Lỗi', 'Không thể tải mã QR');
            }}
            onLoad={() => console.log('QR Code image loaded successfully')}
          />
          <Text style={{ marginTop: 10, textAlign: 'center' }}>
            Quét mã QR bằng ứng dụng MoMo Test để thanh toán
          </Text>
        </View>
      ) : qrCodeUrl && imageError ? (
        <Text style={{ marginTop: 20, color: 'red', textAlign: 'center' }}>
          Lỗi: Không thể hiển thị mã QR
        </Text>
      ) : null}
    </View>
  );
};

export default PaymentDetailScreen;
