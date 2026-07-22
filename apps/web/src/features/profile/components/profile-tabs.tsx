"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@skilltego/ui";
import type { ReactNode } from "react";

interface ProfileTabsProps {
  postsTab: ReactNode;
  savedTab?: ReactNode;
  badgesTab: ReactNode;
}

export function ProfileTabs({ postsTab, savedTab, badgesTab }: ProfileTabsProps) {
  const [active, setActive] = React.useState("posts");

  const tabs = [
    { value: "posts", label: "Posts" },
    ...(savedTab ? [{ value: "saved", label: "Saved" }] : []),
    { value: "badges", label: "Badges" },
  ];

  return (
    <Tabs value={active} onValueChange={setActive} className="mt-6">
      <TabsList>
        {tabs.map((tab) => (
          <TabsTrigger key={tab.value} value={tab.value}>
            {active === tab.value && (
              <motion.span
                layoutId="profile-tab-indicator"
                className="gradient-brand absolute inset-0 -z-10 rounded-full shadow-glow"
                transition={{ type: "spring", stiffness: 500, damping: 40 }}
              />
            )}
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
      <TabsContent value="posts" className="mt-4">
        {postsTab}
      </TabsContent>
      {savedTab && (
        <TabsContent value="saved" className="mt-4">
          {savedTab}
        </TabsContent>
      )}
      <TabsContent value="badges" className="mt-4">
        {badgesTab}
      </TabsContent>
    </Tabs>
  );
}
