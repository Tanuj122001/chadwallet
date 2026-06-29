import { create } from 'zustand';

export interface UiState {
  actionsSheetVisible: boolean;
  filterSheetVisible: boolean;
  notificationsSheetVisible: boolean;
  profileSheetVisible: boolean;
  aiCopilotVisible: boolean;
  searchFocused: boolean;

  setActionsSheetVisible: (visible: boolean) => void;
  setFilterSheetVisible: (visible: boolean) => void;
  setNotificationsSheetVisible: (visible: boolean) => void;
  setProfileSheetVisible: (visible: boolean) => void;
  setAiCopilotVisible: (visible: boolean) => void;
  setSearchFocused: (focused: boolean) => void;
}

export const useUiStore = create<UiState>((set) => ({
  actionsSheetVisible: false,
  filterSheetVisible: false,
  notificationsSheetVisible: false,
  profileSheetVisible: false,
  aiCopilotVisible: false,
  searchFocused: false,

  setActionsSheetVisible: (visible) => set({ actionsSheetVisible: visible }),
  setFilterSheetVisible: (visible) => set({ filterSheetVisible: visible }),
  setNotificationsSheetVisible: (visible) => set({ notificationsSheetVisible: visible }),
  setProfileSheetVisible: (visible) => set({ profileSheetVisible: visible }),
  setAiCopilotVisible: (visible) => set({ aiCopilotVisible: visible }),
  setSearchFocused: (focused) => set({ searchFocused: focused }),
}));

export default useUiStore;
