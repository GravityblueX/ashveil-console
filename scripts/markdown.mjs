export function markdownTableCell(value) {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/\r\n/g, '<br>')
    .replace(/[\r\n]/g, '<br>')
    .replace(/\|/g, '\\|');
}

export function markdownCodeSpan(value) {
  if (value === null || value === undefined) return '';
  const text = String(value)
    .replace(/\r\n/g, ' ')
    .replace(/[\r\n]/g, ' ');
  if (text.length === 0) return '';
  const tableSafe = text.replace(/\|/g, '\\|');
  const maxTicks = Math.max(
    0,
    ...Array.from(tableSafe.matchAll(/`+/g), (match) => match[0].length)
  );
  const fence = '`'.repeat(maxTicks + 1);
  const padded =
    tableSafe.startsWith('`') || tableSafe.endsWith('`') ? ` ${tableSafe} ` : tableSafe;
  return `${fence}${padded}${fence}`;
}
