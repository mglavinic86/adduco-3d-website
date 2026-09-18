import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";
afterEach(() => {
  cleanup();
  history.replaceState(null, "", "/");
});
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: true,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })),
});
globalThis.IntersectionObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
} as unknown as typeof IntersectionObserver;
HTMLElement.prototype.scrollIntoView = vi.fn();
// jsdom has no image decoder; real decoding/error behavior is covered in Playwright.
HTMLImageElement.prototype.decode = vi.fn().mockResolvedValue(undefined);
