export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

export function formatDate(date: string | Date): string {
  const d = new Date(date);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) {
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } else if (days === 1) {
    return "Yesterday";
  } else if (days < 7) {
    return d.toLocaleDateString([], { weekday: "short" });
  } else {
    return d.toLocaleDateString([], { month: "short", day: "numeric" });
  }
}

export function formatDateFull(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString([], {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function groupConversationsByDate(conversations: any[]) {
  const groups: Record<string, any[]> = {
    Today: [],
    Yesterday: [],
    "Last 7 days": [],
    Older: [],
  };

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterdayStart = new Date(todayStart.getTime() - 24 * 60 * 60 * 1000);
  const weekStart = new Date(todayStart.getTime() - 7 * 24 * 60 * 60 * 1000);

  for (const conv of conversations) {
    const lastMsg = new Date(conv.last_message_at || conv.created_at);
    if (lastMsg >= todayStart) {
      groups.Today.push(conv);
    } else if (lastMsg >= yesterdayStart) {
      groups.Yesterday.push(conv);
    } else if (lastMsg >= weekStart) {
      groups["Last 7 days"].push(conv);
    } else {
      groups.Older.push(conv);
    }
  }

  return Object.entries(groups)
    .filter(([, convs]) => convs.length > 0)
    .map(([label, convs]) => ({ label, conversations: convs }));
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function formatPrice(price: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: price % 1 === 0 ? 0 : 2,
  }).format(price);
}

export function truncate(str: string, len: number): string {
  if (str.length <= len) return str;
  return str.slice(0, len).trim() + "...";
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}