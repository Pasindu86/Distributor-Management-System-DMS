# Database Schema — Daily Out

Run the following SQL in your Supabase SQL editor to create the required tables.

## Tables

### `daily_out`

```sql
CREATE TABLE daily_out (
  out_id        serial PRIMARY KEY,
  out_date      date NOT NULL DEFAULT CURRENT_DATE,
  total_selling_price numeric NOT NULL DEFAULT 0,
  discount_type text CHECK (discount_type IN ('fixed', 'percentage')) DEFAULT 'fixed',
  discount_value numeric NOT NULL DEFAULT 0,
  discount_amount numeric NOT NULL DEFAULT 0,
  final_amount  numeric NOT NULL DEFAULT 0,
  total_profit  numeric NOT NULL DEFAULT 0,
  notes         text,
  created_at    timestamptz NOT NULL DEFAULT now()
);
```

### `daily_out_items`

```sql
CREATE TABLE daily_out_items (
  id                     serial PRIMARY KEY,
  out_id                 int NOT NULL REFERENCES daily_out(out_id) ON DELETE CASCADE,
  item_id                int NOT NULL REFERENCES inventory(item_id),
  quantity_out           int NOT NULL,
  selling_price_per_unit numeric NOT NULL,
  purchase_price_per_unit numeric NOT NULL,
  line_total             numeric NOT NULL
);
```

### RPC: Decrement stock

```sql
CREATE OR REPLACE FUNCTION decrement_stock(p_item_id int, p_quantity int)
RETURNS void AS $$
BEGIN
  UPDATE inventory
  SET stock_quantity = stock_quantity - p_quantity,
      updated_at = now()
  WHERE item_id = p_item_id;
END;
$$ LANGUAGE plpgsql;
```
