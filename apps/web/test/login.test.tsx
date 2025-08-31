import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import * as matchers from '@testing-library/jest-dom/matchers';
expect.extend(matchers);

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock('../lib/auth', () => ({ login: vi.fn() }));
import LoginPage from '../app/login/page';

describe('login form', () => {
  it('shows validation errors', async () => {
    render(<LoginPage />);
    await userEvent.click(screen.getByRole('button', { name: '로그인' }));
    expect(await screen.findByText('Invalid email')).toBeInTheDocument();
    expect(await screen.findByText('String must contain at least 1 character(s)')).toBeInTheDocument();
  });
});
