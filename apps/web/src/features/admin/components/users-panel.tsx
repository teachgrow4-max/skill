"use client";

import * as React from "react";
import Link from "next/link";
import { BadgeCheck, Loader2, Search } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage, Input } from "@skilltego/ui";
import { initials } from "@skilltego/utils";
import type { AccountType, ProfileRow } from "@skilltego/types";
import { getAdminUsersAction, setUserVerifiedAction, updateUserAccountTypeAction } from "../actions";

const ACCOUNT_TYPES: AccountType[] = [
  "student",
  "professional",
  "mentor",
  "company",
  "college",
  "moderator",
  "admin",
];

export function UsersPanel({ initialUsers }: { initialUsers: ProfileRow[] }) {
  const [query, setQuery] = React.useState("");
  const [users, setUsers] = React.useState(initialUsers);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    setLoading(true);
    const timeout = setTimeout(async () => {
      const data = await getAdminUsersAction(query);
      setUsers(data);
      setLoading(false);
    }, 300);
    return () => clearTimeout(timeout);
  }, [query]);

  async function handleTypeChange(userId: string, accountType: AccountType) {
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, account_type: accountType } : u)));
    await updateUserAccountTypeAction(userId, accountType);
  }

  async function handleToggleVerified(userId: string, isVerified: boolean) {
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, is_verified: !isVerified } : u)));
    await setUserVerifiedAction(userId, !isVerified);
  }

  return (
    <div className="grid gap-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search users…"
          className="pl-9"
        />
      </div>

      {loading && (
        <div className="flex justify-center py-6">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      )}

      {!loading && (
        <div className="grid gap-2">
          {users.map((user) => (
            <div key={user.id} className="flex items-center gap-3 rounded-lg border border-border p-3">
              <Link href={`/profile/${user.username}`}>
                <Avatar className="size-9">
                  <AvatarImage src={user.avatar_url ?? undefined} alt={user.full_name} />
                  <AvatarFallback>{initials(user.full_name)}</AvatarFallback>
                </Avatar>
              </Link>
              <div className="min-w-0 flex-1">
                <Link href={`/profile/${user.username}`} className="text-sm font-medium hover:underline">
                  {user.full_name}
                </Link>
                <p className="truncate text-xs text-muted-foreground">@{user.username}</p>
              </div>
              <select
                value={user.account_type}
                onChange={(e) => handleTypeChange(user.id, e.target.value as AccountType)}
                className="h-8 rounded-md border border-input bg-background px-2 text-xs capitalize"
              >
                {ACCOUNT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => handleToggleVerified(user.id, user.is_verified)}
                className={user.is_verified ? "text-primary" : "text-muted-foreground hover:text-foreground"}
                aria-label="Toggle verified"
              >
                <BadgeCheck className={user.is_verified ? "size-5 fill-current" : "size-5"} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
