import type { CSSProperties, ReactNode } from 'react';
import { tokens } from '../tokens.js';

export interface ButtonProps {
  readonly children: ReactNode;
  readonly onClick?: () => void;
  readonly variant?: 'primary' | 'secondary';
  readonly disabled?: boolean;
  /**
   * Accessible name for buttons whose children carry no text — an icon, an SVG,
   * a glyph-only span. Omit it when the children are text: the name already
   * comes from them, and overriding it would make the announced name differ
   * from the visible one (WCAG 2.5.3, Label in Name).
   */
  readonly ariaLabel?: string;
}

export function Button({ children, onClick, variant = 'primary', disabled = false, ariaLabel }: ButtonProps) {
  // A blank label is a caller mistake: emitting it would leave the button with
  // no name at all, which is worse than falling back to the children.
  const label = ariaLabel?.trim();
  const style: CSSProperties = {
    padding: `${tokens.space.sm} ${tokens.space.md}`,
    borderRadius: tokens.radius.sm,
    fontSize: tokens.font.body,
    fontWeight: tokens.font.weightBold,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    border: variant === 'primary' ? 'none' : `1px solid ${tokens.color.border}`,
    background: variant === 'primary' ? tokens.color.accent : tokens.color.surface,
    color: variant === 'primary' ? tokens.color.surface : tokens.color.text,
  };
  return (
    <button type="button" style={style} onClick={onClick} disabled={disabled} aria-label={label || undefined}>
      {children}
    </button>
  );
}
