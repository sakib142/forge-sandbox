import { readFileSync } from 'node:fs';
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

  it('shows an error state with an alert role', () => {
    render(<OrderList orders={[]} error="Could not load orders" />);
    expect(screen.getByRole('alert')).toHaveTextContent('Could not load orders');
  });

  it('counts the orders it lists', () => {
    render(
      <OrderList
        orders={[order(), order({ id: 'ord-002' }), order({ id: 'ord-003' })]}
      />,
    );
    expect(screen.getByText('3 orders')).toBeInTheDocument();
  });

  it('uses the singular for exactly one order', () => {
    render(<OrderList orders={[order()]} />);
    expect(screen.getByText('1 order')).toBeInTheDocument();
    expect(screen.queryByText(/1 orders/)).not.toBeInTheDocument();
  });

  it('exposes the count as a status region', () => {
    render(<OrderList orders={[order()]} />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('renders the count before the list', () => {
    render(<OrderList orders={[order(), order({ id: 'ord-002' })]} />);
    const count = screen.getByRole('status');
    const list = screen.getByRole('list', { name: 'Orders' });
    expect(
      count.compareDocumentPosition(list) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it('counts exactly as many orders as it renders', () => {
    render(
      <OrderList
        orders={[order(), order({ id: 'ord-002' }), order({ id: 'ord-003' })]}
      />,
    );
    const shown = Number(screen.getByRole('status').textContent?.match(/\d+/)?.[0]);
    expect(shown).toBe(screen.getAllByRole('listitem').length);
  });

  it('shows no count while loading', () => {
    render(<OrderList orders={[]} loading />);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.getByText('Loading orders…')).toBeInTheDocument();
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });

  it('shows no count when there is an error', () => {
    render(<OrderList orders={[]} error="Could not load orders" />);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('Could not load orders');
  });

  it('shows no count when there are no orders', () => {
    render(<OrderList orders={[]} />);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.getByText(/no orders yet/i)).toBeInTheDocument();
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

  it('style the order count', () => {
    render(<OrderList orders={[order()]} />);
    expect(screen.getByRole('status')).toHaveStyle({
      color: tokens.color.textMuted,
      fontSize: tokens.font.body,
    });
  });

  it('are the only source of colours and sizes in OrderList', () => {
    const source = readFileSync('src/components/OrderList.tsx', 'utf8');
    expect(source.match(/#[0-9a-fA-F]{3,8}\b/g)).toBeNull();
    expect(source.match(/\d+px/g)).toBeNull();
  });
});
