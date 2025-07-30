import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  BarChart3, 
  Wallet, 
  TrendingUp, 
  Database, 
  Menu, 
  X,
  DollarSign
} from 'lucide-react';
import { cn } from '../lib/utils';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const navigation = [
    {
      name: '资产总览',
      href: '/',
      icon: BarChart3,
      emoji: '📊'
    },
    {
      name: '资产管理',
      href: '/assets',
      icon: Wallet,
      emoji: '💰'
    },
    {
      name: '收益计算',
      href: '/yields',
      icon: TrendingUp,
      emoji: '📈'
    },
    {
      name: '数据管理',
      href: '/data',
      icon: Database,
      emoji: '💾'
    }
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* 移动端侧边栏遮罩 */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* 侧边栏 */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <img src="/logo.png" alt="一二" className="h-8 w-8 object-contain" />
            <span className="text-xl font-bold text-gray-900">小猪财富之家</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="mt-6 px-3">
          <div className="space-y-1">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "group flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-colors duration-200",
                    isActive
                      ? "bg-blue-50 text-blue-700 border-r-2 border-blue-600"
                      : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                  )}
                >
                  <span className="text-lg mr-3">{item.emoji}</span>
                  <item.icon className={cn(
                    "mr-3 h-5 w-5 flex-shrink-0",
                    isActive ? "text-blue-600" : "text-gray-400 group-hover:text-gray-600"
                  )} />
                  {item.name}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* 底部信息 */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <div className="text-xs text-gray-500 text-center">
            <p>🐷✨ 小猪的财富魔法屋</p>
            <p className="mt-1">让钱钱变得更可爱呀~ (◕‿◕)♡</p>
          </div>
        </div>
      </div>

      {/* 主内容区域 */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* 顶部导航栏 */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
            >
              <Menu className="h-6 w-6" />
            </button>
            
            <div className="flex-1 lg:hidden flex items-center justify-center">
              <div className="flex items-center space-x-2">
                <img src="/logo.png" alt="一二" className="h-6 w-6 object-contain" />
                <span className="text-lg font-semibold text-gray-900">小猪财富之家</span>
              </div>
            </div>

            <div className="hidden lg:flex lg:items-center lg:space-x-4">
              <div className="text-sm text-gray-600">
                {navigation.find(item => item.href === location.pathname)?.name || '小猪财富之家'}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <div className="text-xs text-gray-500">
                {new Date().toLocaleDateString('zh-CN', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </div>
            </div>
          </div>
        </header>

        {/* 主内容 */}
        <main className="flex-1 overflow-y-auto bg-gray-50">
          <div className="p-4 sm:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;