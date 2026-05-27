'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import type { AssignmentListItem } from '@/types/assignment'
import { MoreVerticalIcon } from '@/components/icons/NavIcons'

function getMenuWidth(): number {
  if (typeof window === 'undefined') return 140
  const styles = getComputedStyle(document.documentElement)
  const mobile = window.matchMedia('(max-width: 900px)').matches
  const token = mobile
    ? '--assignment-card-menu-width-mobile'
    : '--assignment-card-menu-width'
  const value = styles.getPropertyValue(token).trim()
  return parseInt(value, 10) || (mobile ? 124 : 140)
}

interface AssignmentCardProps {
  assignment: AssignmentListItem
  isMenuOpen: boolean
  onMenuToggle: () => void
  onMenuClose: () => void
  onDelete: (id: string) => void
}

export function AssignmentCard({
  assignment,
  isMenuOpen,
  onMenuToggle,
  onMenuClose,
  onDelete,
}: AssignmentCardProps) {
  const menuRef = useRef<HTMLDivElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 })
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const updateMenuPosition = () => {
    if (!buttonRef.current) return
    const rect = buttonRef.current.getBoundingClientRect()
    const menuWidth = getMenuWidth()
    setMenuPosition({
      top: rect.bottom + 4,
      left: Math.max(8, rect.right - menuWidth),
    })
  }

  useLayoutEffect(() => {
    if (!isMenuOpen) return
    updateMenuPosition()
    window.addEventListener('resize', updateMenuPosition)
    window.addEventListener('scroll', updateMenuPosition, true)
    return () => {
      window.removeEventListener('resize', updateMenuPosition)
      window.removeEventListener('scroll', updateMenuPosition, true)
    }
  }, [isMenuOpen])

  useEffect(() => {
    if (!isMenuOpen) return

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      if (menuRef.current?.contains(target)) return
      if (dropdownRef.current?.contains(target)) return
      onMenuClose()
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onMenuClose()
    }

    document.addEventListener('click', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('click', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isMenuOpen, onMenuClose])

  const handleMenuClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation()
    if (!isMenuOpen) updateMenuPosition()
    onMenuToggle()
  }

  const dropdown =
    isMenuOpen && mounted
      ? createPortal(
          <div
            ref={dropdownRef}
            className="assignment-card-dropdown assignment-card-dropdown--floating"
            style={{
              top: menuPosition.top,
              left: menuPosition.left,
            }}
            role="menu"
          >
            <Link
              href={`/assignments/${assignment.id}`}
              className="assignment-card-dropdown-item"
              role="menuitem"
              onClick={onMenuClose}
            >
              View Assignment
            </Link>
            <button
              type="button"
              className="assignment-card-dropdown-item assignment-card-dropdown-item--danger"
              role="menuitem"
              onClick={() => {
                onDelete(assignment.id)
                onMenuClose()
              }}
            >
              Delete
            </button>
          </div>,
          document.body,
        )
      : null

  return (
    <article className={`assignment-card ${isMenuOpen ? 'assignment-card--menu-open' : ''}`}>
      <div className="assignment-card-top">
        <h3 className="assignment-card-title">{assignment.title}</h3>
        <div className="assignment-card-menu-wrap" ref={menuRef}>
          <button
            ref={buttonRef}
            type="button"
            className="assignment-card-menu-btn"
            onClick={handleMenuClick}
            aria-label="More options"
            aria-expanded={isMenuOpen}
            aria-haspopup="menu"
          >
            <MoreVerticalIcon />
          </button>
        </div>
      </div>
      <div className="assignment-card-meta">
        <span className="assignment-card-meta-item">
          <span className="meta-label">Assigned on :</span>{' '}
          <span className="meta-value">{assignment.assignedOn}</span>
        </span>
        <span className="assignment-card-meta-item">
          <span className="meta-label">Due :</span>{' '}
          <span className="meta-value">{assignment.dueDate}</span>
        </span>
      </div>
      {dropdown}
    </article>
  )
}
