import { useEffect } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import { AppLayout } from "@/components/layout/AppLayout";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { LiveDataProvider } from "@/hooks/liveData";
import { BacktestPage } from "@/pages/BacktestPage";
import { ChartPage } from "@/pages/ChartPage";
import { LoginPage } from "@/pages/LoginPage";
import { OverviewPage } from "@/pages/OverviewPage";
import { SignalsPage } from "@/pages/SignalsPage";
import { SymbolsPage } from "@/pages/SymbolsPage";
import { useAuthStore } from "@/store/authStore";

function App() {
  const hydrate = useAuthStore((s) => s.hydrate);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          element={
            <LiveDataProvider>
              <ProtectedRoute />
            </LiveDataProvider>
          }
        >
          <Route element={<AppLayout />}>
            <Route path="/" element={<OverviewPage />} />
            <Route path="/chart" element={<ChartPage />} />
            <Route path="/signals" element={<SignalsPage />} />
            <Route path="/symbols" element={<SymbolsPage />} />
            <Route path="/backtest" element={<BacktestPage />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
