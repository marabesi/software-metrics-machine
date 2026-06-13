import { describe, expect, it, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { GithubPrsClient } from '../../../src';
import { GitHubRateLimitManager } from '../../../src';

describe('GithubPrsClient rate limit integration', () => {
  let mockGet: ReturnType<typeof vi.fn>;
  let rateLimitManager: GitHubRateLimitManager;

  beforeEach(() => {
    vi.clearAllMocks();
    mockGet = vi.fn();
    vi.spyOn(axios, 'create').mockReturnValue({ get: mockGet } as any);
    rateLimitManager = new GitHubRateLimitManager();
  });

  describe('fetchPRs', () => {
    it('should call waitIfNeeded before making a request', async () => {
      const waitSpy = vi.spyOn(rateLimitManager, 'waitIfNeeded');
      mockGet.mockResolvedValue({ data: [], headers: {} });

      const client = new GithubPrsClient('token', 'owner', 'repo', rateLimitManager);
      await client.fetchPRs();

      expect(waitSpy).toHaveBeenCalled();
    });

    it('should call updateFromHeaders after a successful response', async () => {
      const headersSpy = vi.spyOn(rateLimitManager, 'updateFromHeaders');
      const headers = { 'x-ratelimit-remaining': '4999', 'x-ratelimit-limit': '5000' };
      mockGet.mockResolvedValue({ data: [], headers });

      const client = new GithubPrsClient('token', 'owner', 'repo', rateLimitManager);
      await client.fetchPRs();

      expect(headersSpy).toHaveBeenCalledWith(headers);
    });

    it('should retry on 429 and succeed on retry', async () => {
      const waitForResetSpy = vi.spyOn(rateLimitManager, 'waitForReset');
      const headers = {
        'x-ratelimit-remaining': '0',
        'x-ratelimit-reset': String(Math.floor(Date.now() / 1000) + 30),
      };

      // First call: 429, second call: success with empty page (no more PRs)
      mockGet
        .mockRejectedValueOnce({ isAxiosError: true, response: { status: 429, headers } })
        .mockResolvedValueOnce({ data: [], headers });

      const client = new GithubPrsClient('token', 'owner', 'repo', rateLimitManager);
      await client.fetchPRs();

      expect(waitForResetSpy).toHaveBeenCalled();
    });

    it('should retry on 403 and succeed on retry', async () => {
      const waitForResetSpy = vi.spyOn(rateLimitManager, 'waitForReset');
      const headers = {
        'x-ratelimit-remaining': '0',
        'x-ratelimit-reset': String(Math.floor(Date.now() / 1000) + 30),
      };

      mockGet
        .mockRejectedValueOnce({ isAxiosError: true, response: { status: 403, headers } })
        .mockResolvedValueOnce({ data: [], headers });

      const client = new GithubPrsClient('token', 'owner', 'repo', rateLimitManager);
      await client.fetchPRs();

      expect(waitForResetSpy).toHaveBeenCalled();
    });

    it('should throw after 3 consecutive 429 errors', async () => {
      const waitForResetSpy = vi.spyOn(rateLimitManager, 'waitForReset');
      const error = { isAxiosError: true, response: { status: 429, headers: {} } };

      mockGet.mockRejectedValue(error);

      const client = new GithubPrsClient('token', 'owner', 'repo', rateLimitManager);
      await expect(client.fetchPRs()).rejects.toThrow();

      // Called 2 times (attempt 0, 1) — on attempt 2 it throws without waiting
      expect(waitForResetSpy).toHaveBeenCalledTimes(2);
    });

    it('should NOT retry on 401 — pass through immediately', async () => {
      const waitForResetSpy = vi.spyOn(rateLimitManager, 'waitForReset');
      const error = {
        isAxiosError: true,
        response: { status: 401, statusText: 'Unauthorized' },
        message: 'Unauthorized',
      };

      mockGet.mockRejectedValue(error);

      const client = new GithubPrsClient('token', 'owner', 'repo', rateLimitManager);
      await expect(client.fetchPRs()).rejects.toThrow();

      expect(waitForResetSpy).not.toHaveBeenCalled();
    });

    it('should NOT retry on 500 — pass through immediately', async () => {
      const waitForResetSpy = vi.spyOn(rateLimitManager, 'waitForReset');
      const error = { isAxiosError: true, response: { status: 500 }, message: 'Server Error' };

      mockGet.mockRejectedValue(error);

      const client = new GithubPrsClient('token', 'owner', 'repo', rateLimitManager);
      await expect(client.fetchPRs()).rejects.toThrow();

      expect(waitForResetSpy).not.toHaveBeenCalled();
    });
  });

  describe('fetchPRComments', () => {
    it('should call waitIfNeeded before making a request', async () => {
      const waitSpy = vi.spyOn(rateLimitManager, 'waitIfNeeded');
      mockGet.mockResolvedValue({ data: [], headers: {} });

      const client = new GithubPrsClient('token', 'owner', 'repo', rateLimitManager);
      await client.fetchPRComments(1);

      expect(waitSpy).toHaveBeenCalled();
    });

    it('should call updateFromHeaders after response', async () => {
      const headersSpy = vi.spyOn(rateLimitManager, 'updateFromHeaders');
      const headers = { 'x-ratelimit-remaining': '4998', 'x-ratelimit-limit': '5000' };
      mockGet.mockResolvedValue({ data: [], headers });

      const client = new GithubPrsClient('token', 'owner', 'repo', rateLimitManager);
      await client.fetchPRComments(1);

      expect(headersSpy).toHaveBeenCalledWith(headers);
    });

    it('should retry on 429 and succeed', async () => {
      const waitForResetSpy = vi.spyOn(rateLimitManager, 'waitForReset');

      mockGet
        .mockRejectedValueOnce({ isAxiosError: true, response: { status: 429, headers: {} } })
        .mockResolvedValueOnce({ data: [], headers: {} });

      const client = new GithubPrsClient('token', 'owner', 'repo', rateLimitManager);
      await client.fetchPRComments(1);

      expect(waitForResetSpy).toHaveBeenCalled();
    });
  });
});
