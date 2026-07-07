import React, { useState, useEffect } from 'react';
import { View, Modal, TouchableOpacity, TextInput, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from './AppText';
import { Card } from './Card';
import { useAIStore } from '../../features/ai/aiStore';
import { colors } from '../theme/colors';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';

export interface AiCopilotModalProps {
  visible: boolean;
  onClose: () => void;
}

const SUGGESTED_PROMPTS = [
  'What is my sector concentration?',
  'Scan SOL smart contract safety',
  'Find Raydium swap arbitrage',
];

export const AiCopilotModal: React.FC<AiCopilotModalProps> = ({ visible, onClose }) => {
  const insets = useSafeAreaInsets();
  const { activeConversation, askCopilot, fetchConversation, loading } = useAIStore();
  const [input, setInput] = useState('');
  const conversationId = 'conv_release_candidate_default';
  const scrollViewRef = React.useRef<ScrollView>(null);

  useEffect(() => {
    if (visible) {
      fetchConversation(conversationId);
    }
  }, [visible, fetchConversation]);

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim()) return;
    setInput('');
    await askCopilot(conversationId, textToSend, '9xQ3Z2W6h8U7P7r5e6F4t6r8P7Q7e5F6t6r8P7Q7e5');
  };

  const messages = activeConversation && activeConversation.messages.length > 0
    ? activeConversation.messages
    : [
        {
          message_id: 'welcome',
          role: 'assistant' as const,
          content: 'Welcome to ChadWallet Copilot node. Ask me anything about Solana liquidity pools, MEV risk protective rules, or sector asset configurations.',
          timestamp: Date.now(),
        },
      ];

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View className="flex-1 bg-background/80 justify-end">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="h-[80%] bg-surface border-t border-borderAlpha rounded-t-3xl"
        >
          {/* Header */}
          <View className="flex-row items-center justify-between px-5 py-4 border-b border-borderAlpha">
            <View className="flex-row items-center">
              <View className="w-8 h-8 bg-accent/20 items-center justify-center rounded-lg mr-2">
                <FontAwesome6 name="wand-magic-sparkles" size={16} color={colors.accent} iconStyle="solid" />
              </View>
              <View>
                <AppText variant="body" weight="bold">
                  AI Copilot Node
                </AppText>
                <AppText variant="caption" color="secondary">
                  Active Security Analyzer
                </AppText>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} className="p-2" accessibilityLabel="Close Copilot">
              <FontAwesome6 name="xmark" size={20} color={colors.textSecondary} iconStyle="solid" />
            </TouchableOpacity>
          </View>

          {/* Chat area */}
          <ScrollView
            ref={scrollViewRef}
            className="flex-1 px-5 py-4"
            contentContainerStyle={{ paddingBottom: 24 }}
            onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
          >
            {messages.map((msg, index) => {
              const isUser = msg.role === 'user';
              return (
                <View
                  key={index}
                  className={`flex-row mb-4 ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  {!isUser && (
                    <View className="w-8 h-8 bg-accent/20 items-center justify-center rounded-full mr-2 self-end">
                      <FontAwesome6 name="robot" size={12} color={colors.accent} iconStyle="solid" />
                    </View>
                  )}
                  <Card
                    className={`max-w-[75%] p-space-md rounded-2xl ${
                      isUser ? 'bg-accent/10 border-accent/20' : 'bg-surfaceHover border-borderAlpha'
                    }`}
                  >
                    <AppText variant="bodySm" color="primary">
                      {msg.content}
                    </AppText>
                  </Card>
                </View>
              );
            })}

            {/* Loading / Typing indicator */}
            {loading && (
              <View className="flex-row items-center mb-4">
                <View className="w-8 h-8 bg-accent/20 items-center justify-center rounded-full mr-2">
                  <FontAwesome6 name="robot" size={12} color={colors.accent} iconStyle="solid" />
                </View>
                <Card className="bg-surfaceHover border-borderAlpha p-space-md rounded-2xl">
                  <ActivityIndicator size="small" color={colors.accent} />
                </Card>
              </View>
            )}
          </ScrollView>

          {/* Suggestion Prompt pills */}
          <View className="px-5 py-2 border-t border-borderAlpha/45">
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row py-1">
              {SUGGESTED_PROMPTS.map((prompt, i) => (
                <TouchableOpacity
                  key={i}
                  onPress={() => handleSend(prompt)}
                  className="bg-surfaceHover border border-borderAlpha px-3 py-1.5 rounded-radius-full mr-2"
                  activeOpacity={0.88}
                >
                  <AppText variant="caption" color="secondary" weight="semibold">
                    {prompt}
                  </AppText>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Input control block */}
          <View className="flex-row items-center px-5 border-t border-borderAlpha bg-surface" style={{ paddingTop: 12, paddingBottom: 12 + insets.bottom }}>
            <TextInput
              className="flex-1 text-white text-[15px] font-medium h-12 bg-surfaceHover border border-borderAlpha rounded-radius-xl px-4 py-0"
              placeholder="Ask Copilot..."
              placeholderTextColor={colors.textMuted}
              value={input}
              onChangeText={setInput}
              style={{ textAlignVertical: 'center' }}
              accessibilityLabel="Chat prompt input"
            />
            <TouchableOpacity
              onPress={() => handleSend(input)}
              className="w-12 h-12 bg-accent items-center justify-center rounded-radius-xl ml-3"
              activeOpacity={0.88}
              accessibilityLabel="Send message"
            >
              <FontAwesome6 name="arrow-up" size={18} color="#080A0C" iconStyle="solid" />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};
