/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_KHM_BUNDLE_VERSION?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
