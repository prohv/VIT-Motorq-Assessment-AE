const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export interface ActiveUsersResponse {
  count: number;
}

export interface TrackActiveBuildResponse {
  success: boolean;
  inserted: number;
  total: number;
}

export interface BreakdownItem {
  country?: string;
  device?: string;
  video_id?: string;
  title?: string;
  count: number;
}

export interface BreakdownResponse {
  data: BreakdownItem[];
}

export async function apiFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `API Error: ${response.status}`);
  }

  return response.json();
}

export async function getActiveUsersCount(start: string, end: string): Promise<ActiveUsersResponse> {
  return apiFetch<ActiveUsersResponse>(`/active-users/count?start=${start}&end=${end}`);
}

export async function getActiveUsersAt(x: string): Promise<ActiveUsersResponse> {
  return apiFetch<ActiveUsersResponse>(`/active-users/at?x=${x}`);
}

export async function buildTrackActive(limit: number = 1000): Promise<TrackActiveBuildResponse> {
  return apiFetch<TrackActiveBuildResponse>(`/track-active/build?limit=${limit}`, {
    method: "POST",
  });
}

export async function getActiveUsersByCountry(start: string, end: string): Promise<BreakdownResponse> {
  return apiFetch<BreakdownResponse>(`/active-users/by-country?start=${start}&end=${end}`);
}

export async function getActiveUsersByDevice(start: string, end: string): Promise<BreakdownResponse> {
  return apiFetch<BreakdownResponse>(`/active-users/by-device?start=${start}&end=${end}`);
}

export async function getActiveUsersByVideo(start: string, end: string): Promise<BreakdownResponse> {
  return apiFetch<BreakdownResponse>(`/active-users/by-video?start=${start}&end=${end}`);
}