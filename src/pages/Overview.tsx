import { useEffect, useMemo } from 'react';
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Target, Calendar, RefreshCw } from 'lucide-react';
import { useAssetStore } from '../store/assetStore';
import { AssetType, AssetTypeLabels } from '../types';
import { cn } from '../lib/utils';

const Overview = () => {
  const { assets, calculateAllYields, getAssetSummary } = useAssetStore();
  const summary = getAssetSummary();

  // 自动计算收益
  useEffect(() => {
    if (assets.length > 0) {
      calculateAllYields();
    }
  }, []);

  // 饼图数据
  const pieData = useMemo(() => {
    return Object.entries(summary.assetsByType)
      .filter(([_, data]) => data.totalValue > 0)
      .map(([type, data]) => ({
        name: AssetTypeLabels[type as AssetType],
        value: data.totalValue,
        percentage: data.percentage
      }));
  }, [summary]);

  // 趋势图数据（模拟最近7天的数据）
  const trendData = useMemo(() => {
    const days = 7;
    const data = [];
    const today = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      // 模拟数据变化
      const baseValue = summary.totalValue;
      const variation = (Math.random() - 0.5) * 0.02; // ±1%的随机变化
      const value = baseValue * (1 + variation * i / days);
      
      data.push({
        date: date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }),
        value: Math.round(value),
        yield: Math.round((value - baseValue) * 100) / 100
      });
    }
    
    return data;
  }, [summary.totalValue]);

  // 资产类型分布柱状图数据
  const barData = useMemo(() => {
    return Object.entries(summary.assetsByType)
      .filter(([_, data]) => data.count > 0)
      .map(([type, data]) => ({
        name: AssetTypeLabels[type as AssetType],
        count: data.count,
        value: data.totalValue
      }));
  }, [summary]);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16'];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: 'CNY',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">资产总览</h1>
          <p className="text-gray-600 mt-1">查看您的财富状况和投资表现</p>
        </div>
        <button
          onClick={calculateAllYields}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          <span>更新收益</span>
        </button>
      </div>

      {/* 核心指标卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">总资产价值</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatCurrency(summary.totalValue)}
              </p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <DollarSign className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">累计收益</p>
              <p className={cn(
                "text-2xl font-bold mt-1",
                summary.totalYield >= 0 ? "text-green-600" : "text-red-600"
              )}>
                {formatCurrency(summary.totalYield)}
              </p>
            </div>
            <div className={cn(
              "p-3 rounded-lg",
              summary.totalYield >= 0 ? "bg-green-50" : "bg-red-50"
            )}>
              {summary.totalYield >= 0 ? (
                <TrendingUp className="h-6 w-6 text-green-600" />
              ) : (
                <TrendingDown className="h-6 w-6 text-red-600" />
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">收益率</p>
              <p className={cn(
                "text-2xl font-bold mt-1",
                summary.totalYieldRate >= 0 ? "text-green-600" : "text-red-600"
              )}>
                {formatPercentage(summary.totalYieldRate)}
              </p>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg">
              <Target className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">资产数量</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {assets.length}
              </p>
            </div>
            <div className="p-3 bg-orange-50 rounded-lg">
              <Calendar className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* 图表区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 资产分布饼图 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">资产分布</h3>
          {pieData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              暂无资产数据
            </div>
          )}
          
          {/* 图例 */}
          {pieData.length > 0 && (
            <div className="mt-4 space-y-2">
              {pieData.map((item, index) => (
                <div key={item.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-gray-700">{item.name}</span>
                  </div>
                  <span className="font-medium text-gray-900">
                    {item.percentage.toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 收益趋势图 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">收益趋势</h3>
          {summary.totalValue > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                    stroke="#6b7280"
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    stroke="#6b7280"
                    tickFormatter={(value) => `¥${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip 
                    formatter={(value: number) => [formatCurrency(value), '资产价值']}
                    labelStyle={{ color: '#374151' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              暂无趋势数据
            </div>
          )}
        </div>
      </div>

      {/* 资产类型统计 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">资产类型统计</h3>
        {barData.length > 0 ? (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 12 }}
                  stroke="#6b7280"
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  stroke="#6b7280"
                  tickFormatter={(value) => `¥${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip 
                  formatter={(value: number, name: string) => [
                    name === 'value' ? formatCurrency(value) : value,
                    name === 'value' ? '总价值' : '数量'
                  ]}
                />
                <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center text-gray-500">
            暂无统计数据
          </div>
        )}
      </div>
    </div>
  );
};

export default Overview;