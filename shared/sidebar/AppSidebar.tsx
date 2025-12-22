import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { NavUser } from "./NavUser"
import { User } from "@supabase/supabase-js"
import { NavMain } from "./NavMain"
import { FolderGit2Icon, GitPullRequestArrowIcon, ListTodoIcon } from "lucide-react"
import { NavSecondary } from "./NavSecondary"

export function AppSidebar({ user, hasSetLlmApiKey, ...props }: { user: User | null; hasSetLlmApiKey?: boolean; } & React.ComponentPropsWithoutRef<typeof Sidebar>){
  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:p-1.5"
            >
              <a href="/repos">
                <GitPullRequestArrowIcon className="size-5" />
                <span className="text-base font-bold">AI Code Reviewer</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain
          items={[
            { title: "Repos", url: "/repos", icon: FolderGit2Icon },
            { title: "Review Rules", url: "/review-rules", icon: ListTodoIcon },
          ]}
        />
        <NavSecondary className="mt-auto" hasSetLlmApiKey={hasSetLlmApiKey} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  )
}