"use client"

import { FileText, FolderOpen, Settings2 } from "lucide-react"
import Link from "next/link"
import * as React from "react"

import { Button } from "@/components/ui/button"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail
} from "@/components/ui/sidebar"
import { NavMain } from "../_components/nav-main"
import { NavUser } from "../_components/nav-user"
import { TeamSwitcher } from "../_components/team-switcher"

export function AppSidebar({
  userData,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  userData: {
    name: string
    email: string
    avatar: string
    membership: string
  }
}) {
  const data = {
    user: userData,
    navMain: [
      {
        title: "Projects",
        url: "/dashboard",
        icon: FolderOpen,
        items: [
          {
            title: "All projects",
            url: "/dashboard"
          },
          {
            title: "New project",
            url: "/dashboard/projects/new"
          }
        ]
      },
      {
        title: "Settings",
        url: "#",
        icon: Settings2,
        items: [
          {
            title: "Account",
            url: "/dashboard/account"
          }
        ]
      }
    ]
  }
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <div className="px-2 py-2">
          <Button asChild size="sm" className="w-full justify-start gap-2">
            <Link href="/dashboard/projects/new">
              <FileText className="h-4 w-4" />
              New project
            </Link>
          </Button>
        </div>
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
