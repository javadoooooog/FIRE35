// 资产类型定义
export interface Asset {
  id: string;
  name: string;
  type: AssetType;
  initialAmount: number;
  currentValue: number;
  interestRate: number;
  investmentDate: string;
  lastUpdated: string;
  description?: string;
}

// 资产类型枚举
export enum AssetType {
  STOCK = 'stock',
  FUND = 'fund',
  DEPOSIT = 'deposit',
  WEALTH_MANAGEMENT = 'wealth_management',
  REAL_ESTATE = 'real_estate',
  BOND = 'bond',
  OTHER = 'other'
}

// 资产类型标签映射
export const AssetTypeLabels: Record<AssetType, string> = {
  [AssetType.STOCK]: '股票',
  [AssetType.FUND]: '基金',
  [AssetType.DEPOSIT]: '定期存款',
  [AssetType.WEALTH_MANAGEMENT]: '理财产品',
  [AssetType.REAL_ESTATE]: '房产',
  [AssetType.BOND]: '债券',
  [AssetType.OTHER]: '其他'
};

// 收益记录
export interface YieldRecord {
  id: string;
  assetId: string;
  date: string;
  previousValue: number;
  newValue: number;
  yieldAmount: number;
  yieldRate: number;
}

// 资产统计数据
export interface AssetSummary {
  totalValue: number;
  totalYield: number;
  totalYieldRate: number;
  assetsByType: Record<AssetType, {
    count: number;
    totalValue: number;
    percentage: number;
  }>;
}

// 图表数据类型
export interface ChartData {
  date: string;
  value: number;
  yield: number;
}

// 表单数据类型
export interface AssetFormData {
  name: string;
  type: AssetType;
  initialAmount: number;
  interestRate: number;
  investmentDate: string;
  description?: string;
}