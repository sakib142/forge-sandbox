import { tokens } from '../tokens.js';

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
}

/**
 * Every state a real list has: loading, error, empty, and populated. A design
 * that shows only the populated case still has to account for the rest.
 */
export function OrderList({ orders, loading = false, error }: OrderListProps) {
  if (loading) return <p style={{ color: tokens.color.textMuted }}>Loading orders…</p>;
  if (error !== undefined) return <p role="alert" style={{ color: tokens.color.danger }}>{error}</p>;
  if (orders.length === 0) return <p style={{ color: tokens.color.textMuted }}>No orders yet.</p>;

  const count = orders.length;

  return (
    <>
      <p
        role="status"
        style={{
          margin: 0,
          padding: tokens.space.sm,
          color: tokens.color.textMuted,
          fontSize: tokens.font.body,
        }}
      >
        {count} {count === 1 ? 'order' : 'orders'}
      </p>
      <ul aria-label="Orders" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {orders.map((order) => (
          <li
            key={order.id}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: tokens.space.md,
              borderBottomWidth: 1,
              borderBottomStyle: 'solid',
              borderBottomColor: tokens.color.border,
              fontSize: tokens.font.body,
              color: tokens.color.text,
            }}
          >
            <span>{order.id}</span>
            <span>{order.status}</span>
            <span>${order.total.toFixed(2)}</span>
          </li>
        ))}
      </ul>
    </>
  );
}
