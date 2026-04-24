import { useMemo, useState } from 'react'
import type { Grid, Pixel, GridPixel, PixelTypeType } from '@/db/types'

export function useDashboardFilter(
  ungroupedPixels: Pixel[],
  grids: Grid[],
  pixelsByGridId: Map<string, GridPixel[]>,
) {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<PixelTypeType | 'all'>('all')

  const filteredUngroupedPixels = useMemo(
    () =>
      ungroupedPixels.filter((p) => {
        const matchesSearch =
          p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.description?.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesType = filterType === 'all' || p.type === filterType
        return matchesSearch && matchesType
      }),
    [ungroupedPixels, searchTerm, filterType],
  )

  const filteredGrids = useMemo(
    () =>
      grids.filter((g) => {
        const matchesSearch =
          g.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (g.description
            ? g.description.toLowerCase().includes(searchTerm.toLowerCase())
            : false)
        const gridPixels = pixelsByGridId.get(g.id)
        const matchesType =
          filterType === 'all' ||
          gridPixels?.some((gp) => gp.pixel.type === filterType)
        return matchesSearch && matchesType
      }),
    [grids, pixelsByGridId, searchTerm, filterType],
  )

  return {
    searchTerm,
    setSearchTerm,
    filterType,
    setFilterType,
    filteredUngroupedPixels,
    filteredGrids,
  }
}
