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

  it('renders a heading from the title prop alongside the orders', () => {
    render(<OrderList title="Recent orders" orders={[order(), order({ id: 'ord-002' })]} />);
    expect(screen.getByRole('heading', { name: 'Recent orders' })).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
  });

  it('puts the heading before the list in document order', () => {
    render(<OrderList title="Recent orders" orders={[order(), order({ id: 'ord-002' })]} />);
    const heading = screen.getByRole('heading', { name: 'Recent orders' });
    const list = screen.getByRole('list');
    expect(heading.compareDocumentPosition(list) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('renders no heading when no title is given', () => {
    render(<OrderList orders={[order(), order({ id: 'ord-002' })]} />);
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
  });

  // A blank title is no title; an empty heading is an accessibility defect.
  it.each([['', 'empty'], ['   ', 'whitespace-only']])(
    'renders no heading for a %s title (%s)',
    (title) => {
      render(<OrderList title={title} orders={[order()]} />);
      expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    },
  );

  // The heading belongs to the region, so it survives every one of the states.
  it('keeps the heading in the loading state', () => {
    render(<OrderList title="Recent orders" orders={[]} loading />);
    expect(screen.getByRole('heading', { name: 'Recent orders' })).toBeInTheDocument();
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('keeps the heading in the error state', () => {
    render(<OrderList title="Recent orders" orders={[]} error="Could not load orders" />);
    expect(screen.getByRole('heading', { name: 'Recent orders' })).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('Could not load orders');
  });

  it('keeps the heading in the empty state', () => {
    render(<OrderList title="Recent orders" orders={[]} />);
    expect(screen.getByRole('heading', { name: 'Recent orders' })).toBeInTheDocument();
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

  it('style the heading from tokens', () => {
    render(<OrderList title="Recent orders" orders={[order()]} />);
    expect(screen.getByRole('heading', { name: 'Recent orders' })).toHaveStyle({
      fontSize: tokens.font.heading,
      color: tokens.color.text,
    });
  });
});
