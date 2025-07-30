import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import Layout from './components/Layout';
import Overview from './pages/Overview';
import AssetManagement from './pages/AssetManagement';
import YieldCalculation from './pages/YieldCalculation';
import DataImportExport from './pages/DataImportExport';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Layout>
          <Routes>
            <Route path="/" element={<Overview />} />
            <Route path="/assets" element={<AssetManagement />} />
            <Route path="/yields" element={<YieldCalculation />} />
            <Route path="/data" element={<DataImportExport />} />
          </Routes>
        </Layout>
        <Toaster position="top-center" richColors />
      </div>
    </Router>
  );
}

export default App
