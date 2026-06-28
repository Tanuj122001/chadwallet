import { localStorage, secureStorage } from '../../core/storage';
import { UserDTO, WalletDTO } from '../../core/api/dtos';
import { TradeSettings } from '../../core/models';

export interface ILocalDataSource {
  saveUser(user: UserDTO): Promise<void>;
  getUser(): Promise<UserDTO | null>;
  clearUser(): Promise<void>;
  saveWallets(wallets: WalletDTO[]): Promise<void>;
  getWallets(): Promise<WalletDTO[]>;
  saveSettings(settings: TradeSettings): void;
  getSettings(): TradeSettings | null;
}

export class LocalDataSourceImpl implements ILocalDataSource {
  private readonly USER_KEY = 'cached_user';
  private readonly WALLETS_KEY = 'secure_wallets';
  private readonly SETTINGS_KEY = 'app_trade_settings';

  public async saveUser(user: UserDTO): Promise<void> {
    await secureStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  public async getUser(): Promise<UserDTO | null> {
    const val = await secureStorage.getItem(this.USER_KEY);
    return val ? JSON.parse(val) : null;
  }

  public async clearUser(): Promise<void> {
    await secureStorage.removeItem(this.USER_KEY);
  }

  public async saveWallets(wallets: WalletDTO[]): Promise<void> {
    await secureStorage.setItem(this.WALLETS_KEY, JSON.stringify(wallets));
  }

  public async getWallets(): Promise<WalletDTO[]> {
    const val = await secureStorage.getItem(this.WALLETS_KEY);
    return val ? JSON.parse(val) : [];
  }

  public saveSettings(settings: TradeSettings): void {
    localStorage.setString(this.SETTINGS_KEY, JSON.stringify(settings));
  }

  public getSettings(): TradeSettings | null {
    const val = localStorage.getString(this.SETTINGS_KEY);
    return val ? JSON.parse(val) : null;
  }
}
