import {
  Banner,
  Bullseye,
  Flex,
  FlexItem,
  Label,
  Masthead,
  MastheadBrand,
  MastheadContent,
  MastheadLogo,
  MastheadMain,
  MastheadToggle,
  Nav,
  NavItem,
  NavList,
  Page,
  PageSection,
  PageSidebar,
  PageSidebarBody,
  PageToggleButton,
  SkipToContent,
  Spinner
} from "@patternfly/react-core";
import { lazy, Suspense, useEffect, useState } from "react";
import { loadManifest } from "./lib/bundle";
import { BUNDLE_VERSION } from "./lib/env";
import { hashPath, useHash } from "./lib/hash";
import { useBundle } from "./lib/useBundle";

const HomePage = lazy(() => import("./pages/HomePage"));
const MapPage = lazy(() => import("./pages/MapPage"));
const CasesPage = lazy(() => import("./pages/CasesPage"));
const LicencePage = lazy(() => import("./pages/LicencePage"));
const AboutPage = lazy(() => import("./pages/AboutPage"));

const NAV = [
  ["#home", "Home"],
  ["#map", "Map"],
  ["#cases", "Cases"],
  ["#licence", "Licence"],
  ["#about", "About"]
] as const;

function useBelowMd() {
  const [below, setBelow] = useState(() => window.matchMedia("(max-width: 47.9375rem)").matches);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 47.9375rem)");
    const on = () => setBelow(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return below;
}

function route(hash: string) {
  const path = hashPath(hash);
  switch (path) {
    case "map":
      return <MapPage />;
    case "cases":
      return <CasesPage />;
    case "licence":
      return <LicencePage />;
    case "about":
      return <AboutPage />;
    case "home":
    default:
      return <HomePage />;
  }
}

function isNavActive(hash: string, href: string): boolean {
  const path = `#${hashPath(hash)}` || "#home";
  if (href === "#home") return path === "#home" || path === "#" || path === "";
  return path === href;
}

function MainNav({ hash, onNavigate }: { hash: string; onNavigate?: () => void }) {
  return (
    <Nav aria-label="Main">
      <NavList>
        {NAV.map(([href, label]) => (
          <NavItem key={href} itemId={href} to={href} isActive={isNavActive(hash, href)} onClick={onNavigate}>
            {label}
          </NavItem>
        ))}
      </NavList>
    </Nav>
  );
}

export default function App() {
  const hash = useHash("#home");
  const belowMd = useBelowMd();
  const [navOpen, setNavOpen] = useState(false);
  const manifest = useBundle(loadManifest);
  const version = manifest.data?.version ?? BUNDLE_VERSION;
  const banner =
    manifest.data?.product_banner ??
    "Physical / land-cover suitability proxy only. GO means worth a field look — not MoE zoning, tenure clearance, planting permission, or a carbon outcome.";
  const publicReady = manifest.data?.public_ready === true;

  useEffect(() => {
    document.title = publicReady
      ? "Cambodia restoration screen"
      : "Cambodia restoration screen, INTERNAL prototype";
  }, [publicReady]);

  useEffect(() => {
    setNavOpen(false);
  }, [hash, belowMd]);

  const masthead = (
    <Masthead display={{ default: "inline" }}>
      <MastheadMain>
        {belowMd && (
          <MastheadToggle>
            <PageToggleButton
              aria-label="Main navigation"
              isSidebarOpen={navOpen}
              onSidebarToggle={() => setNavOpen((open) => !open)}
              isHamburgerButton
              hamburgerVariant={navOpen ? "collapse" : "expand"}
            />
          </MastheadToggle>
        )}
        <MastheadBrand>
          <MastheadLogo href="#home" className="khm-brand-link">
            <span className="khm-brand">
              <span className="khm-brand-name">Cambodia restoration screen</span>
              <Label isCompact color={publicReady ? "blue" : "orange"}>
                {publicReady ? "Open-cleared" : "INTERNAL"}
              </Label>
            </span>
          </MastheadLogo>
        </MastheadBrand>
      </MastheadMain>
      {!belowMd && (
        <MastheadContent>
          <Nav variant="horizontal" aria-label="Main">
            <NavList>
              {NAV.map(([href, label]) => (
                <NavItem key={href} itemId={href} to={href} isActive={isNavActive(hash, href)}>
                  {label}
                </NavItem>
              ))}
            </NavList>
          </Nav>
        </MastheadContent>
      )}
    </Masthead>
  );

  return (
    <Flex
      className="khm-shell"
      direction={{ default: "column" }}
      gap={{ default: "gapNone" }}
      spacer={{ default: "spacerNone" }}
      alignItems={{ default: "alignItemsStretch" }}
    >
      <FlexItem>
        <Banner
          color={publicReady ? "blue" : "orange"}
          className="khm-banner"
          role="region"
          aria-label="Product banner"
        >
          {publicReady ? (
            <>
              Open-cleared P2 research package (class 8 ± 4).{" "}
              <strong>GO = worth a field look</strong> (physical / land-cover only). {banner}{" "}
              <a href="#licence">Licence</a>
            </>
          ) : (
            <>
              INTERNAL / illustrative until licence gate clears.{" "}
              <strong>GO = worth a field look</strong> (physical / land-cover only). {banner}{" "}
              <a href="#about">About</a>
            </>
          )}
        </Banner>
        {!publicReady && (
          <Banner color="red" className="khm-banner" role="status">
            Bundle public_ready=false ({manifest.data?.licence_gate ?? "licence gate"}). Do not publish this build to
            public Pages until khm-i6e.2 and an open-cleared bundle with public_ready=true.
          </Banner>
        )}
      </FlexItem>
      <FlexItem className="khm-shell-page" grow={{ default: "grow" }}>
        <Page
          masthead={masthead}
          sidebar={
            belowMd && navOpen ? (
              <PageSidebar isSidebarOpen>
                <PageSidebarBody>
                  <MainNav hash={hash} onNavigate={() => setNavOpen(false)} />
                </PageSidebarBody>
              </PageSidebar>
            ) : null
          }
          onPageResize={() => undefined}
          skipToContent={<SkipToContent href="#main-content">Skip to content</SkipToContent>}
          mainContainerId="main-content"
        >
          <Suspense
            fallback={
              <PageSection>
                <Bullseye>
                  <Spinner aria-label="Loading" />
                </Bullseye>
              </PageSection>
            }
          >
            {route(hash)}
          </Suspense>
        </Page>
      </FlexItem>
      <FlexItem>
        <footer className="khm-footer">
          <p>Research prototype for CI Seed Fund / REDD+ scoping. Not a CI product endorsement.</p>
          <p>{`Data version ${version}. Quote the original source register, not this site.`}</p>
          <p>
            FLAG rasters and INTERNAL case PNGs are kept offline — not in the public Pages artifact.{" "}
            <a href="#licence">Licence and evidence</a>
          </p>
        </footer>
      </FlexItem>
    </Flex>
  );
}
