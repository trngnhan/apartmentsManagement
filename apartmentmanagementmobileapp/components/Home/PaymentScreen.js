import React, { useState, useEffect } from 'react';
import { View, ScrollView, Alert } from 'react-native';
import { Card, Title, Paragraph, Button, ActivityIndicator, Text } from 'react-native-paper';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import MyStyles from '../../styles/MyStyles';

const PaymentScreen = () => {
  const [categories, setCategories] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [submittedPaymentIds, setSubmittedPaymentIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Lỗi', 'Không tìm thấy token. Vui lòng đăng nhập lại.');
        return;
      }

      // Lấy danh sách khoản phí
      // const categoriesResponse = await axios.get('http://192.168.44.106:8000/paymentcategories/', {
      const categoriesResponse = await axios.get('http://192.168.44.103:8000/paymentcategories/', {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Lấy danh sách giao dịch
      // const transactionsResponse = await axios.get('http://192.168.44.106:8000/paymenttransactions/my-payments/', {
      const transactionsResponse = await axios.get('http://192.168.44.103:8000/paymenttransactions/my-payments/', {
        headers: { Authorization: `Bearer ${token}` },
      });

      setCategories(categoriesResponse.data);
      setTransactions(transactionsResponse.data);

      // Cập nhật danh sách khoản phí đã thanh toán (dựa trên chu kỳ)
      const now = new Date();
      const paidIds = new Set();
      transactionsResponse.data.forEach(tx => {
        if (tx.status === 'COMPLETED' || tx.status === 'SUCCESS') {
          const paidDate = new Date(tx.paid_date);
          const isMonthly = categoriesResponse.data.find(c => c.id === tx.category.id)?.frequency === 'MONTHLY';
          // Chỉ coi là đã thanh toán nếu trong cùng tháng (cho MONTHLY)
          if (!isMonthly || (paidDate.getMonth() === now.getMonth() && paidDate.getFullYear() === now.getFullYear())) {
            paidIds.add(tx.category.id);
          }
        }
      });
      setSubmittedPaymentIds(paidIds);

      console.log('Categories:', categoriesResponse.data);
      console.log('Transactions:', transactionsResponse.data);
      console.log('Submitted Payment IDs:', Array.from(paidIds));
    } catch (error) {
      console.error('Lỗi khi tải dữ liệu:', error.response?.data || error.message);
      Alert.alert('Lỗi', 'Không thể tải danh sách khoản phí hoặc giao dịch');
    } finally {
      setLoading(false);
    }
  };

  // Làm mới khi màn hình focus
  useFocusEffect(
    React.useCallback(() => {
      fetchData();
    }, [])
  );

  const renderCategory = ({ item }) => {
    const isSubmitted = submittedPaymentIds.has(item.id);
    return (
      <Card key={item.id} style={{ marginBottom: 16 }}>
        <Card.Content>
          <Title style={{ color: isSubmitted ? '#888' : '#000' }}>{item.name}</Title>
          <Paragraph style={{ color: isSubmitted ? '#888' : '#000' }}>
            Số tiền: {item.amount.toLocaleString('vi-VN')} VND
          </Paragraph>
          <Paragraph style={{ color: isSubmitted ? '#888' : '#000' }}>
            Tần suất: {item.frequency}
          </Paragraph>
          {isSubmitted && item.is_recurring && (
            <Text style={{ marginTop: 8, fontStyle: 'italic', color: 'green' }}>
              Đã thanh toán cho chu kỳ này
            </Text>
          )}
          {isSubmitted && !item.is_recurring && (
            <Text style={{ marginTop: 8, fontStyle: 'italic', color: 'green' }}>
              Đã thanh toán
            </Text>
          )}
        </Card.Content>
        {!isSubmitted && (
          <Card.Actions>
            <Button
              mode="contained"
              onPress={() => {
                console.log('Navigating to PaymentDetailScreen with:', { categoryId: item.id, categoryName: item.name, amount: item.amount });
                navigation.navigate('PaymentDetailScreen', {
                  categoryId: item.id,
                  categoryName: item.name,
                  amount: item.amount,
                });
              }}
              style={{ marginTop: 8 }}
            >
              Thanh toán
            </Button>
          </Card.Actions>
        )}
      </Card>
    );
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <Title style={MyStyles.text}>Danh sách khoản phí</Title>
      {loading && <ActivityIndicator size="large" color="#0000ff" />}
      {categories.length === 0 && !loading ? (
        <Text>Không có khoản phí nào</Text>
      ) : (
        categories.map(item => renderCategory({ item }))
      )}
    </ScrollView>
  );
};

export default PaymentScreen;
