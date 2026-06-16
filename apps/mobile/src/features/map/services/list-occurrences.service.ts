import { apiRequest } from '../../../api/client';

export interface OccurrenceMapItem {
  id: string;
  category: string;
  status: string;
  location: {
    latitude: number;
    longitude: number;
  };
}

interface ListOccurrencesResponse {
  data: Array<{
    id: string;
    category: string;
    status: string;
    problemLocation: {
      latitude: number;
      longitude: number;
    };
  }>;
}

function toQueryString(params: Record<string, string | number>): string {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    searchParams.set(key, String(value));
  }

  return searchParams.toString();
}

export async function listMapOccurrences(input: {
  minLatitude: number;
  maxLatitude: number;
  minLongitude: number;
  maxLongitude: number;
  cityId: string;
  token: string | null;
}): Promise<OccurrenceMapItem[]> {
  const query = toQueryString({
    minLatitude: input.minLatitude,
    maxLatitude: input.maxLatitude,
    minLongitude: input.minLongitude,
    maxLongitude: input.maxLongitude,
    limit: 100,
  });
  const response = await apiRequest<ListOccurrencesResponse>(`/occurrences?${query}`, {
    method: 'GET',
    auth: 'session',
    token: input.token,
    cityId: input.cityId,
  });

  return response.data.map((item) => ({
    id: item.id,
    category: item.category,
    status: item.status,
    location: item.problemLocation,
  }));
}
