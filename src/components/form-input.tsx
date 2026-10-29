'use client';
import type { InputHTMLAttributes } from 'react';

/** Keep native validation, editing shortcuts and mobile keyboards while filtering numeric input. */
export function FormInput({
  onChange,
  onKeyDown,
  onPaste,
  type,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  const numeric = type === 'number';
  const phone = type === 'tel';
  const signed = props.min != null && Number(props.min) < 0;
  const decimal = props.step === 'any' || (props.step != null && Number(props.step) < 1);
  return (
    <input
      {...props}
      type={type}
      maxLength={phone ? undefined : props.maxLength}
      inputMode={
        props.inputMode ?? (phone ? 'tel' : numeric ? (decimal ? 'decimal' : 'numeric') : undefined)
      }
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if (!numeric || event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey)
          return;
        if (
          event.key.length === 1 &&
          !/\d/.test(event.key) &&
          !(decimal && event.key === '.') &&
          !(signed && event.key === '-')
        )
          event.preventDefault();
      }}
      onPaste={(event) => {
        onPaste?.(event);
        if (!numeric || event.defaultPrevented) return;
        const text = event.clipboardData.getData('text').trim();
        const allowed = signed
          ? decimal
            ? /^-?\d*(?:\.\d*)?$/
            : /^-?\d+$/
          : decimal
            ? /^\d*(?:\.\d*)?$/
            : /^\d+$/;
        if (!allowed.test(text)) event.preventDefault();
      }}
      onChange={(event) => {
        if (phone) {
          const raw = event.currentTarget.value.trimStart();
          event.currentTarget.value = (raw.startsWith('+') ? '+' : '') + raw.replace(/\D/g, '');
        }
        onChange?.(event);
      }}
    />
  );
}
