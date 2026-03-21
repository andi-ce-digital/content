import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { DashboardPage } from './pages/DashboardPage'
import { ContentLibraryPage } from './pages/ContentLibraryPage'
import { BrandVoicePage } from './pages/BrandVoicePage'
import { GeneratorPage } from './pages/GeneratorPage'
import { CreatorsPage } from './pages/CreatorsPage'
import { SettingsPage } from './pages/SettingsPage'
import { ContentStatsPage } from './pages/ContentStatsPage'
import { AiAssistantPage } from './pages/AiAssistantPage'
import { ContentPlanPage } from './pages/ContentPlanPage'
import { RemotionEditorPage } from './pages/RemotionEditorPage'
import { AuthLoginPage } from './pages/AuthLoginPage'
import { AuthRegisterPage } from './pages/AuthRegisterPage'
import { AuthProvider } from './auth/AuthContext'
import { RequireAuth } from './auth/RequireAuth'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/auth/login" element={<AuthLoginPage />} />
          <Route path="/auth/register" element={<AuthRegisterPage />} />
          <Route
            path="/"
            element={
              <RequireAuth>
                <App />
              </RequireAuth>
            }
          >
            <Route index element={<Navigate to="dashboard/assistant" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="dashboard/assistant" element={<AiAssistantPage />} />
            <Route path="creators" element={<CreatorsPage />} />
            <Route path="library" element={<ContentLibraryPage />} />
            <Route path="library/:id/stats" element={<ContentStatsPage />} />
            <Route path="content-plan" element={<ContentPlanPage />} />
            <Route path="brand-voice" element={<BrandVoicePage />} />
            <Route path="generator" element={<GeneratorPage />} />
            <Route path="generator/remotion-editor" element={<RemotionEditorPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
