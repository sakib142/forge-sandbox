import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Button } from '../src/components/Button.js';
import { OrderList, type Order } from '../src/components/OrderList.js';
import { tokens } from '../src/tokens.js';
import { SORT_STORAGE_KEY } from '../src/useSortPreference.js';

const order = (over: Partial<Order> = {}): Order => ({
  id: 'ord-001',
  total: 42.5,
  status: 'pending',
  placedAt: '2026-01-01T00:00:00.000Z',
  ...over,
});

const COLUMN_LABELS = ['Order', 'Status', 'Total', 'Placed'] as const;

/** The tbody, so the header row is not counted as data. */
const body = () => screen.getAllByRole('rowgroup')[1];
const bodyRows = () => within(body()).getAllByRole('row');
/** The text of one column, top to bottom. */
const column = (index: number) =>
  bodyRows().map((row) => within(row).getAllByRole('cell')[index].textContent);
const header = (label: string) => screen.getByRole('columnheader', { name: label });
const sortBy = (label: string) => fireEvent.click(screen.getByRole('button', { name: label }));

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
  beforeEach(() => {
    // A preference persists by design, so each test has to start without one.
    vi.restoreAllMocks();
    window.localStorage.clear();
  });

  it('shows every order', () => {
    render(<OrderList orders={[order(), order({ id: 'ord-002' })]} />);
    expect(bodyRows()).toHaveLength(2);
  });

  it('renders a table of four labelled columns and one row per order', () => {
    render(<OrderList orders={[order(), order({ id: 'ord-002' })]} />);

    const table = screen.getByRole('table', { name: 'Orders' });
    const headers = within(table).getAllByRole('columnheader');
    expect(headers.map((cell) => cell.textContent)).toEqual([...COLUMN_LABELS]);
    expect(within(screen.getAllByRole('rowgroup')[0]).getAllByRole('row')).toHaveLength(1);
    expect(bodyRows()).toHaveLength(2);
  });

  // A natively disabled control leaves the tab order, so a keyboard user would
  // never reach it to hear why it was unavailable.
  it.each([
    ['populated', <OrderList orders={[order()]} />],
    ['empty', <OrderList orders={[]} />],
    ['loading', <OrderList orders={[]} loading />],
  ])('offers an enabled sort button per column while %s', (_state, element) => {
    render(element);

    for (const label of COLUMN_LABELS) {
      const button = within(header(label)).getByRole('button', { name: label });
      expect(button).toBeEnabled();
    }
  });

  it('sorts by total ascending on the first click', () => {
    render(
      <OrderList
        orders={[
          order({ id: 'ord-001', total: 150 }),
          order({ id: 'ord-002', total: 7 }),
          order({ id: 'ord-003', total: 42.5 }),
        ]}
      />,
    );

    sortBy('Total');

    expect(column(2)).toEqual(['$7.00', '$42.50', '$150.00']);
    expect(header('Total')).toHaveAttribute('aria-sort', 'ascending');
  });

  it('flips to descending on a second click of the same column', () => {
    render(
      <OrderList
        orders={[
          order({ id: 'ord-001', total: 150 }),
          order({ id: 'ord-002', total: 7 }),
          order({ id: 'ord-003', total: 42.5 }),
        ]}
      />,
    );

    sortBy('Total');
    sortBy('Total');

    expect(column(2)).toEqual(['$150.00', '$42.50', '$7.00']);
    expect(header('Total')).toHaveAttribute('aria-sort', 'descending');
  });

  it('reports a sort direction on exactly one column', () => {
    render(<OrderList orders={[order(), order({ id: 'ord-002', total: 7 })]} />);

    sortBy('Total');
    sortBy('Placed');

    expect(header('Placed')).toHaveAttribute('aria-sort', 'ascending');
    expect(header('Total')).toHaveAttribute('aria-sort', 'none');
    expect(header('Order')).toHaveAttribute('aria-sort', 'none');
    expect(header('Status')).toHaveAttribute('aria-sort', 'none');
  });

  it('sorts by the placed date, which it also displays', () => {
    render(
      <OrderList
        orders={[
          order({ id: 'ord-001', placedAt: '2026-03-02T09:00:00.000Z' }),
          order({ id: 'ord-002', placedAt: '2026-01-15T09:00:00.000Z' }),
          order({ id: 'ord-003', placedAt: '2026-02-20T09:00:00.000Z' }),
        ]}
      />,
    );

    sortBy('Placed');

    expect(column(3)).toEqual(['2026-01-15', '2026-02-20', '2026-03-02']);
  });

  it('sorts by order id', () => {
    render(
      <OrderList
        orders={[order({ id: 'ord-003' }), order({ id: 'ord-001' }), order({ id: 'ord-002' })]}
      />,
    );

    sortBy('Order');

    expect(column(0)).toEqual(['ord-001', 'ord-002', 'ord-003']);
  });

  it('keeps the passed order of rows whose sort key is equal', () => {
    render(
      <OrderList
        orders={[
          order({ id: 'ord-a', status: 'pending' }),
          order({ id: 'ord-b', status: 'pending' }),
          order({ id: 'ord-c', status: 'pending' }),
        ]}
      />,
    );

    sortBy('Status');
    expect(column(0)).toEqual(['ord-a', 'ord-b', 'ord-c']);

    sortBy('Status');
    expect(column(0)).toEqual(['ord-a', 'ord-b', 'ord-c']);
  });

  it('renders unsorted with no stored preference', () => {
    render(<OrderList orders={[order({ id: 'ord-002' }), order({ id: 'ord-001' })]} />);

    expect(column(0)).toEqual(['ord-002', 'ord-001']);
    for (const label of COLUMN_LABELS) {
      expect(header(label)).toHaveAttribute('aria-sort', 'none');
    }
  });

  it('restores the sort preference on a later render', () => {
    const orders = [
      order({ id: 'ord-001', total: 150 }),
      order({ id: 'ord-002', total: 7 }),
      order({ id: 'ord-003', total: 42.5 }),
    ];
    const { unmount } = render(<OrderList orders={orders} />);
    sortBy('Total');
    sortBy('Total');
    unmount();

    render(<OrderList orders={orders} />);

    expect(column(2)).toEqual(['$150.00', '$42.50', '$7.00']);
    expect(header('Total')).toHaveAttribute('aria-sort', 'descending');
  });

  it.each([
    ['is not valid JSON', 'not json at all {'],
    ['names an unknown column', JSON.stringify({ column: 'customer', direction: 'ascending' })],
    ['names an unknown direction', JSON.stringify({ column: 'total', direction: 'sideways' })],
  ])('ignores a stored preference that %s', (_case, stored) => {
    window.localStorage.setItem(SORT_STORAGE_KEY, stored);

    render(<OrderList orders={[order({ id: 'ord-002', total: 150 }), order({ id: 'ord-001' })]} />);

    expect(column(0)).toEqual(['ord-002', 'ord-001']);
    for (const label of COLUMN_LABELS) {
      expect(header(label)).toHaveAttribute('aria-sort', 'none');
    }
  });

  it('still sorts when storage throws on both read and write', () => {
    const denied = () => {
      throw new Error('storage disabled');
    };
    // On the prototype, because jsdom's Storage does not keep an own property
    // assigned to the instance.
    const getItem = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(denied);
    const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(denied);

    render(
      <OrderList orders={[order({ id: 'ord-001', total: 150 }), order({ id: 'ord-002', total: 7 })]} />,
    );
    sortBy('Total');

    // Both failing paths were actually taken, so the test cannot pass by
    // never reaching storage at all.
    expect(getItem).toHaveBeenCalled();
    expect(setItem).toHaveBeenCalled();
    expect(column(2)).toEqual(['$7.00', '$150.00']);
    expect(header('Total')).toHaveAttribute('aria-sort', 'ascending');
  });

  it('does not mutate the orders it was given', () => {
    const orders = Object.freeze([
      order({ id: 'ord-001', total: 150 }),
      order({ id: 'ord-002', total: 7 }),
    ]);

    render(<OrderList orders={orders} />);
    sortBy('Total');
    sortBy('Total');
    sortBy('Order');

    expect(orders).toHaveLength(2);
    expect(orders.map((o) => o.id)).toEqual(['ord-001', 'ord-002']);
  });

  // A design showing only the populated case still has to account for the rest.
  it('shows a loading state', () => {
    render(<OrderList orders={[]} loading />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('shows a skeleton while loading and no order data', () => {
    render(<OrderList orders={[order()]} loading />);

    const status = screen.getByRole('status');
    expect(status).toHaveAttribute('aria-busy', 'true');
    expect(status).toContainElement(screen.getByText('Loading orders…'));

    const bars = status.querySelectorAll('td > div[aria-hidden="true"]');
    expect(bars.length).toBeGreaterThan(0);
    expect(bars[0]).toHaveStyle({
      background: tokens.color.border,
      borderRadius: tokens.radius.sm,
    });
    expect(screen.queryByText('ord-001')).not.toBeInTheDocument();
  });

  it('prefers the skeleton over the empty state', () => {
    render(<OrderList orders={[]} loading />);

    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.queryByText(/no orders yet/i)).not.toBeInTheDocument();
  });

  it('shows an empty state', () => {
    render(<OrderList orders={[]} />);
    expect(screen.getByText(/no orders yet/i)).toBeInTheDocument();
  });

  it('shows the empty state without alerting about it', () => {
    render(<OrderList orders={[]} />);

    const message = screen.getByText('No orders yet.');
    expect(message).not.toHaveAttribute('role', 'alert');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(bodyRows()).toHaveLength(1);
    expect(within(body()).getAllByRole('cell')).toHaveLength(1);
  });

  it('shows a caller-supplied empty message instead', () => {
    render(<OrderList orders={[]} emptyMessage="No orders match your filters." />);

    expect(screen.getByText('No orders match your filters.')).toBeInTheDocument();
    expect(screen.queryByText(/no orders yet/i)).not.toBeInTheDocument();
  });

  it('keeps the sort controls usable while empty', () => {
    render(<OrderList orders={[]} />);

    expect(screen.getAllByRole('columnheader')).toHaveLength(4);
    sortBy('Status');

    expect(header('Status')).toHaveAttribute('aria-sort', 'ascending');
    expect(screen.getByText('No orders yet.')).toBeInTheDocument();
  });

  it('shows an error state with an alert role', () => {
    render(<OrderList orders={[]} error="Could not load orders" />);
    expect(screen.getByRole('alert')).toHaveTextContent('Could not load orders');
  });

  it('prefers the error over the empty state and shows no rows', () => {
    render(<OrderList orders={[]} error="Could not load orders" />);

    expect(screen.getByRole('alert')).toHaveTextContent('Could not load orders');
    expect(screen.queryByText(/no orders yet/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('row')).not.toBeInTheDocument();
  });
});

describe('design tokens', () => {
  // The reviewer is told to flag a hard-coded value, so the fixture has to make
  // the token path the obvious one.
  it('are used rather than hard-coded values', () => {
    render(<OrderList orders={[order()]} />);
    const cell = screen.getAllByRole('cell')[0];
    expect(cell).toHaveStyle({ padding: tokens.space.md });
  });

  it('style the empty state too', () => {
    render(<OrderList orders={[]} />);
    expect(screen.getByText('No orders yet.')).toHaveStyle({
      padding: tokens.space.lg,
      color: tokens.color.textMuted,
    });
  });

  // The loading and error states carry text of their own, and a margin reset
  // is the value most easily written raw, so both are pinned to tokens.
  it('style the loading caption too', () => {
    render(<OrderList orders={[]} loading />);
    const caption = screen.getByText('Loading orders…');
    expect(caption).toHaveStyle({
      padding: tokens.space.md,
      fontSize: tokens.font.body,
      color: tokens.color.textMuted,
    });
    expect(caption.style.margin).toBe('');
  });

  it('style the error state too', () => {
    render(<OrderList orders={[]} error="Could not load orders" />);
    const alert = screen.getByRole('alert');
    expect(alert).toHaveStyle({
      padding: tokens.space.md,
      fontSize: tokens.font.body,
      color: tokens.color.danger,
    });
    expect(alert.style.margin).toBe('');
  });
});
