'use client'

import * as React from 'react'
import { Bookmark, BookmarkCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { api } from '@/lib/api'
import { useAppStore } from '@/lib/store'
import { toast } from 'sonner'

interface BookmarkButtonProps {
  itemType: 'note' | 'question' | 'cheatsheet' | 'book' | 'mocktest'
  itemId: string
  folder?: string
  variant?: 'default' | 'outline' | 'ghost' | 'secondary'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  className?: string
  showLabel?: boolean
}

export function BookmarkButton({
  itemType,
  itemId,
  folder = 'Favorites',
  variant = 'outline',
  size = 'sm',
  className,
  showLabel = true,
}: BookmarkButtonProps) {
  const bookmarkedIds = useAppStore((s) => s.bookmarkedIds)
  const toggleBookmarkId = useAppStore((s) => s.toggleBookmarkId)
  const key = `${itemType}:${itemId}`
  const isBookmarked = bookmarkedIds.has(key)

  const handleToggle = async () => {
    // optimistic update
    toggleBookmarkId(key)
    try {
      const result = await api.toggleBookmark({ itemType, itemId, folder })
      toast.success(result.bookmarked ? 'Bookmarked' : 'Removed bookmark')
    } catch (e: any) {
      // revert
      toggleBookmarkId(key)
      toast.error('Failed to update bookmark')
    }
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleToggle}
      className={cn(
        'gap-1.5',
        isBookmarked && 'text-primary border-primary/40 bg-primary/5 hover:bg-primary/10',
        className,
      )}
      aria-label={isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
    >
      {isBookmarked ? <BookmarkCheck className="h-3.5 w-3.5" /> : <Bookmark className="h-3.5 w-3.5" />}
      {showLabel && <span className="hidden sm:inline">{isBookmarked ? 'Saved' : 'Save'}</span>}
    </Button>
  )
}
