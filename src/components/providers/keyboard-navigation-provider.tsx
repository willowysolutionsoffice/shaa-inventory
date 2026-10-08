'use client';

import React, { useEffect } from 'react';

/**
 * Global Keyboard Navigation & Hotkeys Provider
 * 
 * Features:
 * 1. Enter Key Navigation:
 *    - In any form or modal, pressing Enter on an input field advances focus to the next field.
 *    - On the last field or submit button, pressing Enter submits the form.
 *    - Ctrl+Enter or Cmd+Enter immediately submits the active form.
 *    - Textareas retain standard multi-line Enter behavior (unless Ctrl+Enter is used).
 * 
 * 2. Hotkeys:
 *    - Alt+N or F2: Triggers the primary "Add / New" button on the current page (e.g. Add User, New Customer, New Sale, Add Product, etc.)
 *    - Ctrl+S / Cmd+S: Submits the active form without triggering the browser's save web page dialog.
 *    - Ctrl+K or F3: Focuses the first search/filter input on the current page.
 */
export function KeyboardNavigationProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      const tagName = target.tagName.toLowerCase();
      const isInput = tagName === 'input';
      const isSelect = tagName === 'select';
      const isTextarea = tagName === 'textarea';
      const isButton = tagName === 'button';
      const isCombobox = target.getAttribute('role') === 'combobox';

      // ──────────────────────────────────────────────────────────────────────────
      // 1. Hotkey: Ctrl+S / Cmd+S to submit active form
      // ──────────────────────────────────────────────────────────────────────────
      if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
        const activeForm = target.closest('form');
        if (activeForm) {
          e.preventDefault();
          const submitBtn = activeForm.querySelector<HTMLButtonElement>('button[type="submit"]:not([disabled])');
          if (submitBtn) {
            submitBtn.click();
          } else {
            activeForm.requestSubmit?.();
          }
          return;
        }
      }

      // ──────────────────────────────────────────────────────────────────────────
      // 2. Hotkey: Alt+N or F2 to trigger "Add / New / Create" modal/page
      // ──────────────────────────────────────────────────────────────────────────
      const isAltN = (e.altKey && (e.key === 'n' || e.key === 'N'));
      const isF2 = e.key === 'F2';

      if (isAltN || isF2) {
        // Only trigger if not already typing inside an open dialog or form
        const openDialog = document.querySelector('[role="dialog"]');
        if (!openDialog) {
          e.preventDefault();
          // Look for Add / New / Create button or link on the page
          const candidateButtons = Array.from(
            document.querySelectorAll<HTMLElement>('button:not([disabled]), a[href]')
          );

          const newBtn = candidateButtons.find((btn) => {
            const text = (btn.textContent || '').trim().toLowerCase();
            const ariaLabel = (btn.getAttribute('aria-label') || '').toLowerCase();
            return (
              text.startsWith('add ') ||
              text.startsWith('new ') ||
              text.startsWith('+ add') ||
              text.startsWith('+ new') ||
              text.startsWith('create ') ||
              text === 'add' ||
              text === 'new' ||
              ariaLabel.includes('add') ||
              ariaLabel.includes('create')
            );
          });

          if (newBtn) {
            newBtn.click();
            return;
          }
        }
      }

      // ──────────────────────────────────────────────────────────────────────────
      // 3. Hotkey: F3 or Ctrl+K to focus search input
      // ──────────────────────────────────────────────────────────────────────────
      const isF3 = e.key === 'F3';
      const isCtrlK = (e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K');
      if (isF3 || isCtrlK) {
        e.preventDefault();
        const searchInput = document.querySelector<HTMLInputElement>(
          'input[type="search"], input[placeholder*="search" i], input[placeholder*="scan" i], input[placeholder*="filter" i]'
        );
        if (searchInput) {
          searchInput.focus();
          searchInput.select?.();
          return;
        }
      }

      // ──────────────────────────────────────────────────────────────────────────
      // 4. Enter Key Navigation inside Forms and Modals
      // ──────────────────────────────────────────────────────────────────────────
      if (e.key === 'Enter') {
        // Allow textareas standard multi-line enter unless Ctrl/Cmd is pressed
        if (isTextarea && !e.ctrlKey && !e.metaKey) {
          return;
        }

        // Allow buttons and regular links to be clicked with Enter
        if (isButton && (target as HTMLButtonElement).type !== 'submit') {
          return;
        }

        const container = target.closest('form') || target.closest('[role="dialog"]');
        if (!container) return;

        // If Ctrl+Enter / Cmd+Enter: force form submission
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          if (container instanceof HTMLFormElement) {
            const submitBtn = container.querySelector<HTMLButtonElement>('button[type="submit"]:not([disabled])');
            if (submitBtn) {
              submitBtn.click();
            } else {
              container.requestSubmit?.();
            }
          }
          return;
        }

        // For inputs, selects, and comboboxes: move to next field
        if (isInput || isSelect || isCombobox) {
          const type = (target as HTMLInputElement).type;
          // Skip submit buttons or checkbox/radio where Enter is native
          if (type === 'submit' || type === 'reset') return;

          // Find all interactive focusable form elements in order
          const selector = [
            'input:not([type="hidden"]):not([type="submit"]):not([type="reset"]):not([disabled]):not([readonly])',
            'select:not([disabled])',
            'textarea:not([disabled]):not([readonly])',
            '[role="combobox"]:not([aria-disabled="true"])',
            'button[type="submit"]:not([disabled])',
          ].join(', ');

          const focusable = Array.from(container.querySelectorAll<HTMLElement>(selector)).filter((el) => {
            return (
              el.tabIndex !== -1 &&
              (el.offsetWidth > 0 || el.offsetHeight > 0 || el.getClientRects().length > 0) &&
              window.getComputedStyle(el).visibility !== 'hidden'
            );
          });

          const currentIndex = focusable.indexOf(target);

          if (currentIndex > -1 && currentIndex < focusable.length - 1) {
            e.preventDefault();
            const nextElement = focusable[currentIndex + 1];
            nextElement.focus();
            if (nextElement instanceof HTMLInputElement && nextElement.type !== 'date') {
              nextElement.select?.();
            }
          } else if (currentIndex === focusable.length - 1) {
            // Last element reached
            if (target instanceof HTMLButtonElement && target.type === 'submit') {
              // Standard button click will fire
              return;
            }
            e.preventDefault();
            if (container instanceof HTMLFormElement) {
              const submitBtn = container.querySelector<HTMLButtonElement>('button[type="submit"]:not([disabled])');
              if (submitBtn) {
                submitBtn.click();
              } else {
                container.requestSubmit?.();
              }
            }
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return <>{children}</>;
}
