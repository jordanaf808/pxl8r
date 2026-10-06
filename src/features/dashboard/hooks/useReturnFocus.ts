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
      openerRef.current = document.activeElement
    },
    onCloseAutoFocus: (event: Event) => {
      event.preventDefault()
      if (openerRef.current instanceof HTMLElement) openerRef.current.focus()
    },
  }
}
