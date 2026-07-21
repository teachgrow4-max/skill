"use client";

import type { ReactNode } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@skilltego/ui";

interface ProfileTabsProps {
  postsTab: ReactNode;
  savedTab?: ReactNode;
  badgesTab: ReactNode;
}

export function ProfileTabs({ postsTab, savedTab, badgesTab }: ProfileTabsProps) {
  return (
    <Tabs defaultValue="posts" className="mt-2">
      <TabsList>
        <TabsTrigger value="posts">Posts</TabsTrigger>
        {savedTab && <TabsTrigger value="saved">Saved</TabsTrigger>}
        <TabsTrigger value="badges">Badges</TabsTrigger>
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
