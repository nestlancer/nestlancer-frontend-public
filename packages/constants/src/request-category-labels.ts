/** Display labels for project request service categories (API enum values). */
export const REQUEST_CATEGORY_LABELS: Record<string, string> = {
  webDevelopment: 'Web Development',
  mobileApp: 'Mobile App',
  ecommerce: 'E-commerce',
  design: 'Design',
  branding: 'Branding',
  marketing: 'Marketing',
  seo: 'SEO',
  consulting: 'Consulting',
  maintenance: 'Maintenance',
  custom: 'Custom',
};

export function formatRequestCategory(category: string | null | undefined): string {
  if (!category?.trim()) return '—';
  return (
    REQUEST_CATEGORY_LABELS[category] ??
    category
      .replace(/([A-Z])/g, ' $1')
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase())
      .trim()
  );
}
