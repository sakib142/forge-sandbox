import type { CSSProperties } from 'react';
import { tokens } from '../tokens.js';
import { useSortPreference, type SortColumn, type SortPreference } from '../useSortPreference.js';

export interface Order {
  readonly id: string;
  readonly total: number;
  readonly status: 'pending' | 'shipped' | 'cancelled';
  readonly placedAt: string;
}

export interface OrderListProps {
  readonly orders: readonly Order[];
  readonly loading?: boolean;
  readonly error?: string;
  readonly emptyMessage?: string;
}

interface Column {
  readonly key: SortColumn;
  readonly label: string;
}

const COLUMNS: readonly Column[] = [
  { key: 'id', label: 'Order' },
  { key: 'status', label: 'Status' },
  { key: 'total', label: 'Total' },
  { key: 'placedAt', label: 'Placed' },
];

/** Widths are layout only; the bars carry no data, so they carry no tokens for it. */
const SKELETON_BAR_WIDTHS = ['60%', '50%', '40%', '70%'] as const;
const SKELETON_ROWS = [0, 1, 2] as const;

const tableStyle: CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  background: tokens.color.surface,
  fontSize: tokens.font.body,
  color: tokens.color.text,
};

const headerCellStyle: CSSProperties = {
  padding: tokens.space.sm,
  borderBottom: `1px solid ${tokens.color.border}`,
  textAlign: 'left',
  fontSize: tokens.font.body,
  fontWeight: tokens.font.weightBold,
  color: tokens.color.text,
};

const headerButtonStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: tokens.space.xs,
  padding: tokens.space.xs,
  border: 'none',
  borderRadius: tokens.radius.sm,
  background: tokens.color.surface,
  fontSize: tokens.font.body,
  fontWeight: tokens.font.weightBold,
  color: tokens.color.text,
  cursor: 'pointer',
};

const cellStyle: CSSProperties = {
  padding: tokens.space.md,
  borderBottom: `1px solid ${tokens.color.border}`,
  fontSize: tokens.font.body,
  fontWeight: tokens.font.weightRegular,
  color: tokens.color.text,
};

const messageCellStyle: CSSProperties = {
  padding: tokens.space.lg,
  fontSize: tokens.font.body,
  fontWeight: tokens.font.weightRegular,
  color: tokens.color.textMuted,
};

const captionStyle: CSSProperties = {
  padding: tokens.space.md,
  fontSize: tokens.font.body,
  fontWeight: tokens.font.weightRegular,
  color: tokens.color.textMuted,
};

const errorStyle: CSSProperties = {
  padding: tokens.space.md,
  fontSize: tokens.font.body,
  fontWeight: tokens.font.weightRegular,
  color: tokens.color.danger,
};

function compare(a: Order, b: Order, column: SortColumn): number {
  switch (column) {
    case 'total':
      return a.total - b.total;
    // ISO-8601 sorts chronologically as plain text, which keeps the ordering
    // free of any timezone the parser would otherwise apply.
    case 'placedAt':
      return a.placedAt < b.placedAt ? -1 : a.placedAt > b.placedAt ? 1 : 0;
    default:
      return a[column].localeCompare(b[column]);
  }
}

function sortOrders(orders: readonly Order[], preference: SortPreference | null): readonly Order[] {
  if (preference === null) return orders;
  // A copy, because the prop is read-only and may be frozen. Array#sort is
  // stable, so rows with an equal key keep the order the caller passed.
  return [...orders].sort((a, b) => {
    const result = compare(a, b, preference.column);
    return preference.direction === 'ascending' ? result : -result;
  });
}

/**
 * The header row. Present in every state that renders the table, because a
 * sort control that disappears while the data loads cannot be reached, and a
 * natively disabled one leaves the tab order entirely.
 */
function SortableHeader({
  preference,
  onSort,
}: {
  readonly preference: SortPreference | null;
  readonly onSort: (column: SortColumn) => void;
}) {
  return (
    <thead>
      <tr>
        {COLUMNS.map((column) => {
          const active = preference?.column === column.key;
          return (
            <th
              key={column.key}
              scope="col"
              aria-sort={active ? preference.direction : 'none'}
              style={headerCellStyle}
            >
              <button type="button" onClick={() => onSort(column.key)} style={headerButtonStyle}>
                {column.label}
                {active ? (
                  // Shape as well as colour, and aria-sort for assistive
                  // technology, so the glyph itself need not be announced.
                  <span aria-hidden="true" style={{ color: tokens.color.accent }}>
                    {preference.direction === 'ascending' ? '▲' : '▼'}
                  </span>
                ) : null}
              </button>
            </th>
          );
        })}
      </tr>
    </thead>
  );
}

/**
 * Every state a real list has: loading, error, empty, and populated. A design
 * that shows only the populated case still has to account for the rest.
 */
export function OrderList({
  orders,
  loading = false,
  error,
  emptyMessage = 'No orders yet.',
}: OrderListProps) {
  const [preference, setPreference] = useSortPreference();

  const handleSort = (column: SortColumn) => {
    const ascending = !(preference?.column === column && preference.direction === 'ascending');
    setPreference({ column, direction: ascending ? 'ascending' : 'descending' });
  };

  const header = <SortableHeader preference={preference} onSort={handleSort} />;

  if (loading) {
    return (
      <div role="status" aria-busy="true" style={{ background: tokens.color.surface }}>
        <table aria-label="Orders" style={tableStyle}>
          {header}
          <tbody>
            {SKELETON_ROWS.map((row) => (
              <tr key={row}>
                {SKELETON_BAR_WIDTHS.map((width, index) => (
                  <td key={COLUMNS[index].key} style={cellStyle}>
                    <div
                      aria-hidden="true"
                      style={{
                        width,
                        height: tokens.font.body,
                        background: tokens.color.border,
                        borderRadius: tokens.radius.sm,
                      }}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {/* A div rather than a p, so the caption needs no margin reset: there
            is no spacing token for zero, and a raw 0 would go around them. */}
        <div style={captionStyle}>Loading orders…</div>
      </div>
    );
  }

  if (error !== undefined) {
    return (
      <div role="alert" style={errorStyle}>
        {error}
      </div>
    );
  }

  const rows = sortOrders(orders, preference);

  return (
    <table aria-label="Orders" style={tableStyle}>
      {header}
      <tbody>
        {rows.length === 0 ? (
          // In the tbody rather than instead of the table, so the column
          // headers and their sort controls survive an empty result.
          <tr>
            <td colSpan={COLUMNS.length} style={messageCellStyle}>
              {emptyMessage}
            </td>
          </tr>
        ) : (
          rows.map((order) => (
            <tr key={order.id}>
              <td style={cellStyle}>{order.id}</td>
              <td style={cellStyle}>{order.status}</td>
              <td style={cellStyle}>${order.total.toFixed(2)}</td>
              <td style={cellStyle}>{order.placedAt.slice(0, 10)}</td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
}
