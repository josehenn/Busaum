"use client";

// Cliente do Better Auth para as telas: fala com /api/auth no mesmo domínio.
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient();
