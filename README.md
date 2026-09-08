# Stockwell

A general-goods catalog — electronics, jewelry, and clothing — built as a fully responsive e-commerce site in plain HTML, CSS, and JavaScript. Built as the **Task 5 capstone project** for the ApexPlanet Software Web Development Internship (45-Day Web Development track).

No frameworks, no build step. Open it and it runs.

## What's here

| File | What it does |
|---|---|
| `index.html` | Page structure and content |
| `style.css` | All styling — layout, typography, responsive rules |
| `script.js` | Catalog loading, basket logic, search/filter/sort, form validation |
| `README.md` | This file |

## Features

- **Live catalog** — products are fetched from [Fake Store API](https://fakestoreapi.com) on load. If the request fails or times out (e.g. no internet), the site quietly falls back to a built-in offline catalog, so it always works, including on camera during a demo recording.
- **Search, department filter, and sort** — combine freely; results update instantly, with a debounced search input.
- **Basket with persistence** — add, adjust quantity, or remove items; the basket total updates live and survives a page refresh via `localStorage`.
- **Form validation** — the contact form checks required fields and email format client-side and shows inline errors; the newsletter form validates email format.
- **Fully responsive** — tested down to small mobile widths: the nav collapses to a slide-in panel, the product grid reflows, and the basket becomes full-width.
- **No broken images, ever** — if a product photo fails to load (or the offline catalog is in use, which has no photos), a generated placeholder tile takes its place automatically.
- **Accessible basics** — semantic HTML, visible keyboard focus states, `aria-label`s on icon-only buttons, and `prefers-reduced-motion` support.

## Design notes

The visual language borrows from ledgers, price tags, and stamped receipts rather than a generic template look:
- **Colour:** manila paper, deep awning green, and a single stamp-red accent (used only for prices and calls to action) — no gradients, no default purple/teal.
- **Type:** [Bitter](https://fonts.google.com/specimen/Bitter) (slab serif) for headings, [Work Sans](https://fonts.google.com/specimen/Work+Sans) for body copy, and [Space Mono](https://fonts.google.com/specimen/Space+Mono) reserved specifically for numbers — prices, quantities, and stats — like a price tag or ledger column.
- **Basket drawer** is styled like an itemised receipt, with dotted leader lines and a double-ruled total.
- **Icons** are small hand-drawn inline SVGs (menu, search, basket, close) rather than an icon-font library, kept to only what's functionally needed.

## Running it in VS Code

1. Create a folder (e.g. `stockwell`) and save all three files (`index.html`, `style.css`, `script.js`) directly inside it — no subfolders needed, they all sit side by side.
2. Open that folder in VS Code.
3. Install the **Live Server** extension (by Ritwick Dey) from the Extensions panel, if you don't already have it.
4. Right-click `index.html` → **Open with Live Server**.

That's it — it opens in your browser at `http://127.0.0.1:5500` (or similar) with the live catalog loaded.

You can also just double-click `index.html` to open it directly in a browser — everything still works, though Live Server is recommended since it auto-refreshes as you edit.


Per the internship's submission steps: once you're happy with it, push the three files to a public GitHub repository, record your screen walking through it, and submit both links through **Manage Task** as outlined in the internship deck.

## Why no framework?

The brief asks for HTML, CSS, and JavaScript specifically, and the site is a single page with no routing — React or similar would add a build step for no real benefit here. Everything (fetch, DOM updates, state, `localStorage`) is done with plain JavaScript to keep the skills on display exactly the ones the internship covers.

## Customising it further

- **Swap the product source:** change the `fetch` URL near the top of `script.js` (`loadProducts` function) to point at your own API, or edit the `FALLBACK_PRODUCTS` array to hand-write your own catalog.
- **Change the palette:** every colour is a CSS custom property at the top of `style.css` (`:root`) — edit those six values and the whole site updates.
- **Add a product detail page:** currently it's a single-page catalog by design (matches the "no account required" checkout flow); a detail view would be a natural next step if you want to extend it further.

---

Built with HTML, CSS & JavaScript · No frameworks, no dependencies beyond Google Fonts and the Fake Store API
