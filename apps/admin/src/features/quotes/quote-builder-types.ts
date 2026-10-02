export type QuoteFormTab = 'items' | 'pricing' | 'terms';

export const QUOTE_FORM_TABS: { id: QuoteFormTab; label: string; short: string }[] = [
  { id: 'items', label: 'Scope & line items', short: 'Scope' },
  { id: 'pricing', label: 'Pricing & schedule', short: 'Pricing' },
  { id: 'terms', label: 'Terms & review', short: 'Terms' },
];
