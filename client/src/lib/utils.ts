import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import DOMPurify from 'dompurify';
import { marked } from 'marked';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Returns today's date formatted as YYYY-MM-DD in the user's local timezone.
 */
export function getTodayString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Formats a date string (YYYY-MM-DD or ISO) into human readable text (e.g. "18 Oct 2026").
 */
export function formatDate(
  dateStr?: string | null,
  options?: Intl.DateTimeFormatOptions
): string {
  if (!dateStr) return '';
  // Ensure date parsing doesn't shift due to UTC offset
  const parts = dateStr.split('T')[0].split('-');
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const date = new Date(year, month, day);
    return date.toLocaleDateString('en-GB', options || {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-GB', options || {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Parses markdown to HTML and purifies it safely to prevent XSS.
 */
export function renderSafeMarkdown(markdownText: string): string {
  if (!markdownText) return '';
  const rawHtml = marked.parse(markdownText, { async: false }) as string;
  return DOMPurify.sanitize(rawHtml, {
    ALLOWED_TAGS: [
      'p', 'b', 'i', 'em', 'strong', 'a', 'ul', 'ol', 'li', 'h1', 'h2', 'h3',
      'h4', 'blockquote', 'code', 'pre', 'hr', 'br', 'span'
    ],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'class'],
  });
}
