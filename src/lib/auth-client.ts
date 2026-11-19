"use client";

import { createAuthClient } from "better-auth/react";
import { adminClient, jwtClient } from "better-auth/client/plugins";

const getBaseURL = () => {
  return (
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    "http://localhost:5000"
  );
};

export const authClient = createAuthClient({
  baseURL: getBaseURL(),
  fetchOptions: {
    credentials: "include",
  },
  plugins: [adminClient(), jwtClient()],
});

export const { signIn, signUp, signOut, useSession } = authClient;
