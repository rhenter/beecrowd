import '@testing-library/jest-dom/vitest';

beforeEach(() => {
  window.localStorage.clear();
});

Object.defineProperty(window, 'scrollTo', { value: vi.fn(), writable: true });
Object.defineProperty(window.HTMLElement.prototype, 'scrollIntoView', {
  value: vi.fn(),
  writable: true,
});
