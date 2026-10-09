'use client';

import React, { useEffect } from 'react';

/**
 * Universal Keyboard Navigation & Hotkeys Provider
 * Full keyboard-driven navigation across all forms, dialogs, and dropdowns:
 * 
 * 1. Dropdown / Select Enter Navigation:
 *    - On closed Select: Pressing 'Enter' advances focus to the NEXT field.
 *      (Press 'Space' or 'ArrowDown' to open dropdown for selection).
 *    - In open Select list: Pressing 'Enter' on an option selects it AND automatically
 *      advances focus to the NEXT form field!
 *    - Shift + Enter moves backward to the previous field.
 * 
 * 2. Inputs & Forms:
 *    - Enter advances to next field, Shift+Enter moves back.
 *    - On last field, Enter triggers form submit.
 *    - Ctrl+S / Ctrl+Enter submits active form immediately.
 * 
 * 3. Modals & Dialogs:
 *    - Automatically focuses first input when any modal opens.
 *    - Alt+N or F2 triggers New/Add on any page.
 *    - Escape closes modals.
 */
export function KeyboardNavigationProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // ──────────────────────────────────────────────────────────────────────────
    // Helper: Find all focusable interactive elements within a container
    // ──────────────────────────────────────────────────────────────────────────
    const getFocusableElements = (container: HTMLElement): HTMLElement[] => {
      const selector = [
        'input:not([type="hidden"]):not([type="submit"]):not([type="reset"]):not([disabled]):not([readonly])',
        'select:not([disabled])',
        'textarea:not([disabled]):not([readonly])',
        '[data-slot="select-trigger"]:not([disabled])',
        'button[role="combobox"]:not([aria-disabled="true"]):not([disabled])',
        'button[type="submit"]:not([disabled])',
      ].join(', ');

      return Array.from(container.querySelectorAll<HTMLElement>(selector)).filter((el) => {
        return (
          el.tabIndex !== -1 &&
          (el.offsetWidth > 0 || el.offsetHeight > 0 || el.getClientRects().length > 0) &&
          window.getComputedStyle(el).visibility !== 'hidden' &&
          window.getComputedStyle(el).display !== 'none'
        );
      });
    };

    // ──────────────────────────────────────────────────────────────────────────
    // Helper: Focus next or previous element
    // ──────────────────────────────────────────────────────────────────────────
    const navigateFocus = (
      container: HTMLElement,
      currentEl: HTMLElement,
      direction: 'next' | 'prev' = 'next'
    ) => {
      const focusable = getFocusableElements(container);
      const currentIndex = focusable.indexOf(currentEl);

      if (direction === 'prev') {
        if (currentIndex > 0) {
          const prevEl = focusable[currentIndex - 1];
          prevEl.focus();
          if (prevEl instanceof HTMLInputElement && prevEl.type !== 'date') {
            prevEl.select?.();
          }
        }
      } else {
        if (currentIndex > -1 && currentIndex < focusable.length - 1) {
          const nextEl = focusable[currentIndex + 1];
          nextEl.focus();
          if (nextEl instanceof HTMLInputElement && nextEl.type !== 'date') {
            nextEl.select?.();
          }
        } else if (currentIndex === focusable.length - 1) {
          // Last element -> Submit form
          const form =
            container instanceof HTMLFormElement
              ? container
              : container.querySelector<HTMLFormElement>('form') || currentEl.closest('form');
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
    };

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
                  const focusables = getFocusableElements(dialog);
                  if (focusables.length > 0) {
                    const first = focusables[0];
                    first.focus();
                    if (first instanceof HTMLInputElement && first.type !== 'date') {
                      first.select?.();
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
      const isSelectTrigger =
        target.getAttribute('data-slot') === 'select-trigger' ||
        target.getAttribute('role') === 'combobox' ||
        target.classList.contains('select-trigger');
      const isSelectOption =
        target.getAttribute('role') === 'option' ||
        target.getAttribute('data-slot') === 'select-item' ||
        Boolean(target.closest('[role="listbox"], [data-slot="select-content"]'));

      // ────────────────────────────────────────────────────────────────────────
      // 1. Hotkey: Ctrl+S / Cmd+S (Save active form)
      // ────────────────────────────────────────────────────────────────────────
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

      // ────────────────────────────────────────────────────────────────────────
      // 2. Hotkey: Alt+N or F2 (Trigger Add / New action)
      // ────────────────────────────────────────────────────────────────────────
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

      // ────────────────────────────────────────────────────────────────────────
      // 3. Hotkey: F3 or Ctrl+K (Focus search)
      // ────────────────────────────────────────────────────────────────────────
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

      // ────────────────────────────────────────────────────────────────────────
      // 4. Enter on an open Dropdown Option (Selects option & advances to next field)
      // ────────────────────────────────────────────────────────────────────────
      if (e.key === 'Enter' && isSelectOption) {
        // Find the trigger button for this open select dropdown
        const activeTrigger = document.querySelector<HTMLElement>(
          '[data-slot="select-trigger"][data-state="open"], button[role="combobox"][data-state="open"], button[aria-expanded="true"]'
        );

        if (activeTrigger) {
          const container =
            activeTrigger.closest('form') ||
            activeTrigger.closest('[role="dialog"]') ||
            activeTrigger.closest('table') ||
            document.body;

          // Allow Radix UI to process the selection first, then advance focus to next field
          setTimeout(() => {
            navigateFocus(container as HTMLElement, activeTrigger, e.shiftKey ? 'prev' : 'next');
          }, 60);
        }
        return;
      }

      // ────────────────────────────────────────────────────────────────────────
      // 5. Enter on a Closed Select Trigger (Advances to next field without reopening)
      // ────────────────────────────────────────────────────────────────────────
      if (e.key === 'Enter' && isSelectTrigger) {
        const isOpen = target.getAttribute('data-state') === 'open' || target.getAttribute('aria-expanded') === 'true';
        if (!isOpen) {
          e.preventDefault();
          const container =
            target.closest('form') || target.closest('[role="dialog"]') || target.closest('table');
          if (container) {
            navigateFocus(container as HTMLElement, target, e.shiftKey ? 'prev' : 'next');
          }
          return;
        }
      }

      // ────────────────────────────────────────────────────────────────────────
      // 6. Enter / Shift+Enter Navigation in Inputs and Text controls
      // ────────────────────────────────────────────────────────────────────────
      if (e.key === 'Enter') {
        // Multi-line in textarea unless Ctrl/Cmd is pressed
        if (isTextarea && !e.ctrlKey && !e.metaKey) {
          return;
        }

        // Standalone action buttons (excluding submit or select triggers) activate normally
        if (isButton && (target as HTMLButtonElement).type !== 'submit' && !isSelectTrigger) {
          return;
        }

        const container = target.closest('form') || target.closest('[role="dialog"]') || target.closest('table');
        if (!container) return;

        // Force Submit with Ctrl+Enter / Cmd+Enter
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          const form =
            container instanceof HTMLFormElement
              ? container
              : container.querySelector<HTMLFormElement>('form') || target.closest('form');
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

        // Move to next / previous field
        if (isInput || isSelect || isSelectTrigger) {
          const type = (target as HTMLInputElement).type;
          if (type === 'submit' || type === 'reset') return;

          e.preventDefault();
          navigateFocus(container as HTMLElement, target, e.shiftKey ? 'prev' : 'next');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => {
      observer.disconnect();
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, []);

  return <>{children}</>;
}
