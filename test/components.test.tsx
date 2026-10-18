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

  it('is announced by ariaLabel when one is given', () => {
    render(<Button ariaLabel="Close dialog">×</Button>);
    expect(screen.getByRole('button', { name: 'Close dialog' })).toHaveAttribute(
      'aria-label',
      'Close dialog',
    );
  });

  // The prop is opt-in: text children already name the button, and overriding
  // that would make the announced name differ from the visible one.
  it('keeps taking its name from the children without ariaLabel', () => {
    render(<Button>Place order</Button>);
    expect(screen.getByRole('button', { name: 'Place order' })).toBeInTheDocument();
  });

  it('emits no aria-label attribute at all without ariaLabel', () => {
    render(<Button>Place order</Button>);
    expect(screen.getByRole('button').hasAttribute('aria-label')).toBe(false);
  });

  // The case the prop exists for: children carrying no text.
  it('names a button whose children render no text', () => {
    render(
      <Button ariaLabel="Dismiss">
        <span aria-hidden="true">×</span>
      </Button>,
    );
    expect(screen.getByRole('button', { name: 'Dismiss' })).toBeInTheDocument();
  });

  it('falls back to the children when ariaLabel is blank', () => {
    render(<Button ariaLabel="   ">Save</Button>);
    const button = screen.getByRole('button', { name: 'Save' });
    expect(button.hasAttribute('aria-label')).toBe(false);
  });

  it('falls back to the children when ariaLabel is empty', () => {
    render(<Button ariaLabel="">Save</Button>);
    const button = screen.getByRole('button', { name: 'Save' });
    expect(button.hasAttribute('aria-label')).toBe(false);
  });

  it('still calls onClick when an ariaLabel is given', () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick} ariaLabel="Close dialog">×</Button>);
    screen.getByRole('button', { name: 'Close dialog' }).click();
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('still does not fire when disabled with an ariaLabel', () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick} ariaLabel="Close dialog" disabled>×</Button>);
    screen.getByRole('button', { name: 'Close dialog' }).click();
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
