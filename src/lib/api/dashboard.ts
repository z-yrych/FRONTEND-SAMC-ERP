const API_BASE = 'http://localhost:3000/api';

export interface DateRangeParams {
  startDate?: string;
  endDate?: string;
  period?: 'today' | 'week' | 'month' | 'quarter' | 'year';
}

export interface SalesMetrics {
  totalRevenue: number;
  totalTransactions: number;
  rfqCount: number;
  poCount: number;
  completedCount: number;
  avgTransactionValue: number;
  conversionRate: number;
  statusBreakdown: Array<{ status: string; count: number }>;
  revenueTrend: Array<{ date: string; revenue: number }>;
  dateRange: { startDate: string; endDate: string };
}

export interface TopClientData {
  clientId: string;
  clientName: string;
  revenue: number;
  transactionCount: number;
  totalCost: number;
  profit: number;
  profitMargin: number;
}

export interface TopProductData {
  productId: string;
  productName: string;
  productSku: string;
  revenue: number;
  quantitySold: number;
  totalCost: number;
  profit: number;
  profitMargin: number;
  transactionCount: number;
}

export interface FinancialMetrics {
  totalInvoiced: number;
  totalPaid: number;
  totalOutstanding: number;
  totalOverdue: number;
  overdueCount: number;
  invoiceCount: number;
  invoiceStatusBreakdown: Array<{ status: string; count: number; amount: number }>;
  avgDaysToPayment: number;
  collectionRate: number;
  arAging: {
    current: number;
    days31_60: number;
    days61_90: number;
    over90: number;
  };
  dateRange: { startDate: string; endDate: string };
}

export interface InventoryMetrics {
  totalInventoryValue: number;
  allocatedValue: number;
  availableValue: number;
  productsInStock: number;
  totalProducts: number;
  lowStockCount: number;
  outOfStockCount: number;
  totalBatches: number;
  avgBatchAge: number;
}

function buildQueryString(params: DateRangeParams): string {
  const query = new URLSearchParams();
  if (params.startDate) query.append('startDate', params.startDate);
  if (params.endDate) query.append('endDate', params.endDate);
  if (params.period) query.append('period', params.period);
  return query.toString();
}

export async function fetchSalesMetrics(params: DateRangeParams = {}): Promise<SalesMetrics> {
  const query = buildQueryString(params);
  const response = await fetch(`${API_BASE}/dashboard/sales-metrics?${query}`);
  if (!response.ok) {
    throw new Error('Failed to fetch sales metrics');
  }
  return response.json();
}

export async function fetchTopClients(params: DateRangeParams = {}, limit: number = 10) {
  const query = buildQueryString(params);
  const limitParam = limit ? `&limit=${limit}` : '';
  const response = await fetch(`${API_BASE}/dashboard/top-clients?${query}${limitParam}`);
  if (!response.ok) {
    throw new Error('Failed to fetch top clients');
  }
  return response.json();
}

export async function fetchTopProducts(params: DateRangeParams = {}, limit: number = 10) {
  const query = buildQueryString(params);
  const limitParam = limit ? `&limit=${limit}` : '';
  const response = await fetch(`${API_BASE}/dashboard/top-products?${query}${limitParam}`);
  if (!response.ok) {
    throw new Error('Failed to fetch top products');
  }
  return response.json();
}

export async function fetchFinancialMetrics(params: DateRangeParams = {}): Promise<FinancialMetrics> {
  const query = buildQueryString(params);
  const response = await fetch(`${API_BASE}/dashboard/financial-metrics?${query}`);
  if (!response.ok) {
    throw new Error('Failed to fetch financial metrics');
  }
  return response.json();
}

export async function fetchInventoryMetrics(): Promise<InventoryMetrics> {
  const response = await fetch(`${API_BASE}/dashboard/inventory-metrics`);
  if (!response.ok) {
    throw new Error('Failed to fetch inventory metrics');
  }
  return response.json();
}

export async function fetchDashboardSummary(params: DateRangeParams = {}) {
  const query = buildQueryString(params);
  const response = await fetch(`${API_BASE}/dashboard/summary?${query}`);
  if (!response.ok) {
    throw new Error('Failed to fetch dashboard summary');
  }
  return response.json();
}

export async function fetchRevenueDetails(params: DateRangeParams = {}) {
  const query = buildQueryString(params);
  const response = await fetch(`${API_BASE}/dashboard/revenue-details?${query}`);
  if (!response.ok) {
    throw new Error('Failed to fetch revenue details');
  }
  return response.json();
}

export async function fetchTransactionDetails(
  params: DateRangeParams = {},
  filters: { status?: string; type?: string } = {},
  limit: number = 100
) {
  const query = buildQueryString(params);
  const filterParams = new URLSearchParams();
  if (filters.status) filterParams.append('status', filters.status);
  if (filters.type) filterParams.append('type', filters.type);
  filterParams.append('limit', limit.toString());

  const fullQuery = query ? `${query}&${filterParams.toString()}` : filterParams.toString();
  const response = await fetch(`${API_BASE}/dashboard/transaction-details?${fullQuery}`);
  if (!response.ok) {
    throw new Error('Failed to fetch transaction details');
  }
  return response.json();
}

export async function fetchConversionFunnel(params: DateRangeParams = {}) {
  const query = buildQueryString(params);
  const response = await fetch(`${API_BASE}/dashboard/conversion-funnel?${query}`);
  if (!response.ok) {
    throw new Error('Failed to fetch conversion funnel');
  }
  return response.json();
}

export async function fetchValueDistribution(params: DateRangeParams = {}) {
  const query = buildQueryString(params);
  const response = await fetch(`${API_BASE}/dashboard/value-distribution?${query}`);
  if (!response.ok) {
    throw new Error('Failed to fetch value distribution');
  }
  return response.json();
}
