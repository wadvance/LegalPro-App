import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform,
} from 'react-native';
import { getChatbotResponse, sendWhatsAppMessage } from '../services/whatsapp';
import Card from '../components/Card';
import Header from '../components/Header';
import HeaderComponent from '../components/Header';
import { SIZES } from '../utils/theme';
import { useTheme } from '../context/ThemeContext';

const initialMessages = [
  { id: '0', text: '🤖 ¡Hola! Soy el asistente virtual de *Bufete de Abogados*. ¿En qué puedo ayudarle hoy?', sender: 'bot', timestamp: new Date() },
  { id: '1', text: 'Puede preguntarme sobre:\n📅 Citas\n⚖️ Casos\n💰 Cobros\n📋 Horarios\n👔 Abogados', sender: 'bot', timestamp: new Date() },
];

const quickReplies = [
  'Horarios', 'Dirección', 'Agendar cita',
  'Información de cobros', 'Estado de expediente', 'Equipo de abogados',
];

const ChatbotScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [showPhoneInput, setShowPhoneInput] = useState(false);
  const flatListRef = useRef(null);

  const handleSend = async (text) => {
    const messageText = text || input;
    if (!messageText.trim()) return;

    const userMsg = {
      id: Date.now().toString(),
      text: messageText,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');

    setTimeout(async () => {
      const response = await getChatbotResponse(messageText);
      const botMsg = {
        id: (Date.now() + 1).toString(),
        text: response,
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMsg]);
    }, 500);
  };

  const handleSendWhatsApp = async () => {
    if (!phoneNumber || !input) return;
    const result = await sendWhatsAppMessage(phoneNumber, input);
    if (result.success) {
      const msg = {
        id: Date.now().toString(),
        text: `✅ Mensaje enviado vía WhatsApp a ${phoneNumber}: "${input}"`,
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, msg]);
      setPhoneNumber('');
      setShowPhoneInput(false);
    } else {
      const msg = {
        id: Date.now().toString(),
        text: `⚠️ No se pudo enviar el mensaje: ${result.error}`,
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, msg]);
    }
  };

  const renderMessage = ({ item }) => (
    <View style={[styles.messageContainer, item.sender === 'user'
      ? [styles.userMessage, { backgroundColor: colors.primary }]
      : [styles.botMessage, { backgroundColor: colors.surface, borderColor: colors.border }]
    ]}>
      <Text style={[styles.messageText, { color: colors.text }, item.sender === 'user' && { color: colors.textLight }]}>
        {item.text}
      </Text>
      <Text style={[styles.timestamp, { color: colors.disabled }]}>
        {item.timestamp.toLocaleTimeString('es-PA', { hour: '2-digit', minute: '2-digit' })}
      </Text>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <HeaderComponent
        title="Chatbot WhatsApp"
        subtitle="Asistente Virtual"
        onBack={() => navigation.goBack()}
        rightAction={() => setShowPhoneInput(!showPhoneInput)}
        rightIcon="📞"
      />

      {showPhoneInput && (
        <View style={[styles.whatsappBar, { backgroundColor: colors.success + '10', borderBottomColor: colors.border }]}>
          <TextInput style={[styles.phoneInput, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
            placeholder="Teléfono destino (ej: +50760000000)"
            placeholderTextColor={colors.disabled}
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            keyboardType="phone-pad"
          />
          <TouchableOpacity style={[styles.whatsappSendBtn, { backgroundColor: colors.success }]} onPress={handleSendWhatsApp}>
            <Text style={[styles.whatsappSendText, { color: colors.textLight }]}>Enviar</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        ListHeaderComponent={
          <View style={styles.quickRepliesContainer}>
            <Text style={[styles.quickTitle, { color: colors.textSecondary }]}>Consultas rápidas:</Text>
            <View style={styles.quickGrid}>
              {quickReplies.map((qr) => (
                <TouchableOpacity key={qr} style={[styles.quickChip, { backgroundColor: colors.primary + '12', borderColor: colors.primary + '30' }]}
                  onPress={() => handleSend(qr)}>
                  <Text style={[styles.quickChipText, { color: colors.primary }]}>{qr}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        }
      />

      <View style={[styles.inputBar, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        <TextInput
          style={[styles.chatInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
            placeholder="Escriba su mensaje..."
            placeholderTextColor={colors.disabled}
            value={input}
            onChangeText={setInput}
            multiline={false}
            onSubmitEditing={() => handleSend()}
          />
          <TouchableOpacity style={[styles.sendBtn, { backgroundColor: colors.primary }]} onPress={() => handleSend()}>
            <Text style={[styles.sendBtnText, { color: colors.textLight }]}>Enviar</Text>
          </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  messagesList: { padding: SIZES.padding, paddingBottom: 10 },
  messageContainer: {
    maxWidth: '80%',
    marginBottom: 12,
    padding: 12,
    borderRadius: 16,
  },
  userMessage: {
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  botMessage: {
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
  },
  messageText: { fontSize: SIZES.md, lineHeight: 22 },
  timestamp: { fontSize: SIZES.xs, marginTop: 4, alignSelf: 'flex-end' },
  quickRepliesContainer: { marginBottom: 15 },
  quickTitle: { fontSize: SIZES.sm, marginBottom: 8, fontWeight: '500' },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  quickChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1,
  },
  quickChipText: { fontSize: SIZES.xs, fontWeight: '500' },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
  },
  chatInput: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    height: 42,
    fontSize: SIZES.md,
    borderWidth: 1,
  },
  sendBtn: {
    borderRadius: 20,
    paddingHorizontal: 18,
    height: 42,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendBtnText: { fontSize: SIZES.sm, fontWeight: '600' },
  whatsappBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  phoneInput: {
    flex: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 40,
    fontSize: SIZES.sm,
    borderWidth: 1,
  },
  whatsappSendBtn: {
    borderRadius: 10,
    paddingHorizontal: 14,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  whatsappSendText: { fontSize: SIZES.sm, fontWeight: '600' },
});

export default ChatbotScreen;
