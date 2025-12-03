// This file teaches TypeScript about the extra jest-dom matchers
// so that `expect(...).toBeInTheDocument()` type-checks.

import '@testing-library/jest-dom';

declare global {
  namespace jest {
    interface Matchers<R = void> {
      toBeInTheDocument(): R;
      toBeVisible(): R;
      toBeEmpty(): R;
      toBeDisabled(): R;
      toBeEnabled(): R;
      toBeInvalid(): R;
      toBeRequired(): R;
      toBeValid(): R;
      toContainElement(element: HTMLElement | null): R;
      toContainHTML(html: string): R;
      toHaveAttribute(attr: string, value?: string): R;
      toHaveClass(...classNames: string[]): R;
      toHaveFocus(): R;
      toHaveFormValues(values: Record<string, any>): R;
      toHaveStyle(css: string | Record<string, any>): R;
      toHaveTextContent(text: string | RegExp, options?: { normalizeWhitespace: boolean }): R;
      toHaveValue(value: string | string[] | number): R;
      toHaveDisplayValue(value: string | string[]): R;
      toBeChecked(): R;
      toBePartiallyChecked(): R;
      toHaveErrorMessage(message: string | RegExp): R;
    }

    interface Expect {
      <T = any>(actual: T): JestMatchers<T>;
    }

    interface JestMatchers<T> extends Matchers<void> {
      not: Matchers<void>;
    }
  }
}