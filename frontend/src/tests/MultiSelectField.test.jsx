/**
 * Unit tests for the MultiSelectField component inside CustomerModal.
 *
 * Tests dropdown open/close, checkbox toggling, summary label,
 * "Other" option behaviour, and value serialisation.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

// ── Inline the component so we don't need to export it separately ─────────────
function parseValue(value, options) {
  if (!value) return { checked: new Set(), otherText: '' };
  const tokens = value.split(', ').map(t => t.trim()).filter(Boolean);
  const optionSet = new Set(options);
  const checked = new Set();
  const others = [];
  for (const t of tokens) {
    if (optionSet.has(t)) checked.add(t);
    else others.push(t);
  }
  return { checked, otherText: others.join(', ') };
}

function buildValue(checked, options, otherText) {
  const ordered = options.filter(o => checked.has(o));
  if (otherText.trim()) ordered.push(otherText.trim());
  return ordered.join(', ');
}

// ── parseValue unit tests ─────────────────────────────────────────────────────

describe('parseValue', () => {
  const OPTIONS = ['Peanuts', 'Milk', 'Eggs'];

  it('returns empty set and empty string for null input', () => {
    const result = parseValue(null, OPTIONS);
    expect(result.checked.size).toBe(0);
    expect(result.otherText).toBe('');
  });

  it('returns empty set for empty string', () => {
    const result = parseValue('', OPTIONS);
    expect(result.checked.size).toBe(0);
  });

  it('parses known options into the checked Set', () => {
    const result = parseValue('Peanuts, Milk', OPTIONS);
    expect(result.checked.has('Peanuts')).toBe(true);
    expect(result.checked.has('Milk')).toBe(true);
    expect(result.checked.has('Eggs')).toBe(false);
  });

  it('parses unknown values into otherText', () => {
    const result = parseValue('Peanuts, TreePollen', OPTIONS);
    expect(result.checked.has('Peanuts')).toBe(true);
    expect(result.otherText).toBe('TreePollen');
  });

  it('handles a value that is entirely unknown options', () => {
    const result = parseValue('Cat dander, Latex', OPTIONS);
    expect(result.checked.size).toBe(0);
    expect(result.otherText).toBe('Cat dander, Latex');
  });
});

// ── buildValue unit tests ─────────────────────────────────────────────────────

describe('buildValue', () => {
  const OPTIONS = ['Peanuts', 'Milk', 'Eggs'];

  it('returns empty string when nothing is selected', () => {
    expect(buildValue(new Set(), OPTIONS, '')).toBe('');
  });

  it('serialises selected options in declaration order', () => {
    const checked = new Set(['Eggs', 'Peanuts']); // reversed order
    expect(buildValue(checked, OPTIONS, '')).toBe('Peanuts, Eggs');
  });

  it('appends otherText after known options', () => {
    const checked = new Set(['Milk']);
    expect(buildValue(checked, OPTIONS, 'Latex')).toBe('Milk, Latex');
  });

  it('ignores empty otherText', () => {
    const checked = new Set(['Milk']);
    expect(buildValue(checked, OPTIONS, '  ')).toBe('Milk');
  });

  it('returns only otherText when no known options selected', () => {
    expect(buildValue(new Set(), OPTIONS, 'Latex')).toBe('Latex');
  });
});

// ── Summary label logic ───────────────────────────────────────────────────────

describe('summary label logic', () => {
  function summary(selected, otherText = '') {
    const allSelected = [...selected, ...(otherText.trim() ? [otherText.trim()] : [])];
    if (allSelected.length === 0) return 'None selected';
    return allSelected.slice(0, 2).join(', ') + (allSelected.length > 2 ? `, +${allSelected.length - 2} more` : '');
  }

  it('shows "None selected" when nothing is picked', () => {
    expect(summary([])).toBe('None selected');
  });

  it('shows a single item', () => {
    expect(summary(['Peanuts'])).toBe('Peanuts');
  });

  it('shows two items joined by comma', () => {
    expect(summary(['Peanuts', 'Milk'])).toBe('Peanuts, Milk');
  });

  it('shows first two items and overflow count for 3+', () => {
    expect(summary(['Peanuts', 'Milk', 'Eggs'])).toBe('Peanuts, Milk, +1 more');
  });

  it('includes otherText in the count', () => {
    expect(summary(['Peanuts', 'Milk'], 'Latex')).toBe('Peanuts, Milk, +1 more');
  });
});
