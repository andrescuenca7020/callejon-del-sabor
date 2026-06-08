-- Insert categories
INSERT INTO categories (name, sort_order) VALUES 
  ('PLATOS FUERTES', 1),
  ('PORCIONES', 2),
  ('BEBIDAS', 3),
  ('EXTRAS', 4);

-- Insert PLATOS FUERTES
INSERT INTO products (name, price, stock, category_id, is_extra, applies_to_takeaway) VALUES
  ('Filete de Pollo', 2.50, 20, 1, FALSE, TRUE),
  ('Chuleta de Cerdo', 3.50, 15, 1, FALSE, TRUE),
  ('Costilla de Cerdo', 4.00, 10, 1, FALSE, TRUE),
  ('Presa de Pollo', 2.50, 20, 1, FALSE, TRUE),
  ('Pincho de Camarón', 3.50, 15, 1, FALSE, TRUE),
  ('Papi Pollo', 2.50, 30, 1, FALSE, TRUE),
  ('Salchipapa', 1.50, 40, 1, FALSE, TRUE),
  ('Choclo Asado', 1.50, 15, 1, FALSE, FALSE);

-- Insert PORCIONES
INSERT INTO products (name, price, stock, category_id, is_extra) VALUES
  ('Porción', 1.00, 50, 2, FALSE);

-- Insert BEBIDAS
INSERT INTO products (name, price, stock, category_id, is_extra) VALUES
  ('Jarra Horchata', 3.00, 20, 3, FALSE),
  ('1/2 Jarra Horchata', 1.50, 20, 3, FALSE),
  ('Vaso', 0.50, 50, 3, FALSE),
  ('Café', 0.75, 30, 3, FALSE),
  ('Cola Personal', 0.75, 40, 3, FALSE),
  ('Cola Litro', 1.25, 20, 3, FALSE);

-- Insert EXTRAS
INSERT INTO products (name, price, stock, category_id, is_extra, applies_to_takeaway) VALUES
  ('Bandeja extra para llevar', 0.25, 100, 4, TRUE, TRUE);