import React, { useState } from 'react';
import { View, Modal, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { AppText } from './AppText';
import { PrimaryButton } from './PrimaryButton';
import { SecondaryButton } from './SecondaryButton';
import { toast } from './ToastManager';

export interface FilterSheetProps {
  visible: boolean;
  onClose: () => void;
  onApplyFilters?: (sort: string, filters: string[]) => void;
}

const SORT_OPTIONS = [
  { id: 'mcap', label: 'Market Cap' },
  { id: 'volume', label: 'Volume' },
  { id: 'liquidity', label: 'Liquidity' },
  { id: 'price', label: 'Price' },
  { id: 'change', label: '24H Change' },
];

const FILTER_CATEGORIES = [
  'Verified', 'Meme', 'AI', 'Gaming', 'NFT', 'Stablecoin', 'DeFi'
];

export const FilterSheet: React.FC<FilterSheetProps> = ({ visible, onClose, onApplyFilters }) => {
  const [selectedSort, setSelectedSort] = useState('mcap');
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);

  const toggleFilter = (category: string) => {
    if (selectedFilters.includes(category)) {
      setSelectedFilters(selectedFilters.filter(item => item !== category));
    } else {
      setSelectedFilters([...selectedFilters, category]);
    }
  };

  const handleApply = () => {
    onClose();
    if (onApplyFilters) {
      onApplyFilters(selectedSort, selectedFilters);
    } else {
      toast.success(`Applied filters successfully.`);
    }
  };

  const handleReset = () => {
    setSelectedSort('mcap');
    setSelectedFilters([]);
    toast.info('Filters reset to default.');
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <TouchableOpacity activeOpacity={1} onPress={onClose} style={styles.modalOverlay}>
        <View style={styles.sheetContainer} className="bg-surface border-t border-borderAlpha rounded-t-3xl p-5">
          {/* Header Drag Handle */}
          <View className="items-center mb-4">
            <View className="w-12 h-1.5 bg-borderAlpha rounded-full" />
          </View>

          <AppText variant="body" weight="bold" className="text-white text-center mb-6">
            Filter & Sort Market Assets
          </AppText>

          <ScrollView showsVerticalScrollIndicator={false} className="mb-6">
            {/* Sort Options */}
            <AppText variant="caption" weight="bold" color="secondary" className="mb-3 uppercase tracking-wider">
              Sort By
            </AppText>
            <View className="flex-row flex-wrap gap-2 mb-6">
              {SORT_OPTIONS.map(opt => {
                const isSelected = selectedSort === opt.id;
                return (
                  <TouchableOpacity
                    key={opt.id}
                    onPress={() => setSelectedSort(opt.id)}
                    className={`px-4 py-2 rounded-radius-full border ${
                      isSelected ? 'bg-primary border-primary' : 'bg-surfaceHover border-borderAlpha'
                    }`}
                    activeOpacity={0.88}
                  >
                    <AppText
                      variant="caption"
                      weight="bold"
                      className={isSelected ? 'text-slate-900' : 'text-textSecondary'}
                    >
                      {opt.label}
                    </AppText>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Filter categories */}
            <AppText variant="caption" weight="bold" color="secondary" className="mb-3 uppercase tracking-wider">
              Categories
            </AppText>
            <View className="flex-row flex-wrap gap-2">
              {FILTER_CATEGORIES.map(cat => {
                const isSelected = selectedFilters.includes(cat);
                return (
                  <TouchableOpacity
                    key={cat}
                    onPress={() => toggleFilter(cat)}
                    className={`px-4 py-2 rounded-radius-full border ${
                      isSelected ? 'bg-primary border-primary' : 'bg-surfaceHover border-borderAlpha'
                    }`}
                    activeOpacity={0.88}
                  >
                    <AppText
                      variant="caption"
                      weight="bold"
                      className={isSelected ? 'text-slate-900' : 'text-textSecondary'}
                    >
                      {cat}
                    </AppText>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View className="flex-row justify-between mt-auto">
            <View className="w-[48%]">
              <SecondaryButton title="Reset Filters" onPress={handleReset} />
            </View>
            <View className="w-[48%]">
              <PrimaryButton title="Apply Filters" onPress={handleApply} />
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(3, 7, 18, 0.75)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    maxHeight: '75%',
  },
});

export default FilterSheet;
