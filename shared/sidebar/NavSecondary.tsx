"use client";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { LlmApiKeyDialog } from "../llmApiKey/LlmApiKeyDialog";
import Link from "next/link";
import { ExternalLinkIcon } from "lucide-react";

export function NavSecondary({
  hasSetLlmApiKey,
  ...props
}: {
  hasSetLlmApiKey?: boolean;
} & React.ComponentPropsWithoutRef<typeof SidebarGroup>) {
  return (
    <SidebarGroup {...props}>
      <SidebarGroupContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip={"Gemini API Key"} asChild>
              <LlmApiKeyDialog hasSetLlmApiKey={hasSetLlmApiKey} />
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip={"Get Browser Extension"} asChild>
              <Link
                href="https://github.com/Tazrif-Raim/code-reviewer-browser-extension/releases"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2"
              >
                <ExternalLinkIcon />
                <span>Get Browser Extension</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
