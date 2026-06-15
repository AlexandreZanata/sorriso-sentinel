import { describe, expect, it } from 'vitest';
import {
  InvalidProblemLocationError,
  parseProblemLocation,
} from './problem-location.vo.js';

describe('parseProblemLocation', () => {
  it('should_reject_invalid_latitude_on_problem_location', () => {
    expect(() => parseProblemLocation({ latitude: 91, longitude: 0 })).toThrow(
      InvalidProblemLocationError,
    );
  });

  it('should_reject_invalid_longitude_on_problem_location', () => {
    expect(() => parseProblemLocation({ latitude: 0, longitude: 181 })).toThrow(
      InvalidProblemLocationError,
    );
  });
});
