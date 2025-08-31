import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { describe, it, vi, expect } from 'vitest';
import * as matchers from '@testing-library/jest-dom/matchers';
expect.extend(matchers);

var apiFetch: any;
vi.mock('../lib/api', () => {
  apiFetch = vi.fn((path: string) => {
    if (path === '/members/1') {
      return Promise.resolve({
        json: () =>
          Promise.resolve({
            studentId: '1',
            name: 'Alice',
            phone: '123',
            email: null,
            department: null,
            status: 'ACTIVE',
            joinedAt: null,
            terms: [],
            recentMemos: []
          })
      });
    }
    if (path === '/members/1/memos') {
      return Promise.resolve({ json: () => Promise.resolve([]) });
    }
    throw new Error('unknown path');
  });
  return { default: apiFetch };
});

vi.mock('@packages/types', () => ({
  MemberDetailSchema: { parse: (v: any) => v },
  MemoSchema: { parse: (v: any) => v }
}));

import MemberDetailPage from '../app/members/[studentId]/page';

describe('member detail page', () => {
  it('renders member information', async () => {
    const client = new QueryClient();
    render(
      <QueryClientProvider client={client}>
        <MemberDetailPage params={{ studentId: '1' }} />
      </QueryClientProvider>
    );
    expect(await screen.findByText('Alice (1)')).toBeInTheDocument();
  });
});
