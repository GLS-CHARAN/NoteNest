import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/layout/ProtectedRoute.jsx';
import AppLayout from './components/layout/AppLayout.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import NotesPage from './pages/NotesPage.jsx';
import NoteDetailsPage from './pages/NoteDetailsPage.jsx';
import NoteEditorPage from './pages/NoteEditorPage.jsx';
import FavoritesPage from './pages/FavoritesPage.jsx';
import SharedNotesPage from './pages/SharedNotesPage.jsx';
import SettingsPage from './pages/SettingsPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Everything inside needs a logged-in user */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="notes" element={<NotesPage />} />
          <Route path="notes/new" element={<NoteEditorPage />} />
          <Route path="notes/:id" element={<NoteDetailsPage />} />
          <Route path="notes/:id/edit" element={<NoteEditorPage />} />
          <Route path="favorites" element={<FavoritesPage />} />
          <Route path="shared" element={<SharedNotesPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Route>
      <Route path="/home" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
