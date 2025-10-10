import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { queryClient } from './lib/queryClient'
import { DashboardPage } from './pages/DashboardPage'
import { TransactionsPage } from './pages/TransactionsPage'
import { TransactionDetailsPage } from './pages/TransactionDetailsPage'
import { BarcodeScannerPage } from './pages/BarcodeScannerPage'
import { StockCountSessionPage } from './pages/StockCountSessionPage'

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Toaster />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/transactions" element={<TransactionsPage />} />
          <Route path="/transactions/:id" element={<TransactionDetailsPage />} />
          <Route path="/barcode-scanner" element={<BarcodeScannerPage />} />
          <Route path="/stock-count/:sessionId" element={<StockCountSessionPage />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
