import type { Category } from '../model';
export const categoryArt: Record<Category, string> = { mains: 'turkey', sides: 'sides', appetizers: 'appetizers', desserts: 'desserts', drinks: 'drinks' };
export function Illustration({ name, className = '', loading = 'eager' }: {
    name: string;
    className?: string;
    loading?: 'eager' | 'lazy';
}) {
    return <img className={`illustration illustration-${name} ${className}`} src={`/assets/illustrations/${name}.png`} alt="" draggable={false} loading={loading} decoding="async"/>;
}
export function Chevron() { return <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="m6 3 5 5-5 5" stroke="currentColor" strokeWidth="1.2"/></svg>; }
