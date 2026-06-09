# Inventory Table Schema

This documentation outlines the `inventory` table structure defined in Supabase used to hold item catalogs, stock levels, and basic pricing.

The dashboard reads directly from the `inventory` table. If you see `inventary` in older notes or conversations, treat that as a typo.

## DDL Script

```sql
CREATE TABLE inventory (
    item_id BIGSERIAL PRIMARY KEY,
    item_name VARCHAR(255) NOT NULL,
    item_type VARCHAR(255) NOT NULL,
    weight_grams DECIMAL(10,2) NOT NULL,
    purchase_price DECIMAL(10,2) NOT NULL,
    selling_price DECIMAL(10,2) NOT NULL,
    units_per_pack INTEGER NOT NULL,
    stock_quantity INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

## Relationships

- `stock_shipment_items.item_id` references `inventory.item_id` (see [`docs/stock-shipments-table.md`](stock-shipments-table.md) for details on the stock shipment tables).

| Column | Type | Constraints | Description | Note |
| :--- | :--- | :--- | :--- | :--- |
| `item_id` | `BIGSERIAL` | Primary Key | Unique autoincremental item identifier. | |
| `item_name` | `VARCHAR(255)` | `NOT NULL` | Display name of the item. | |
| `item_type` | `VARCHAR(255)` | `NOT NULL` | The category or flavor profile of the item. | Displayed as the flavor/type label in the dashboard. |
| `weight_grams`| `DECIMAL(10,2)`| `NOT NULL` | Precise weight in grams. | |
| `purchase_price`| `DECIMAL(10,2)`| `NOT NULL` | Manufacturer/purchase cost. | Hidden on primary UI. |
| `selling_price`| `DECIMAL(10,2)`| `NOT NULL` | Dealer/retailer selling price. | Hidden on primary UI. |
| `units_per_pack`| `INTEGER` | `NOT NULL` | Items per bulk package. | Hidden on primary UI. |
| `stock_quantity`| `INTEGER` | `DEFAULT 0` | Available quantity on hand. | |
| `created_at` | `TIMESTAMP` | `DEFAULT NOW()` | The creation timestamp. | |
| `updated_at` | `TIMESTAMP` | `DEFAULT NOW()` | The latest update timestamp. | |
