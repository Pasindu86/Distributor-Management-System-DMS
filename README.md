# Distributor Management System

Distributor Management System (DMS) is a web platform for tracking goods as they move between a manufacturing company, distributor storage, and retail shops.

## Stack

- Next.js
- Supabase

## Routes

- `/login` is the initial authentication screen.
- `/home` is the post-login dashboard landing page.
- `/new-stock` is the stock shipment management page with tabs for adding new stock and viewing purchase history.

## UI Direction

- Design for mobile first, since the system is mostly used on phones.
- Keep layouts compact, readable, and easy to tap on small screens.
- Make desktop views feel complete and efficient, with better spacing, structure, and visual hierarchy.
- Avoid default starter-template styling; use a clearer DMS-specific visual language.
- Keep future UI work responsive by default instead of adding separate mobile and desktop experiences.

## Environment

Set these values in `.env.local` before wiring Supabase authentication:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` for server-side admin use only

## Inventory Data

The home dashboard reads from the Supabase `inventory` table documented in [`docs/inventory-table.md`](docs/inventory-table.md).
The main list shows `item_name`, `item_type`, `weight_grams`, `stock_quantity`, and `updated_at`.
The pricing fields stay hidden in the mobile-first details modal so the list stays compact.

## Stock Shipments

The `/new-stock` page records incoming stock into the `stock_shipments` and `stock_shipment_items` tables documented in [`docs/stock-shipments-table.md`](docs/stock-shipments-table.md).
Adding a shipment updates `inventory.stock_quantity` for each product included.
The purchase history tab shows past shipments, expandable to view individual product quantities and packs calculation (`quantity_added / units_per_pack`).

## Agent Notes

If you are an AI agent working in this repository, follow these rules before making changes:

- Read the repo structure once, then work from the most relevant nearby file instead of re-scanning the whole tree.
- Check `app/`, `package.json`, and config files only when needed for the current task.
- Do not create additional pages, routes, or UI screens unless the user explicitly asks for them.
- Keep edits minimal and local to the requested scope.
- Prefer updating existing markdown guidance over adding new workflow files unless necessary.

## Session Rules

- No narration or status updates unless the user asks for them.
- Touch only files named by the user or direct dependencies of those files.
- Run lint or type-check quietly; report only errors.
- If a task only needs documentation updates, do not modify application code.

## Project Structure

- `app/` contains the Next.js app router entry points.
- `app/login/page.tsx` contains the login screen.
- `app/home/page.tsx` contains the home dashboard landing page, highlighting inventory data.
- `app/new-stock/page.tsx` contains the new stock page with add stock and purchase history tabs.
- `app/new-stock/add-stock-form.tsx` is the form for recording a new shipment.
- `app/new-stock/purchase-history.tsx` shows past shipments with expandable product details.
- `app/components/sidebar.tsx` is the shared sidebar navigation component.
- `app/components/tabs.tsx` is a reusable tab switcher component.
- `app/components/detail-cell.tsx` is a reusable detail label/value display cell.
- `docs/` contains database schemas and other markdown documentation:
  - [`docs/inventory-table.md`](docs/inventory-table.md): Details the Supabase `inventory` table schema.
  - [`docs/stock-shipments-table.md`](docs/stock-shipments-table.md): Details the `stock_shipments` and `stock_shipment_items` tables.
- `public/` contains static assets.
- `eslint.config.mjs`, `next.config.ts`, `postcss.config.mjs`, and `tsconfig.json` hold project configuration.

## Getting Started

Install dependencies and run the development server with the package manager already used in the repo:

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.
