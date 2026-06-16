import { describe, expect, it, vi } from 'vitest';
import { listMapOccurrences } from './list-occurrences.service';

vi.mock('../../../api/client', () => ({
  apiRequest: vi.fn(),
}));

import { apiRequest } from '../../../api/client';

describe('listMapOccurrences', () => {
  it('should_map_items_and_location_from_api_response', async () => {
    vi.mocked(apiRequest).mockResolvedValue({
      items: [
        {
          id: 'occ-1',
          category: 'pothole',
          status: 'open',
          location: { latitude: -12.5423, longitude: -55.7214 },
        },
        {
          id: 'occ-2',
          category: 'lighting',
          status: 'open',
        },
      ],
    });

    const result = await listMapOccurrences({
      minLatitude: -12.58,
      maxLatitude: -12.51,
      minLongitude: -55.76,
      maxLongitude: -55.68,
      cityId: 'city-1',
      token: 'session-token',
    });

    expect(result).toEqual([
      {
        id: 'occ-1',
        category: 'pothole',
        status: 'open',
        location: { latitude: -12.5423, longitude: -55.7214 },
      },
    ]);
  });
});
