import { useMemo, useState } from 'react'
import { useServerFn } from '@tanstack/react-start'
import {
  createPixel as createPixelServerFn,
  updatePixel as updatePixelServerFn,
  deletePixelById as deletePixelByIdServerFn,
} from '@/db/mutations.functions'
import type { Pixel, NewPixel, UpdatePixelType } from '@/db/types'
import { buildPixelsMap } from '@/lib/utils/maps'

export function usePixelState(
  initialPixels: Pixel[],
  initialUngroupedPixels: Pixel[],
) {
  const createPixel = useServerFn(createPixelServerFn)
  const updatePixel = useServerFn(updatePixelServerFn)
  const deletePixelFn = useServerFn(deletePixelByIdServerFn)

  const [pixels, setPixels] = useState<Pixel[]>(initialPixels)
  const [ungroupedPixels, setUngroupedPixels] =
    useState<Pixel[]>(initialUngroupedPixels)

  const pixelsMap = useMemo(() => buildPixelsMap(pixels), [pixels])

  async function createPixelHandler(pixelData: NewPixel) {
    const createdPixel = await createPixel({ data: pixelData })
    if (createdPixel.success !== true)
      throw new Error('Error creating pixel: ', { cause: createdPixel.results })
    setPixels((prev) => [...createdPixel.results, ...prev])
    setUngroupedPixels((prev) => [...createdPixel.results, ...prev])
  }

  async function updatePixelHandler(pixelData: UpdatePixelType) {
    const snapshot = pixels
    setPixels((prev) => prev.map((p) => (p.id === pixelData.id ? { ...p, ...pixelData } : p)))
    const result = await updatePixel({ data: pixelData })
    if (result.success !== true) setPixels(snapshot)
  }

  return {
    pixels,
    pixelsMap,
    ungroupedPixels,
    setPixels,
    deletePixelFn,
    createPixelHandler,
    updatePixelHandler,
  }
}
