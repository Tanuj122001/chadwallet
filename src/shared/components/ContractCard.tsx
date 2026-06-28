import React, { useMemo, useState } from 'react';
import { View, TouchableOpacity } from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
import { AppText } from './AppText';

export interface ContractCardProps {
  address: string;
  className?: string;
}

export const ContractCard: React.FC<ContractCardProps> = React.memo(
  ({ address, className = '' }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
      Clipboard.setString(address);

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    };

    const truncatedAddress = useMemo(() => {
      if (address.length <= 12) return address;

      return `${address.slice(0, 6)}...${address.slice(-6)}`;
    }, [address]);

    return (
      <View
        className={`flex-row items-center justify-between bg-[#16171F] border border-[#2A2D39] rounded-[20px] p-4 ${className}`}
      >
        <View className="flex-row items-center flex-1 pr-2">
          <AppText className="text-[#8D94A7] text-[13px] font-medium mr-3">
            Contract
          </AppText>

          <AppText
            className="text-white text-[14px] font-mono font-bold"
            numberOfLines={1}
          >
            {truncatedAddress}
          </AppText>
        </View>

        <TouchableOpacity
          activeOpacity={0.8}
          className="w-9 h-9 rounded-full bg-[#1B1D25] border border-[#2A2D39] items-center justify-center"
          onPress={handleCopy}
        >
          {copied ? (
            <FontAwesome6
              name="check"
              size={16}
              color="#22F27C"
              iconStyle="solid"
            />
          ) : (
            <FontAwesome6
              name="copy"
              size={16}
              color="#8D94A7"
              iconStyle="regular"
            />
          )}
        </TouchableOpacity>
      </View>
    );
  }
);

export default ContractCard;