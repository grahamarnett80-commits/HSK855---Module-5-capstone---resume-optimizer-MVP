"use client"

import { deleteProject } from "@/actions/projects"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"

export function DeleteProjectButton({
  projectId,
  projectName
}: {
  projectId: string
  projectName: string
}) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)

  async function handleClick(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    const message = `Are you sure you want to delete "${projectName}"? This cannot be undone. Your project credits will not be affected.`
    if (!window.confirm(message)) return
    setIsDeleting(true)
    try {
      const result = await deleteProject(projectId)
      if (result.success) {
        router.refresh()
      } else {
        alert(result.error ?? "Could not delete project.")
      }
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="absolute right-2 top-2 size-8 shrink-0 opacity-70 hover:opacity-100 hover:bg-destructive/10 hover:text-destructive"
      aria-label={`Delete project ${projectName}`}
      onClick={handleClick}
      disabled={isDeleting}
    >
      <Trash2 className="size-4" />
    </Button>
  )
}
