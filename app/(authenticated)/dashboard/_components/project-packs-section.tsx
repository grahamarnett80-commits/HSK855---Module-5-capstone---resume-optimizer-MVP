"use client"

import { createPackCheckoutUrl } from "@/actions/stripe"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

export function ProjectPacksSection() {
  const [loading, setLoading] = useState<3 | 10 | 25 | null>(null)

  async function handleBuyPack(packSize: 3 | 10 | 25) {
    setLoading(packSize)
    const { url, error } = await createPackCheckoutUrl(packSize)
    setLoading(null)
    if (error) {
      toast.error(error)
      return
    }
    if (url) window.location.href = url
  }

  return (
    <section id="pricing" className="space-y-4">
      <h2 className="text-xl font-semibold">Project packs</h2>
      <p className="text-muted-foreground text-sm">
        One-time purchase. More projects and more AI uses per project. Exports included.
      </p>
      <div className="flex flex-wrap gap-4">
        <div className="rounded-lg border p-4 min-w-[140px]">
          <p className="font-semibold">3 projects</p>
          <p className="text-muted-foreground text-sm">50 AI uses per project</p>
          <p className="mt-2 text-2xl font-bold">$19</p>
          <Button
            className="mt-3 w-full"
            variant="outline"
            size="sm"
            disabled={loading !== null}
            onClick={() => handleBuyPack(3)}
          >
            {loading === 3 ? <Loader2 className="h-4 w-4 animate-spin" /> : "Get 3-pack"}
          </Button>
        </div>
        <div className="rounded-lg border-2 border-primary p-4 min-w-[140px] relative">
          <span className="bg-primary text-primary-foreground absolute -top-2 left-3 px-2 py-0.5 text-[10px] font-semibold rounded">
            Most popular
          </span>
          <p className="font-semibold">10 projects</p>
          <p className="text-muted-foreground text-sm">75 AI uses per project</p>
          <p className="mt-2 text-2xl font-bold">$39</p>
          <Button
            className="mt-3 w-full"
            size="sm"
            disabled={loading !== null}
            onClick={() => handleBuyPack(10)}
          >
            {loading === 10 ? <Loader2 className="h-4 w-4 animate-spin" /> : "Get 10-pack"}
          </Button>
        </div>
        <div className="rounded-lg border p-4 min-w-[140px]">
          <p className="font-semibold">25 projects</p>
          <p className="text-muted-foreground text-sm">100 AI uses per project</p>
          <p className="mt-2 text-2xl font-bold">$79</p>
          <Button
            className="mt-3 w-full"
            variant="outline"
            size="sm"
            disabled={loading !== null}
            onClick={() => handleBuyPack(25)}
          >
            {loading === 25 ? <Loader2 className="h-4 w-4 animate-spin" /> : "Get 25-pack"}
          </Button>
        </div>
      </div>
    </section>
  )
}
