/**
 * Format number with thousand separators
 */
export function formatNumber(num: number): string {
  return num.toLocaleString();
}

/**
 * Format token balance for display
 */
export function formatTokenBalance(balance: number): string {
  if (balance >= 1_000_000) {
    return `${(balance / 1_000_000).toFixed(2)}M`;
  }
  if (balance >= 1_000) {
    return `${(balance / 1_000).toFixed(1)}K`;
  }
  return balance.toString();
}

/**
 * Format timestamp for message display
 */
export function formatTimestamp(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  // Less than 1 minute
  if (diff < 60_000) {
    return 'Just now';
  }

  // Less than 1 hour
  if (diff < 3_600_000) {
    const minutes = Math.floor(diff / 60_000);
    return `${minutes}m ago`;
  }

  // Less than 24 hours
  if (diff < 86_400_000) {
    const hours = Math.floor(diff / 3_600_000);
    return `${hours}h ago`;
  }

  // Less than 7 days
  if (diff < 604_800_000) {
    const days = Math.floor(diff / 86_400_000);
    return `${days}d ago`;
  }

  // Format as date
  return date.toLocaleDateString();
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  return text.substring(0, maxLength - 3) + '...';
}
