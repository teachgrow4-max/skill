"use client";

import * as React from "react";
import { isValidUsername } from "@skilltego/utils";
import { checkUsernameAvailableAction } from "../actions";

export type UsernameStatus = "idle" | "checking" | "available" | "taken" | "invalid";

export function useUsernameAvailability(username: string, initialUsername?: string) {
  const [status, setStatus] = React.useState<UsernameStatus>("idle");

  React.useEffect(() => {
    const value = username.trim().toLowerCase();

    if (value === "") {
      setStatus("idle");
      return;
    }

    if (!isValidUsername(value)) {
      setStatus("invalid");
      return;
    }

    if (value === initialUsername) {
      setStatus("idle");
      return;
    }

    setStatus("checking");
    const timeout = setTimeout(async () => {
      const available = await checkUsernameAvailableAction(value);
      setStatus(available ? "available" : "taken");
    }, 400);

    return () => clearTimeout(timeout);
  }, [username, initialUsername]);

  return status;
}
