import { useRef } from 'react'

/**
 * Props for a Radix dialog's content. On close, they send focus back to
 * whatever had it when the dialog opened.
 *
 * Radix sends focus to the dialog's Trigger instead. A dialog opened from
 * state has no Trigger, so without these its focus is dropped on the body.
 */
export function useReturnFocus() {
  const openerRef = useRef<Element | null>(null)

  return {
    onOpenAutoFocus: () => {
      const opener = document.activeElement
      // A menu item is gone by the time the dialog closes, because its menu
      // closes as the dialog opens. A menu is labelled by the button that
      // opened it, so that button is remembered instead
      const menu = opener?.closest('[role="menu"]')
      const menuButton = menu
        ? document.getElementById(menu.getAttribute('aria-labelledby') ?? '')
        : null
      openerRef.current = menuButton ?? opener
    },
    onCloseAutoFocus: (event: Event) => {
      event.preventDefault()
      if (openerRef.current instanceof HTMLElement) openerRef.current.focus()
    },
  }
}
