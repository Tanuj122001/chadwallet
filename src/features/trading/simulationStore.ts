import { create } from 'zustand';
import { TransactionSimulationDTO } from '../../core/api/SimulationDTOs';
import { TransactionDTO } from '../../core/api/TransactionDTOs';
import { serviceLocator } from '../../services';
import { logger } from '../../utils/logger';

export interface SimulationStoreState {
  activeSimulation: TransactionSimulationDTO | null;
  loading: boolean;
  error: string | null;

  runSimulation: (tx: TransactionDTO) => Promise<TransactionSimulationDTO>;
  resetSimulation: () => void;
}

export const useSimulationStore = create<SimulationStoreState>((set) => ({
  activeSimulation: null,
  loading: false,
  error: null,

  runSimulation: async (tx) => {
    set({ loading: true, error: null });
    try {
      const simRepo = serviceLocator.getSimulationRepository();
      const result = await simRepo.simulateAndValidate(tx);
      
      set({ activeSimulation: result, loading: false });
      logger.info(`[SimulationStore] Simulation complete for transaction: ${tx.transaction_id}`);
      return result;
    } catch (err: any) {
      set({ activeSimulation: null, loading: false, error: err.message });
      logger.error('[SimulationStore] Failed transaction preflight simulation', err);
      throw err;
    }
  },

  resetSimulation: () => {
    set({ activeSimulation: null, loading: false, error: null });
  },
}));

// RiskStore coordinates presentation parameters regarding freeze/mint authority risks
export interface RiskStoreState {
  upgradeableRisks: Record<string, 'low' | 'medium' | 'high'>;
  whaleConcentration: Record<string, number>;
  registerRiskData: (mint: string, upgradeable: 'low' | 'medium' | 'high', whale: number) => void;
}

export const useRiskStore = create<RiskStoreState>((set) => ({
  upgradeableRisks: {},
  whaleConcentration: {},

  registerRiskData: (mint, upgradeable, whale) => {
    set(state => ({
      upgradeableRisks: { ...state.upgradeableRisks, [mint]: upgradeable },
      whaleConcentration: { ...state.whaleConcentration, [mint]: whale },
    }));
  },
}));

// MevStore tracks sandbox and frontrun warning conditions
export interface MevStoreState {
  mevRiskLevel: Record<string, number>;
  jitoBundleActive: Record<string, boolean>;
  registerMevMetrics: (txId: string, riskScore: number, jitoActive: boolean) => void;
}

export const useMevStore = create<MevStoreState>((set) => ({
  mevRiskLevel: {},
  jitoBundleActive: {},

  registerMevMetrics: (txId, riskScore, jitoActive) => {
    set(state => ({
      mevRiskLevel: { ...state.mevRiskLevel, [txId]: riskScore },
      jitoBundleActive: { ...state.jitoBundleActive, [txId]: jitoActive },
    }));
  },
}));
