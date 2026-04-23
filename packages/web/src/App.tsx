import { Routes, Route } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout.js';
import HomePage from './pages/HomePage.js';
import SearchPage from './pages/SearchPage.js';
import ViewDetailPage from './pages/ViewDetailPage.js';
import BrowsePage from './pages/BrowsePage.js';
import IngestionPage from './pages/IngestionPage.js';
import SourcesPage from './pages/SourcesPage.js';

export default function App() {
  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/browse" element={<BrowsePage />} />
        <Route path="/views/:viewName" element={<ViewDetailPage />} />
        <Route path="/admin/ingestion" element={<IngestionPage />} />
        <Route path="/admin/sources" element={<SourcesPage />} />
      </Routes>
    </AppLayout>
  );
}
