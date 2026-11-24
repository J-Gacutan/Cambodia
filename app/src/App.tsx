import {
  Banner,
  Bullseye,
  Flex,
  FlexItem,
  Label,
  Masthead,
  MastheadBrand,
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
import { StepRail } from "./flow/StepRail";
import { hrefForStep, stepFromHash, type StepId } from "./flow/steps";
import { loadManifest } from "./lib/bundle";
import { BUNDLE_VERSION } from "./lib/env";
import { hashPath, useHash } from "./lib/hash";
import { useBundle } from "./lib/useBundle";

const HomePage = lazy(() => import("./pages/HomePage"));
const ChangePage = lazy(() => import("./pages/ChangePage"));
const MapPage = lazy(() => import("./pages/MapPage"));
const CasesPage = lazy(() => import("./pages/CasesPage"));
const LicencePage = lazy(() => import("./pages/LicencePage"));
const AboutPage = lazy(() => import("./pages/AboutPage"));

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
    case "change":
      return <ChangePage />;
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

export default function App() {
  const hash = useHash("#home");
  const belowMd = useBelowMd();
  const [navOpen, setNavOpen] = useState(false);
  const manifest = useBundle(loadManifest);
  const version = manifest.data?.version ?? BUNDLE_VERSION;
  const publicReady = manifest.data?.public_ready === true;
  const currentStep = stepFromHash(hash);
  const onAbout = hashPath(hash) === "about";

  useEffect(() => {
    document.title = publicReady
      ? "Cambodia restoration screen"
      : "Cambodia restoration screen, INTERNAL prototype";
  }, [publicReady]);

  useEffect(() => {
    setNavOpen(false);
  }, [hash, belowMd]);

  const goStep = (step: StepId) => {
    window.location.hash = hrefForStep(step);
  };

  // Brand-only masthead — About lives in the step rail, not a detached MastheadContent float.
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
      {!publicReady && (
        <FlexItem>
          <Banner color="red" className="khm-banner" role="status">
            Bundle public_ready=false ({manifest.data?.licence_gate ?? "licence gate"}). Do not publish this build to
            public Pages until khm-i6e.2 and an open-cleared bundle with public_ready=true. See{" "}
            <a href="#about">About</a> for package notes.
          </Banner>
        </FlexItem>
      )}
      <FlexItem className="khm-shell-page" grow={{ default: "grow" }}>
        <Page
          masthead={masthead}
          sidebar={
            belowMd && navOpen ? (
              <PageSidebar isSidebarOpen>
                <PageSidebarBody>
                  <Nav aria-label="Main">
                    <NavList>
                      <NavItem
                        itemId="#home"
                        to="#home"
                        isActive={currentStep === "frame"}
                        onClick={() => setNavOpen(false)}
                      >
                        1. Frame
                      </NavItem>
                      <NavItem
                        itemId="#change"
                        to="#change"
                        isActive={currentStep === "locate"}
                        onClick={() => setNavOpen(false)}
                      >
                        2. Locate
                      </NavItem>
                      <NavItem
                        itemId="#map"
                        to="#map"
                        isActive={currentStep === "read"}
                        onClick={() => setNavOpen(false)}
                      >
                        3. Read
                      </NavItem>
                      <NavItem
                        itemId="#cases"
                        to="#cases"
                        isActive={currentStep === "means"}
                        onClick={() => setNavOpen(false)}
                      >
                        4. Means
                      </NavItem>
                      <NavItem
                        itemId="#licence"
                        to="#licence"
                        isActive={currentStep === "act"}
                        onClick={() => setNavOpen(false)}
                      >
                        5. Act
                      </NavItem>
                      <NavItem itemId="#about" to="#about" isActive={onAbout} onClick={() => setNavOpen(false)}>
                        About
                      </NavItem>
                    </NavList>
                  </Nav>
                </PageSidebarBody>
              </PageSidebar>
            ) : null
          }
          onPageResize={() => undefined}
          skipToContent={<SkipToContent href="#main-content">Skip to content</SkipToContent>}
          mainContainerId="main-content"
        >
          <PageSection
            padding={{ default: "noPadding" }}
            className="khm-rail-section"
            aria-label="Decision flow"
          >
            <StepRail current={currentStep} aboutActive={onAbout} onSelect={goStep} />
          </PageSection>
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
            {" · "}
            <a href="#about">About</a>
          </p>
        </footer>
      </FlexItem>
    </Flex>
  );
}
