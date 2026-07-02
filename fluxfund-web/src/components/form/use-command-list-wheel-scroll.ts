import { useCallback, useRef } from "react"
import type { WheelEvent } from "react"

export function useCommandListWheelScroll() {
  const listRef = useRef<HTMLDivElement>(null)

  const handleWheel = useCallback(
    (event: WheelEvent<HTMLElement>) => {
      const list = listRef.current

      if (!list) {
        return
      }

      const maxScrollTop = list.scrollHeight - list.clientHeight

      if (maxScrollTop <= 0) {
        return
      }

      const delta =
        event.deltaMode === 1
          ? event.deltaY * 16
          : event.deltaY

      const nextScrollTop = Math.min(
        Math.max(list.scrollTop + delta, 0),
        maxScrollTop,
      )

      if (nextScrollTop === list.scrollTop) {
        return
      }

      event.preventDefault()
      event.stopPropagation()

      list.scrollTop = nextScrollTop
    },
    [],
  )

  return {
    listRef,
    handleWheel,
  }
}