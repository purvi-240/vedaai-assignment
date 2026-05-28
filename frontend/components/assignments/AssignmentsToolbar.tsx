'use client'

import { useEffect, useRef, useState } from 'react'
import { FilterIcon, SearchIcon } from '@/components/icons/NavIcons'

export type AssignmentFilter = 'all'

interface AssignmentsToolbarProps {
  searchQuery: string
  onSearchChange: (value: string) => void
  mobile?: boolean
}

export function AssignmentsToolbar({
  searchQuery,
  onSearchChange,
  mobile = false,
}: AssignmentsToolbarProps) {
  const [filterOpen, setFilterOpen] = useState(false)
  const filterRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!filterOpen) return

    const handleClickOutside = (event: MouseEvent) => {
      if (!filterRef.current?.contains(event.target as Node)) {
        setFilterOpen(false)
      }
    }

    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [filterOpen])

  const filterControl = (
    <div className="assignments-filter-wrap" ref={filterRef}>
      <button
        type="button"
        className="assignments-filter-by"
        aria-expanded={filterOpen}
        aria-haspopup="listbox"
        onClick={() => setFilterOpen((open) => !open)}
      >
        <FilterIcon />
        <span>Filter By</span>
      </button>
      {filterOpen && (
        <ul className="assignments-filter-menu" role="listbox">
          <li role="option" aria-selected>
            <button type="button" onClick={() => setFilterOpen(false)}>
              All assignments
            </button>
          </li>
        </ul>
      )}
    </div>
  )

  if (mobile) {
    return (
      <div className="assignments-toolbar-bar assignments-toolbar-bar--mobile">
        {filterControl}
        <span className="assignments-toolbar-divider" />
        <div className="assignments-search-field">
          <SearchIcon />
          <input
            type="search"
            placeholder="Search Name"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="assignments-toolbar-bar">
      {filterControl}
      <span className="assignments-toolbar-divider" />
      <div className="assignments-search-field">
        <SearchIcon />
        <input
          type="search"
          placeholder="Search Assignment"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
    </div>
  )
}
