# Playwright QA Framework

A small but production-style test automation framework built with **Playwright + TypeScript**.
It exercises two public practice targets (so anyone can run it without credentials):

- **UI / E2E:** [Swag Labs](https://www.saucedemo.com) (Sauce Labs demo shop)
- **API:** [Restful-Booker](https://restful-booker.herokuapp.com) (booking service)

> Both targets are maintained by third parties for practice. The suite keeps its request volume low
> and cleans up the data it creates.

## What it demonstrates

| Area                                     | How                                                                                                   |
| ---------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Page objects, without inheritance chains | Page objects are exposed as **Playwright fixtures** (`src/fixtures`), built lazily per test           |
| Resilient locators                       | `getByRole` / `getByTestId` (configured for the site's `data-test` attribute), no CSS or XPath chains |
| No arbitrary waits                       | Only web-first assertions and auto-waiting, no `waitForTimeout`                                       |
| API testing with contracts               | Typed `BookingClient` + **zod schemas**: a response that drifts fails at the boundary                 |
| Data hygiene                             | The `createdBooking` fixture **always deletes** its data in teardown, even when a test fails          |
| Data-driven cases                        | Negative login and checkout rules are table-driven: one body, readable per-case report                |
| Accessibility                            | **axe-core** scan; build fails on `critical`, lower severities are attached to the report             |
| Fast feedback                            | Separate `api` and `e2e` projects; API tests start no browser                                         |
| CI                                       | GitHub Actions: typecheck and format gate, **3-way sharding**, merged HTML report                     |
| Debuggability                            | Trace on first retry, video and screenshot on failure                                                 |

## Project layout

```
src/
  api/        BookingClient + zod schemas (the API contract)
  data/       test data kept out of the specs
  fixtures/   page objects and API helpers exposed as fixtures
  pages/      Login, Inventory, Cart, Checkout page objects
tests/
  api/        booking lifecycle, authorization, negative paths
  e2e/        auth, cart/sorting, checkout, accessibility
```

## Run it

```bash
npm ci
npx playwright install chromium

npm test              # everything
npm run test:api      # API only, no browser
npm run test:e2e      # UI only
npm run test:ui       # Playwright UI mode
npm run report        # open the last HTML report
npm run typecheck && npm run format:check
```

Targets can be overridden: `BASE_URL=... API_URL=... npm test`.

## Design decisions worth reading

- **Fixtures over a base page class.** A test declares only the pages it needs. Login is paid once per test
  inside the `loggedInInventory` fixture instead of being repeated in every spec.
- **Scoped locators.** Product buttons are found inside the product card (`filter({ hasText })`), so the
  suite never clicks the wrong "Add to cart".
- **Contracts at the edge.** `createdBookingSchema.parse(...)` runs inside the client, so tests assert
  behaviour, not response shape.
- **Documented API quirks are asserted, not hidden.** Restful-Booker answers `201` on `DELETE` and `200`
  with `{ reason: "Bad credentials" }` on a bad login; the tests pin that behaviour and say so.
- **Severity policy for accessibility.** Blocking on every minor issue trains a team to ignore the check;
  blocking on `critical` and reporting the rest keeps it useful.

## Known limits (honest list)

- Chromium only in CI to keep the shared demo sites lightly loaded; add `firefox` / `webkit` projects in
  `playwright.config.ts` to widen coverage.
- The demo sites can be slow or reset their data; the weekly scheduled run exists to notice drift.
- No visual-regression baseline is committed (it would be flaky against third-party sites).

## License

MIT
