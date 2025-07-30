import { useState, useRef } from 'react';
import { Upload, Download, FileText, Database, Trash2, AlertCircle } from 'lucide-react';
import { useAssetStore } from '../store/assetStore';
import { Asset, AssetType, AssetTypeLabels } from '../types';
import { toast } from 'sonner';

const DataImportExport = () => {
  const { assets, yieldRecords, addAsset, loadData, saveData } = useAssetStore();
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 导出为JSON格式
  const exportToJSON = () => {
    setExporting(true);
    try {
      const data = {
        assets,
        yieldRecords,
        exportDate: new Date().toISOString(),
        version: '1.0'
      };
      
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json'
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `wealth-management-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success('数据导出成功');
    } catch (error) {
      toast.error('导出失败，请重试');
    } finally {
      setExporting(false);
    }
  };

  // 导出为CSV格式
  const exportToCSV = () => {
    setExporting(true);
    try {
      const headers = [
        '资产名称',
        '资产类型',
        '初始金额',
        '当前价值',
        '年化利率(%)',
        '投资日期',
        '最后更新',
        '描述'
      ];
      
      const rows = assets.map(asset => [
        asset.name,
        AssetTypeLabels[asset.type],
        asset.initialAmount.toString(),
        asset.currentValue.toString(),
        asset.interestRate.toString(),
        asset.investmentDate,
        asset.lastUpdated,
        asset.description || ''
      ]);
      
      const csvContent = [headers, ...rows]
        .map(row => row.map(field => `"${field}"`).join(','))
        .join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `wealth-management-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success('CSV文件导出成功');
    } catch (error) {
      toast.error('CSV导出失败，请重试');
    } finally {
      setExporting(false);
    }
  };

  // 处理文件导入
  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        
        if (file.type === 'application/json' || file.name.endsWith('.json')) {
          importFromJSON(content);
        } else if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
          importFromCSV(content);
        } else {
          toast.error('不支持的文件格式，请选择JSON或CSV文件');
        }
      } catch (error) {
        toast.error('文件读取失败，请检查文件格式');
      } finally {
        setImporting(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    };
    
    reader.readAsText(file);
  };

  // 从JSON导入
  const importFromJSON = (content: string) => {
    try {
      const data = JSON.parse(content);
      
      if (!data.assets || !Array.isArray(data.assets)) {
        toast.error('JSON文件格式不正确');
        return;
      }
      
      let importCount = 0;
      data.assets.forEach((assetData: any) => {
        try {
          // 验证必要字段
          if (!assetData.name || !assetData.type || typeof assetData.initialAmount !== 'number') {
            return;
          }
          
          // 验证资产类型
          if (!Object.values(AssetType).includes(assetData.type)) {
            return;
          }
          
          addAsset({
            name: assetData.name,
            type: assetData.type,
            initialAmount: assetData.initialAmount,
            interestRate: assetData.interestRate || 0,
            investmentDate: assetData.investmentDate || new Date().toISOString().split('T')[0],
            description: assetData.description || ''
          });
          
          importCount++;
        } catch (error) {
          // 跳过无效的资产数据
        }
      });
      
      if (importCount > 0) {
        toast.success(`成功导入 ${importCount} 个资产`);
      } else {
        toast.error('没有找到有效的资产数据');
      }
    } catch (error) {
      toast.error('JSON文件解析失败');
    }
  };

  // 从CSV导入
  const importFromCSV = (content: string) => {
    try {
      const lines = content.split('\n').filter(line => line.trim());
      if (lines.length < 2) {
        toast.error('CSV文件格式不正确');
        return;
      }
      
      const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
      let importCount = 0;
      
      for (let i = 1; i < lines.length; i++) {
        try {
          const values = lines[i].split(',').map(v => v.replace(/"/g, '').trim());
          
          if (values.length < 6) continue;
          
          const name = values[0];
          const typeLabel = values[1];
          const initialAmount = parseFloat(values[2]);
          const interestRate = parseFloat(values[4]) || 0;
          const investmentDate = values[5];
          const description = values[7] || '';
          
          // 查找对应的资产类型
          const assetType = Object.entries(AssetTypeLabels)
            .find(([_, label]) => label === typeLabel)?.[0] as AssetType;
          
          if (!name || !assetType || isNaN(initialAmount)) {
            continue;
          }
          
          addAsset({
            name,
            type: assetType,
            initialAmount,
            interestRate,
            investmentDate: investmentDate || new Date().toISOString().split('T')[0],
            description
          });
          
          importCount++;
        } catch (error) {
          // 跳过无效行
        }
      }
      
      if (importCount > 0) {
        toast.success(`成功导入 ${importCount} 个资产`);
      } else {
        toast.error('没有找到有效的资产数据');
      }
    } catch (error) {
      toast.error('CSV文件解析失败');
    }
  };

  // 清空所有数据
  const clearAllData = () => {
    if (window.confirm('确定要清空所有数据吗？此操作不可恢复！')) {
      localStorage.removeItem('wealth-management-assets');
      localStorage.removeItem('wealth-management-yields');
      window.location.reload();
    }
  };

  // 重新加载数据
  const reloadData = () => {
    loadData();
    toast.success('数据重新加载完成');
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: 'CNY',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">数据管理</h1>
        <p className="text-gray-600 mt-1">导入导出数据，管理您的财富信息</p>
      </div>

      {/* 数据统计 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Database className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">资产数量</p>
              <p className="text-2xl font-bold text-gray-900">{assets.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-50 rounded-lg">
              <FileText className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">收益记录</p>
              <p className="text-2xl font-bold text-gray-900">{yieldRecords.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-50 rounded-lg">
              <Database className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">总资产价值</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(assets.reduce((sum, asset) => sum + asset.currentValue, 0))}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 导入数据 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">导入数据</h3>
        
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
          <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h4 className="text-lg font-medium text-gray-900 mb-2">上传数据文件</h4>
          <p className="text-gray-600 mb-4">
            支持JSON和CSV格式文件，拖拽文件到此处或点击选择文件
          </p>
          
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,.csv"
            onChange={handleFileImport}
            className="hidden"
          />
          
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {importing ? '导入中...' : '选择文件'}
          </button>
        </div>
        
        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start space-x-2">
            <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div className="text-sm text-yellow-800">
              <p className="font-medium mb-1">导入说明：</p>
              <ul className="list-disc list-inside space-y-1">
                <li>JSON格式：完整的数据备份，包含所有字段信息</li>
                <li>CSV格式：资产列表，字段顺序：名称、类型、初始金额、当前价值、利率、投资日期、更新时间、描述</li>
                <li>导入的数据将添加到现有数据中，不会覆盖原有数据</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* 导出数据 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">导出数据</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center space-x-3 mb-3">
              <FileText className="h-6 w-6 text-blue-600" />
              <div>
                <h4 className="font-medium text-gray-900">JSON格式</h4>
                <p className="text-sm text-gray-600">完整数据备份</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              包含所有资产信息和收益记录，适合完整备份和恢复
            </p>
            <button
              onClick={exportToJSON}
              disabled={exporting || assets.length === 0}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {exporting ? '导出中...' : '导出JSON'}
            </button>
          </div>
          
          <div className="p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center space-x-3 mb-3">
              <Download className="h-6 w-6 text-green-600" />
              <div>
                <h4 className="font-medium text-gray-900">CSV格式</h4>
                <p className="text-sm text-gray-600">表格数据</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              资产列表的表格格式，可用Excel等软件打开编辑
            </p>
            <button
              onClick={exportToCSV}
              disabled={exporting || assets.length === 0}
              className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {exporting ? '导出中...' : '导出CSV'}
            </button>
          </div>
        </div>
      </div>

      {/* 数据管理操作 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">数据管理</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={reloadData}
            className="flex items-center justify-center space-x-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <Database className="h-4 w-4" />
            <span>重新加载数据</span>
          </button>
          
          <button
            onClick={clearAllData}
            className="flex items-center justify-center space-x-2 px-4 py-3 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
            <span>清空所有数据</span>
          </button>
        </div>
        
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start space-x-2">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
            <div className="text-sm text-red-800">
              <p className="font-medium mb-1">注意事项：</p>
              <ul className="list-disc list-inside space-y-1">
                <li>清空数据操作不可恢复，请谨慎操作</li>
                <li>建议在清空前先导出数据进行备份</li>
                <li>数据存储在浏览器本地，清除浏览器数据会丢失所有信息</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* 数据预览 */}
      {assets.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">数据预览</h3>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-gray-500">资产名称</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-500">类型</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-500">当前价值</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-500">投资日期</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {assets.slice(0, 5).map(asset => (
                  <tr key={asset.id}>
                    <td className="px-4 py-2 text-gray-900">{asset.name}</td>
                    <td className="px-4 py-2 text-gray-600">{AssetTypeLabels[asset.type]}</td>
                    <td className="px-4 py-2 text-gray-900">{formatCurrency(asset.currentValue)}</td>
                    <td className="px-4 py-2 text-gray-600">
                      {new Date(asset.investmentDate).toLocaleDateString('zh-CN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {assets.length > 5 && (
              <div className="text-center py-2 text-gray-500 text-sm">
                还有 {assets.length - 5} 个资产...
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DataImportExport;