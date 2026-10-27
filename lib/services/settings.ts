import { cache } from "react";
import type { OrgSettings } from "@prisma/client";
import { prisma } from "@/lib/db";

const DEFAULTS = {
  id: "default",
  description:
    "Utsav Foundation is based in Gurugram, Haryana and organises community events that everyone is welcome to join.",
};

/** The NGO's configurable branding. Created on first read so the app never runs without it. */
export const getSettings = cache(async (): Promise<OrgSettings> => {
  const existing = await prisma.orgSettings.findUnique({ where: { id: "default" } });
  if (existing) return existing;
  return prisma.orgSettings.upsert({ where: { id: "default" }, update: {}, create: DEFAULTS });
});
