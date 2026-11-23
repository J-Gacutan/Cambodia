import { z } from "zod";
import versions from "../../../config/bundle-versions.json";

const envSchema = z.object({ VITE_KHM_BUNDLE_VERSION: z.string().min(1).optional() });
export const ENV = envSchema.parse(import.meta.env);
export const BUNDLE_VERSION = ENV.VITE_KHM_BUNDLE_VERSION ?? versions.current;
export const BUNDLE_BASE_URL = `${import.meta.env.BASE_URL}khm-bundle/${BUNDLE_VERSION}/`;
export const assetUrl = (path: string) => `${BUNDLE_BASE_URL}${path}`;
