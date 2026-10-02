/** Structured help copy for a single form field. */
export type FieldHelpContent = {
  /** One-sentence purpose */
  what: string;
  /** Format, enums, min/max, units */
  enter: string;
  /** Concrete value that passes validation */
  example?: string;
  /** Client vs admin visibility */
  visibility?: 'client' | 'admin' | 'both';
  /** Mark copy not sourced from backend DTO descriptions */
  assumed?: boolean;
};

export type FieldHelpKey = string;
