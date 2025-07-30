import { useState, useMemo } from 'react';
import { Calculator, TrendingUp, Clock, RefreshCw, Settings } from 'lucide-react';
import { useAssetStore } from '../store/assetStore';
import { Asset, AssetTypeLabels } from '../types';
import { cn } from '../lib/utils';
import { toast } from 'sonner';

const YieldCalculation = () => {
  const { assets, yieldRecords, calculateYield, calculateAllYields, updateAsset } = useAssetStore();
  const [selectedAssetId, setSelectedAssetId] = useState<string>('');
  const [newInterestRate, setNewInterestRate] = useState<number>(0);
  const [showRateEditor, setShowRateEditor] = useState(false);

  // 获取选中的资产
  const selectedAsset = assets.find(asset => asset.id === selectedAssetId);

  // 计算预期收益
  const calculateExpectedYield = (asset: Asset, days: number) => {
    const dailyRate = asset.interestRate / 365 / 100;
    const futureValue = asset.currentValue * Math.pow(1 + dailyRate, days);
    return futureValue - asset.currentValue;
  };

  // 获取资产的收益记录
  const getAssetYieldRecords = (assetId: string) => {
    return yieldRecords
      .filter(record => record.assetId === assetId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  // 处理利率更新
  const handleUpdateInterestRate = () => {
    if (!selectedAsset) {
      toast.error('请选择一个资产');
      return;
    }

    if (newInterestRate < 0) {
      toast.error('利率不能为负数');
      return;
    }

    updateAsset(selectedAsset.id, { interestRate: newInterestRate });
    toast.success('利率更新成功');
    setShowRateEditor(false);
    setNewInterestRate(0);
  };

  // 处理单个资产收益计算
  const handleCalculateAssetYield = () => {
    if (!selectedAsset) {
      toast.error('请选择一个资产');
      return;
    }

    calculateYield(selectedAsset.id);
    toast.success('收益计算完成');
  };

  // 处理所有资产收益计算
  const handleCalculateAllYields = () => {
    if (assets.length === 0) {
      toast.error('暂无资产数据');
      return;
    }

    calculateAllYields();
    toast.success('所有资产收益计算完成');
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: 'CNY',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  // 计算投资天数
  const getDaysSinceInvestment = (investmentDate: string) => {
    const start = new Date(investmentDate);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">收益计算</h1>
          <p className="text-gray-600 mt-1">管理利率设置并计算投资收益</p>
        </div>
        <button
          onClick={handleCalculateAllYields}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          <span>计算所有收益</span>
        </button>
      </div>

      {/* 快速操作卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Calculator className="h-5 w-5 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">收益计算</h3>
          </div>
          <p className="text-gray-600 text-sm mb-4">
            根据设定的利率自动计算资产收益
          </p>
          <button
            onClick={handleCalculateAllYields}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            立即计算
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-green-50 rounded-lg">
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">总收益</h3>
          </div>
          <div className="text-2xl font-bold text-green-600 mb-2">
            {formatCurrency(
              assets.reduce((sum, asset) => sum + (asset.currentValue - asset.initialAmount), 0)
            )}
          </div>
          <p className="text-gray-600 text-sm">
            累计收益金额
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-purple-50 rounded-lg">
              <Clock className="h-5 w-5 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">平均收益率</h3>
          </div>
          <div className="text-2xl font-bold text-purple-600 mb-2">
            {assets.length > 0 ? (
              formatPercentage(
                assets.reduce((sum, asset) => {
                  const yieldRate = asset.initialAmount > 0 
                    ? ((asset.currentValue - asset.initialAmount) / asset.initialAmount) * 100 
                    : 0;
                  return sum + yieldRate;
                }, 0) / assets.length
              )
            ) : '0.00%'}
          </div>
          <p className="text-gray-600 text-sm">
            所有资产平均收益率
          </p>
        </div>
      </div>

      {/* 资产选择和利率设置 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">利率设置</h3>
          <button
            onClick={() => setShowRateEditor(!showRateEditor)}
            className="flex items-center space-x-2 px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <Settings className="h-4 w-4" />
            <span>批量设置</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 资产选择 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              选择资产
            </label>
            <select
              value={selectedAssetId}
              onChange={(e) => {
                setSelectedAssetId(e.target.value);
                const asset = assets.find(a => a.id === e.target.value);
                if (asset) {
                  setNewInterestRate(asset.interestRate);
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">请选择资产</option>
              {assets.map(asset => (
                <option key={asset.id} value={asset.id}>
                  {asset.name} ({AssetTypeLabels[asset.type]})
                </option>
              ))}
            </select>
          </div>

          {/* 利率设置 */}
          {selectedAsset && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                年化利率 (%)
              </label>
              <div className="flex space-x-2">
                <input
                  type="number"
                  value={newInterestRate}
                  onChange={(e) => setNewInterestRate(Number(e.target.value))}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  step="0.01"
                  min="0"
                />
                <button
                  onClick={handleUpdateInterestRate}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  更新
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 选中资产详情 */}
        {selectedAsset && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-3">资产详情</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-600">初始金额:</span>
                <div className="font-medium">{formatCurrency(selectedAsset.initialAmount)}</div>
              </div>
              <div>
                <span className="text-gray-600">当前价值:</span>
                <div className="font-medium">{formatCurrency(selectedAsset.currentValue)}</div>
              </div>
              <div>
                <span className="text-gray-600">投资天数:</span>
                <div className="font-medium">{getDaysSinceInvestment(selectedAsset.investmentDate)} 天</div>
              </div>
              <div>
                <span className="text-gray-600">当前利率:</span>
                <div className="font-medium">{selectedAsset.interestRate.toFixed(2)}%</div>
              </div>
            </div>
            
            <div className="mt-4">
              <button
                onClick={handleCalculateAssetYield}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                计算此资产收益
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 收益预测 */}
      {selectedAsset && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">收益预测</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[30, 90, 365].map(days => {
              const expectedYield = calculateExpectedYield(selectedAsset, days);
              const yieldRate = selectedAsset.currentValue > 0 
                ? (expectedYield / selectedAsset.currentValue) * 100 
                : 0;
              
              return (
                <div key={days} className="p-4 border border-gray-200 rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">
                    {days === 30 ? '30天后' : days === 90 ? '3个月后' : '1年后'}
                  </div>
                  <div className="text-lg font-semibold text-gray-900">
                    {formatCurrency(expectedYield)}
                  </div>
                  <div className={cn(
                    "text-sm font-medium",
                    yieldRate >= 0 ? "text-green-600" : "text-red-600"
                  )}>
                    {formatPercentage(yieldRate)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 历史收益记录 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">历史收益记录</h3>
        
        {yieldRecords.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 text-lg mb-2">📈</div>
            <h4 className="text-lg font-medium text-gray-900 mb-1">暂无收益记录</h4>
            <p className="text-gray-600">开始计算收益后，记录将显示在这里</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    日期
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    资产
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    原价值
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    新价值
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    收益金额
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    收益率
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {yieldRecords
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .slice(0, 10)
                  .map(record => {
                    const asset = assets.find(a => a.id === record.assetId);
                    return (
                      <tr key={record.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {new Date(record.date).toLocaleDateString('zh-CN')}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {asset?.name || '未知资产'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(record.previousValue)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(record.newValue)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={cn(
                            "text-sm font-medium",
                            record.yieldAmount >= 0 ? "text-green-600" : "text-red-600"
                          )}>
                            {formatCurrency(record.yieldAmount)}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={cn(
                            "text-sm font-medium",
                            record.yieldRate >= 0 ? "text-green-600" : "text-red-600"
                          )}>
                            {formatPercentage(record.yieldRate)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default YieldCalculation;