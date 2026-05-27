'use client'

import { FilterIcon, SearchIcon } from '@/components/icons/NavIcons'

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
  if (mobile) {
    return (
      <div className="assignments-toolbar-bar assignments-toolbar-bar--mobile">
        <button type="button" className="assignments-filter-by">
          <FilterIcon />
          <span>Filter By</span>
        </button>
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
      <button type="button" className="assignments-filter-by">
        <FilterIcon />
        <span>Filter By</span>
      </button>
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
