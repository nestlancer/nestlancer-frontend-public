'use client';

import type { ReactNode } from 'react';
import clsx from 'clsx';

import { FieldHelp, type FieldHelpProps } from './FieldHelp';

export type FormFieldLabelProps = {
  htmlFor?: string;
  children: ReactNode;
  required?: boolean;
  className?: string;
  labelClassName?: string;
} & Pick<FieldHelpProps, 'fieldKey' | 'help' | 'label'>;

/**
 * Label row with optional required marker and `?` field help.
 * Replaces ad-hoc FieldLabel + static hint paragraphs.
 */
export function FormFieldLabel({
  htmlFor,
  children,
  required,
  className,
  labelClassName,
  fieldKey,
  help,
  label,
}: FormFieldLabelProps) {
  const helpLabel = label ?? (typeof children === 'string' ? children : 'this field');

  return (
    <div className={clsx('space-y-1', className)}>
      <div className="flex items-center gap-1.5">
        <label
          htmlFor={htmlFor}
          className={clsx('text-sm font-medium text-foreground', labelClassName)}
        >
          {children}
          {required ? <span className="text-destructive"> *</span> : null}
        </label>
        <FieldHelp fieldKey={fieldKey} help={help} label={helpLabel} />
      </div>
    </div>
  );
}
