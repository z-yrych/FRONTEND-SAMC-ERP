import api from '../axios';

// API_BASE removed - using api instance baseURL

export interface Client {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateClientDto {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
}

export interface UpdateClientDto {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
}

export async function fetchClients(): Promise<Client[]> {
  const response = await api.get(`/clients`);
  return response.data;
}

export async function fetchClient(id: string): Promise<Client> {
  const response = await api.get(`/clients/${id}`);
  return response.data;
}

export async function createClient(data: CreateClientDto): Promise<Client> {
  const response = await api.post(`/clients`, data);
  return response.data;
}

export async function updateClient(id: string, data: UpdateClientDto): Promise<Client> {
  const response = await api.put(`/clients/${id}`, data);
  return response.data;
}

export async function deleteClient(id: string): Promise<void> {
  await api.delete(`/clients/${id}`);
}
