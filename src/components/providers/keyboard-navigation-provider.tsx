'use client';

import React, { useEffect } from 'react';

/**
 * Universal Keyboard Navigation & Hotkeys Provider
 * Applies POS-style keyboard-first navigation across the ENTIRE application:
 * 
 * 1. Automatic Dialog First-Field Focus:
 *    - When any modal or drawer opens (e.g. Add User, Add Customer, Add Product),
 *      the first input field is automatically focused so you can type immediately without a mouse.
 * 
 * 2. Bi-directional Step Navigation (POS / Zoho / Excel Style):
 *    - Enter: Advances focus to the NEXT field in forms, modals, or table rows.
 *    - Shift + Enter: Moves focus to the PREVIOUS field.
 *    - Last field + Enter: Automatically triggers form submission.
 * 
 * 3. Hotkeys & Global Shortcuts:
 *    - Alt + N or F2: Triggers "Add / New / Create" modal or action on any page.
 *    - Ctrl + S or Cmd + S: Saves / Submits the active form.
 *    - Ctrl + Enter or Cmd + Enter: Instantly submits the form from any field.
 *    - F3 or Ctrl + K: Focuses the search / filter input.
 *    - Escape: Closes open dialogs / drawers.
 * 
 * Zero UI alterations — works purely on the DOM event level.
 */
export function KeyboardNavigationProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // ──────────────────────────────────────────────────────────────────────────
    // Auto-focus first input when a dialog / modal opens
    // ──────────────────────────────────────────────────────────────────────────
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'childList') {
          for (const node of Array.from(mutation.addedNodes)) {
            if (node instanceof HTMLElement) {
              const dialog = node.matches('[role="dialog"]')
                ? node
                : node.querySelector<HTMLElement>('[role="dialog"]');
              if (dialog) {
                setTimeout(() => {
                  const firstInput = dialog.querySelector<HTMLElement>(
                    'input:not([type="hidden"]):not([disabled]):not([readonly]), textarea:not([disabled]):not([readonly]), select:not([disabled]), [role="combobox"]:not([aria-disabled="true"])'
                  );
                  if (firstInput) {
                    firstInput.focus();
                    if (firstInput instanceof HTMLInputElement && firstInput.type !== 'date') {
                      firstInput.select?.();
                    }
                  }
                }, 50);
              }
            }
          }
        }
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    // ──────────────────────────────────────────────────────────────────────────
    // Global Keyboard Event Handler
    // ──────────────────────────────────────────────────────────────────────────
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      const tagName = target.tagName.toLowerCase();
      const isInput = tagName === 'input';
      const isSelect = tagName === 'select';
      const isTextarea = tagName === 'textarea';
      const isButton = tagName === 'button';
      const isCombobox = target.getAttribute('role') === 'combobox';

      // 1. Hotkey: Ctrl+S / Cmd+S (Save active form)
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

      // 2. Hotkey: Alt+N or F2 (Trigger Add / New action)
      const isAltN = e.altKey && (e.key === 'n' || e.key === 'N');
      const isF2 = e.key === 'F2';

      if (isAltN || isF2) {
        const openDialog = document.querySelector('[role="dialog"]');
        if (!openDialog) {
          e.preventDefault();
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

      // 3. Hotkey: F3 or Ctrl+K (Focus search)
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

      // 4. Enter / Shift+Enter Navigation in Forms, Tables, and Modals
      if (e.key === 'Enter') {
        // Allow textareas standard multi-line enter unless Ctrl/Cmd is pressed
        if (isTextarea && !e.ctrlKey && !e.metaKey) {
          return;
        }

        // Allow standalone buttons (like non-submit buttons / icon buttons) to activate on Enter
        if (isButton && (target as HTMLButtonElement).type !== 'submit' && !isCombobox) {
          return;
        }

        const container = target.closest('form') || target.closest('[role="dialog"]') || target.closest('table');
        if (!container) return;

        // If Ctrl+Enter / Cmd+Enter: force form submission
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          const form = container instanceof HTMLFormElement ? container : container.querySelector<HTMLFormElement>('form') || target.closest('form');
          if (form) {
            const submitBtn = form.querySelector<HTMLButtonElement>('button[type="submit"]:not([disabled])');
            if (submitBtn) {
              submitBtn.click();
            } else {
              form.requestSubmit?.();
            }
          }
          return;
        }

        // For inputs, selects, and comboboxes: move to next/prev field
        if (isInput || isSelect || isCombobox) {
          const type = (target as HTMLInputElement).type;
          if (type === 'submit' || type === 'reset') return;

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

          if (e.shiftKey) {
            // Shift + Enter: Move Backward
            if (currentIndex > 0) {
              e.preventDefault();
              const prevElement = focusable[currentIndex - 1];
              prevElement.focus();
              if (prevElement instanceof HTMLInputElement && prevElement.type !== 'date') {
                prevElement.select?.();
              }
            }
          } else {
            // Enter: Move Forward
            if (currentIndex > -1 && currentIndex < focusable.length - 1) {
              e.preventDefault();
              const nextElement = focusable[currentIndex + 1];
              nextElement.focus();
              if (nextElement instanceof HTMLInputElement && nextElement.type !== 'date') {
                nextElement.select?.();
              }
            } else if (currentIndex === focusable.length - 1) {
              // Last element reached -> submit
              if (target instanceof HTMLButtonElement && target.type === 'submit') {
                return;
              }
              e.preventDefault();
              const form = container instanceof HTMLFormElement ? container : container.querySelector<HTMLFormElement>('form') || target.closest('form');
              if (form) {
                const submitBtn = form.querySelector<HTMLButtonElement>('button[type="submit"]:not([disabled])');
                if (submitBtn) {
                  submitBtn.click();
                } else {
                  form.requestSubmit?.();
                }
              }
            }
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      observer.disconnect();
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return <>{children}</>;
}
