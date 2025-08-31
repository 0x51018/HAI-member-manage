import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, vi, expect, beforeEach } from 'vitest';
import * as matchers from '@testing-library/jest-dom/matchers';
expect.extend(matchers);

var apiFetch: any;
vi.mock('../lib/api', () => {
  apiFetch = vi.fn((path: string) => {
    if (path === '/events/1') {
      return Promise.resolve({ json: () => Promise.resolve({ id: '1', title: 'Test Event', participants: [] }) });
    }
    if (path === '/events/1/export?fields=phone,name&format=csv') {
      return Promise.resolve({ text: () => Promise.resolve('data') });
    }
    throw new Error('unknown path');
  });
  return { default: apiFetch };
});

vi.mock('@packages/types', () => ({
  EventDetailSchema: { parse: (v: any) => v },
  EventParticipantSchema: { parse: (v: any) => v },
  MemberSummarySchema: { parse: (v: any) => v }
}));

import EventDetailPage from '../app/events/[eventId]/page';

beforeEach(() => {
  (global as any).URL.createObjectURL = vi.fn(() => 'blob:mock');
  (global as any).URL.revokeObjectURL = vi.fn();
});

describe('event export', () => {
  it('requests export when clicking button', async () => {
    const client = new QueryClient();
    render(
      <QueryClientProvider client={client}>
        <EventDetailPage params={{ eventId: '1' }} />
      </QueryClientProvider>
    );
    await screen.findByText('Test Event');
    await userEvent.click(screen.getByRole('button', { name: /Export CSV/i }));
    expect(apiFetch).toHaveBeenCalledWith('/events/1/export?fields=phone,name&format=csv');
  });
});
