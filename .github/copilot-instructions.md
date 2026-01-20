# Copilot Instructions - Stock Inventory Management System

## Architecture Overview

**Tech Stack**: Next.js 15 (App Router) + React 19 + Prisma + MongoDB + JWT auth  
**State Management**: Zustand global store ([useProductStore.ts](app/useProductStore.ts))  
**Routing**: Hybrid - App Router for pages (`app/`) + Pages Router for API routes (`pages/api/`)  
**Auth**: JWT tokens stored in cookies (`session_id`), validated via [authContext.tsx](app/authContext.tsx)

### Directory Structure Logic
- `app/` - Client components and pages (App Router)
- `pages/api/` - Server-side API endpoints (Pages Router)
- `prisma/` - Database schema + custom client wrappers ([client.ts](prisma/client.ts), [product.ts](prisma/product.ts))
- `components/ui/` - Shadcn/ui components (DO NOT edit directly, regenerate via CLI)
- `utils/` - [axiosInstance.ts](utils/axiosInstance.ts) (auto-attaches JWT), [auth.ts](utils/auth.ts) (session helpers)

## Critical Patterns

### 1. Data Fetching Flow
```typescript
// Client → Zustand → axiosInstance → API Route → Prisma
useProductStore.loadProducts() 
  → axiosInstance.get("/products") // Auto-adds JWT from cookies
  → pages/api/products/index.ts
  → prisma.product.findMany({ where: { userId } }) // Always filter by session userId
```

### 2. Authentication Guards
- **Client-side**: `useAuth()` hook checks `isLoggedIn` state ([authContext.tsx](app/authContext.tsx))
- **API routes**: `getSessionServer(req, res)` validates JWT, returns `{ id, email }` or null
- **Middleware**: [middleware.ts](middleware.ts) protects `/api-docs`, `/api-status`, `/business-insights` routes

### 3. Prisma BigInt Handling
MongoDB stores `quantity` as `BigInt`. **Always convert**:
```typescript
// Writing
quantity: BigInt(quantity) as any

// Reading
quantity: Number(product.quantity)
```

### 4. Dialog State Management
Product dialogs use dual state pattern:
- `openProductDialog` (boolean) - Dialog visibility
- `selectedProduct` (Product | null) - Edit vs Add mode
```typescript
// Edit: setSelectedProduct(product) + setOpenProductDialog(true)
// Add: setSelectedProduct(null) + setOpenProductDialog(true)
```

## Development Commands

```bash
npm run dev              # Start dev server (auto-runs prisma generate via postinstall)
npm run build            # Prisma generate + Next.js build
npm run prisma:generate  # Regenerate Prisma client after schema changes
npm run prisma:migrate   # Apply schema migrations (dev only)
```

## Project-Specific Conventions

### API Response Format
All product API endpoints return enriched data:
```typescript
{
  ...product,
  category: "Electronics",  // Joined from categories table
  supplier: "Acme Corp"     // Joined from suppliers table
}
```

### Form Validation
- Use `react-hook-form` + `zod` schemas (see [AddProductDialog.tsx](app/AppTable/ProductDialog/AddProductDialog.tsx))
- SKU validation: `/^[a-zA-Z0-9-_]+$/` (alphanumeric + hyphens/underscores)
- Toast notifications via `useToast()` hook for all user actions

### Performance Optimizations
- `React.memo()` for expensive components
- Zustand state comparison prevents unnecessary updates:
  ```typescript
  if (JSON.stringify(state.allProducts) !== JSON.stringify(products)) {
    return { allProducts: products };
  }
  ```

### Environment-Specific Logic
```typescript
if (process.env.NODE_ENV === "development") {
  console.log(...); // Debugging only in dev
}

// axiosInstance baseURL switches based on NODE_ENV
```

## Common Tasks

### Adding a New Product Field
1. Update [schema.prisma](prisma/schema.prisma) → `npm run prisma:migrate`
2. Add to `Product` type in [types.ts](app/types.ts)
3. Update API routes: [pages/api/products/index.ts](pages/api/products/index.ts) (POST/PUT/GET)
4. Add to Zustand store if needed: [useProductStore.ts](app/useProductStore.ts)
5. Update table columns: [Products/columns.tsx](app/Products/columns.tsx)
6. Add form field to [AddProductDialog.tsx](app/AppTable/ProductDialog/AddProductDialog.tsx)

### Adding Protected Routes
Add to `protectedRoutes` array in [middleware.ts](middleware.ts):
```typescript
const protectedRoutes = ["/api-docs", "/api-status", "/business-insights", "/your-route"];
```

## Integration Points

- **Analytics Dashboard**: [business-insights/page.tsx](app/business-insights/page.tsx) uses `recharts` library
- **Data Export**: CSV (papaparse) + Excel (xlsx) - see export buttons in product table
- **QR Codes**: [qr-code.tsx](components/ui/qr-code.tsx) component generates product QR codes
- **Theme System**: `next-themes` provider in [ThemeProvider.tsx](app/ThemeProvider.tsx)

## Known Quirks

- React Strict Mode is **disabled** (`reactStrictMode: false` in [next.config.ts](next.config.ts))
- API routes use Pages Router despite App Router being primary (Next.js limitation for API routes)
- `session_id` cookie stores JWT token (name differs from typical `token` naming)
- Categories and Suppliers are per-user isolated (filtered by `userId` in DB queries)
