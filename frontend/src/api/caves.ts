export interface Cave {
  id: number;
  registry_id: string;
  plaque_number: string | null;
  name: string;
  latitude: number | null;
  longitude: number | null;
  elevation: number | null;
  length: number | null;
  depth_positive: number | null;
  depth_negative: number | null;
  municipality: string | null;
  valley: string | null;
  geology: 'limestone' | 'dolomite' | 'gypsum' | 'other' | null;
  description: string | null;
  last_survey_date: string | null;
  parking_latitude: number | null;
  parking_longitude: number | null;
  parking_notes: string | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface CaveWritePayload {
  registry_id?: string;
  plaque_number?: string | null;
  name: string;
  latitude: number;
  longitude: number;
  elevation?: number | null;
  length?: number | null;
  depth_positive?: number | null;
  depth_negative?: number | null;
  municipality?: string | null;
  valley?: string | null;
  geology?: 'limestone' | 'dolomite' | 'gypsum' | 'other' | null;
  description?: string | null;
  last_survey_date?: string | null;
  parking_latitude?: number | null;
  parking_longitude?: number | null;
  parking_notes?: string | null;
  is_published?: boolean;
}

export interface CaveMedia {
  id: number;
  media_type: 'photo' | 'survey_pdf' | 'survey_image';
  caption: string | null;
  file_url: string;
  uploaded_by: string;
  uploaded_at: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface ApiError extends Error {
  data?: Record<string, string[]>;
}

export async function fetchCaves(params: { search?: string; ordering?: string; page?: number }): Promise<PaginatedResponse<Cave>> {
  const query = new URLSearchParams();
  if (params.search) query.append('search', params.search);
  if (params.ordering) query.append('ordering', params.ordering);
  if (params.page) query.append('page', params.page.toString());

  const response = await fetch(`/api/v1/caves/?${query.toString()}`);
  if (!response.ok) {
    throw new Error('Failed to fetch caves');
  }
  return response.json();
}

export async function fetchAllCaves(): Promise<Cave[]> {
  const response = await fetch('/api/v1/caves/admin/', {
    credentials: 'include',
  });
  if (!response.ok) {
    throw new Error('Failed to fetch all caves');
  }
  return response.json();
}

export async function fetchCaveGeoJson(): Promise<GeoJSON.FeatureCollection> {
  const response = await fetch('/api/v1/caves/geojson/');
  if (!response.ok) {
    throw new Error('Failed to fetch cave geojson');
  }
  return response.json();
}

export async function fetchCave(registryId: string): Promise<Cave> {
  const response = await fetch(`/api/v1/caves/${encodeURIComponent(registryId)}/`);
  if (!response.ok) {
    throw new Error('Failed to fetch cave detail');
  }
  return response.json();
}

export async function createCave(data: CaveWritePayload): Promise<Cave> {
  const response = await fetch('/api/v1/caves/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
    credentials: 'include',
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const error = new Error('Failed to create cave') as ApiError;
    error.data = errorData;
    throw error;
  }
  return response.json();
}

export async function updateCave(registryId: string, data: Partial<CaveWritePayload>): Promise<Cave> {
  const response = await fetch(`/api/v1/caves/${encodeURIComponent(registryId)}/`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
    credentials: 'include',
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const error = new Error('Failed to update cave') as ApiError;
    error.data = errorData;
    throw error;
  }
  return response.json();
}

export async function deleteCave(registryId: string): Promise<void> {
  const response = await fetch(`/api/v1/caves/${encodeURIComponent(registryId)}/`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!response.ok) {
    throw new Error('Failed to delete cave');
  }
}

export async function fetchCaveMedia(registryId: string): Promise<CaveMedia[]> {
  const response = await fetch(`/api/v1/caves/${encodeURIComponent(registryId)}/media/`);
  if (!response.ok) {
    throw new Error('Failed to fetch cave media');
  }
  const data = await response.json();
  // Handle both paginated and non-paginated responses
  return Array.isArray(data) ? data : (data.results || []);
}

export async function uploadMedia(registryId: string, formData: FormData): Promise<CaveMedia> {
  const response = await fetch(`/api/v1/caves/${encodeURIComponent(registryId)}/media/`, {
    method: 'POST',
    body: formData,
    credentials: 'include',
  });
  if (!response.ok) {
    throw new Error('Failed to upload media');
  }
  return response.json();
}

export async function deleteMedia(id: number): Promise<void> {
  const response = await fetch(`/api/v1/media/${id}/`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!response.ok) {
    throw new Error('Failed to delete media');
  }
}
