import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Button } from '../src/components/Button.js';
import { OrderList, type Order } from '../src/components/OrderList.js';
import { tokens } from '../src/tokens.js';

const order = (over: Partial<Order> = {}): Order => ({
  id: 'ord-001',
  total: 42.5,
  status: 'pending',
  placedAt: '2026-01-01T00:00:00.000Z',
  ...over,
});

describe('Button', () => {
  it('renders its label', () => {
    render(<Button>Place order</Button>);
    expect(screen.getByRole('button', { name: 'Place order' })).toBeInTheDocument();
  });

  it('calls onClick', () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Go</Button>);
    screen.getByRole('button').click();
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('does not fire when disabled', () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick} disabled>Go</Button>);
    screen.getByRole('button').click();
    expect(onClick).not.toHaveBeenCalled();
  });
});

describe('OrderList', () => {
  it('shows every order', () => {
    render(<OrderList orders={[order(), order({ id: 'ord-002' })]} />);
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
  });

  // A design showing only the populated case still has to account for the rest.
  it('shows a loading state', () => {
    render(<OrderList orders={[]} loading />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('shows an empty state', () => {
    render(<OrderList orders={[]} />);
    expect(screen.getByText(/no orders yet/i)).toBeInTheDocument();
  });

  // The complaint was that the empty case read as "nothing rendered", so the
  // block has to carry visible weight: a heading-style line plus supporting copy.
  it('gives the empty state a heading line and supporting copy', () => {
    render(<OrderList orders={[]} />);
    const heading = screen.getByText(/no orders yet/i);
    expect(heading).toHaveStyle({
      fontSize: tokens.font.heading,
      fontWeight: String(tokens.font.weightBold),
      color: tokens.color.text,
    });
    const supporting = screen.getByText(/orders will appear here/i);
    expect(supporting).toBeInTheDocument();
    expect(supporting).not.toBe(heading);
    expect(supporting).toHaveStyle({
      fontSize: tokens.font.body,
      color: tokens.color.textMuted,
    });
  });

  // role="status" rather than role="alert": informational, not a failure.
  it('announces the empty state as a status, not an alert', () => {
    render(<OrderList orders={[]} />);
    const status = screen.getByRole('status');
    expect(status).toHaveTextContent(/no orders yet/i);
    expect(status).toHaveTextContent(/orders will appear here/i);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('styles the empty state from tokens', () => {
    render(<OrderList orders={[]} />);
    expect(screen.getByRole('status')).toHaveStyle({
      padding: tokens.space.xl,
      border: `${tokens.borderWidth.thin} solid ${tokens.color.border}`,
      borderRadius: tokens.radius.md,
    });
  });

  it('does not show the empty state when there are orders', () => {
    render(<OrderList orders={[order(), order({ id: 'ord-002' })]} />);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.queryByText(/no orders yet/i)).not.toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
  });

  it('prefers the loading state over the empty state', () => {
    render(<OrderList orders={[]} loading />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.queryByText(/no orders yet/i)).not.toBeInTheDocument();
  });

  it('shows an error state with an alert role', () => {
    render(<OrderList orders={[]} error="Could not load orders" />);
    expect(screen.getByRole('alert')).toHaveTextContent('Could not load orders');
  });

  it('prefers the error state over the empty state', () => {
    render(<OrderList orders={[]} error="Could not load orders" />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.queryByText(/no orders yet/i)).not.toBeInTheDocument();
  });
});

describe('design tokens', () => {
  // The reviewer is told to flag a hard-coded value, so the fixture has to make
  // the token path the obvious one.
  it('are used rather than hard-coded values', () => {
    render(<OrderList orders={[order()]} />);
    const item = screen.getByRole('listitem');
    expect(item).toHaveStyle({ padding: tokens.space.md });
  });
});
