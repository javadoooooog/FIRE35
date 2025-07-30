import { create } from 'zustand';
import { Asset, AssetType, YieldRecord, AssetSummary, AssetFormData } from '../types';

interface AssetStore {
  // 状态
  assets: Asset[];
  yieldRecords: YieldRecord[];
  loading: boolean;
  
  // 操作方法
  addAsset: (assetData: AssetFormData) => void;
  updateAsset: (id: string, assetData: Partial<AssetFormData>) => void;
  deleteAsset: (id: string) => void;
  calculateYield: (assetId: string) => void;
  calculateAllYields: () => void;
  getAssetSummary: () => AssetSummary;
  loadData: () => void;
  saveData: () => void;
}

// 生成唯一ID
const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// 计算复利收益
const calculateCompoundInterest = (principal: number, rate: number, days: number): number => {
  const dailyRate = rate / 365 / 100;
  return principal * Math.pow(1 + dailyRate, days);
};

// 计算投资天数
const getDaysBetween = (startDate: string, endDate: string): number => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export const useAssetStore = create<AssetStore>((set, get) => ({
  assets: [],
  yieldRecords: [],
  loading: false,

  addAsset: (assetData: AssetFormData) => {
    const newAsset: Asset = {
      id: generateId(),
      name: assetData.name,
      type: assetData.type,
      initialAmount: assetData.initialAmount,
      currentValue: assetData.initialAmount,
      interestRate: assetData.interestRate,
      investmentDate: assetData.investmentDate,
      lastUpdated: new Date().toISOString(),
      description: assetData.description
    };

    set((state) => ({
      assets: [...state.assets, newAsset]
    }));
    
    get().saveData();
  },

  updateAsset: (id: string, assetData: Partial<AssetFormData>) => {
    set((state) => ({
      assets: state.assets.map(asset => 
        asset.id === id 
          ? { 
              ...asset, 
              ...assetData,
              lastUpdated: new Date().toISOString()
            }
          : asset
      )
    }));
    
    get().saveData();
  },

  deleteAsset: (id: string) => {
    set((state) => ({
      assets: state.assets.filter(asset => asset.id !== id),
      yieldRecords: state.yieldRecords.filter(record => record.assetId !== id)
    }));
    
    get().saveData();
  },

  calculateYield: (assetId: string) => {
    const { assets, yieldRecords } = get();
    const asset = assets.find(a => a.id === assetId);
    
    if (!asset) return;

    const today = new Date().toISOString().split('T')[0];
    const daysSinceInvestment = getDaysBetween(asset.investmentDate, today);
    
    const newValue = calculateCompoundInterest(
      asset.initialAmount,
      asset.interestRate,
      daysSinceInvestment
    );

    const yieldAmount = newValue - asset.currentValue;
    const yieldRate = asset.currentValue > 0 ? (yieldAmount / asset.currentValue) * 100 : 0;

    // 更新资产当前价值
    set((state) => ({
      assets: state.assets.map(a => 
        a.id === assetId 
          ? { ...a, currentValue: newValue, lastUpdated: new Date().toISOString() }
          : a
      )
    }));

    // 添加收益记录
    if (yieldAmount > 0) {
      const yieldRecord: YieldRecord = {
        id: generateId(),
        assetId,
        date: today,
        previousValue: asset.currentValue,
        newValue,
        yieldAmount,
        yieldRate
      };

      set((state) => ({
        yieldRecords: [...state.yieldRecords, yieldRecord]
      }));
    }
    
    get().saveData();
  },

  calculateAllYields: () => {
    const { assets } = get();
    assets.forEach(asset => {
      get().calculateYield(asset.id);
    });
  },

  getAssetSummary: (): AssetSummary => {
    const { assets } = get();
    
    const totalValue = assets.reduce((sum, asset) => sum + asset.currentValue, 0);
    const totalInitial = assets.reduce((sum, asset) => sum + asset.initialAmount, 0);
    const totalYield = totalValue - totalInitial;
    const totalYieldRate = totalInitial > 0 ? (totalYield / totalInitial) * 100 : 0;

    const assetsByType: Record<AssetType, { count: number; totalValue: number; percentage: number }> = {
      [AssetType.STOCK]: { count: 0, totalValue: 0, percentage: 0 },
      [AssetType.FUND]: { count: 0, totalValue: 0, percentage: 0 },
      [AssetType.DEPOSIT]: { count: 0, totalValue: 0, percentage: 0 },
      [AssetType.WEALTH_MANAGEMENT]: { count: 0, totalValue: 0, percentage: 0 },
      [AssetType.REAL_ESTATE]: { count: 0, totalValue: 0, percentage: 0 },
      [AssetType.BOND]: { count: 0, totalValue: 0, percentage: 0 },
      [AssetType.OTHER]: { count: 0, totalValue: 0, percentage: 0 }
    };

    assets.forEach(asset => {
      assetsByType[asset.type].count++;
      assetsByType[asset.type].totalValue += asset.currentValue;
    });

    // 计算百分比
    Object.keys(assetsByType).forEach(type => {
      const assetType = type as AssetType;
      assetsByType[assetType].percentage = totalValue > 0 
        ? (assetsByType[assetType].totalValue / totalValue) * 100 
        : 0;
    });

    return {
      totalValue,
      totalYield,
      totalYieldRate,
      assetsByType
    };
  },

  loadData: () => {
    try {
      const savedAssets = localStorage.getItem('wealth-management-assets');
      const savedYieldRecords = localStorage.getItem('wealth-management-yields');
      
      if (savedAssets) {
        const assets = JSON.parse(savedAssets);
        set({ assets });
      }
      
      if (savedYieldRecords) {
        const yieldRecords = JSON.parse(savedYieldRecords);
        set({ yieldRecords });
      }
    } catch (error) {
      console.error('Failed to load data from localStorage:', error);
    }
  },

  saveData: () => {
    try {
      const { assets, yieldRecords } = get();
      localStorage.setItem('wealth-management-assets', JSON.stringify(assets));
      localStorage.setItem('wealth-management-yields', JSON.stringify(yieldRecords));
    } catch (error) {
      console.error('Failed to save data to localStorage:', error);
    }
  }
}));

// 初始化数据加载
if (typeof window !== 'undefined') {
  useAssetStore.getState().loadData();
}