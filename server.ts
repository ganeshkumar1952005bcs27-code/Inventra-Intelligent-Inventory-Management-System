import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("inventory.db");

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT CHECK(role IN ('ADMIN', 'MANAGER', 'STAFF', 'CUSTOMER')) NOT NULL
  );

  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sku TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    price REAL NOT NULL CHECK(price > 0),
    min_stock INTEGER NOT NULL DEFAULT 0 CHECK(min_stock >= 0),
    current_stock INTEGER NOT NULL DEFAULT 0 CHECK(current_stock >= 0),
    expiry_date DATETIME,
    is_active INTEGER DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    type TEXT CHECK(type IN ('LOW_STOCK', 'OUT_OF_STOCK', 'EXPIRY_ALERT')) NOT NULL,
    severity TEXT CHECK(severity IN ('HIGH', 'MEDIUM', 'LOW')) NOT NULL,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE', 'RESOLVED')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id)
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    type TEXT CHECK(type IN ('STOCK_IN', 'STOCK_OUT')) NOT NULL,
    quantity INTEGER NOT NULL CHECK(quantity > 0),
    user_id INTEGER NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE,
    phone TEXT,
    address TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER NOT NULL,
    total_amount REAL NOT NULL,
    status TEXT CHECK(status IN ('PENDING', 'COMPLETED', 'CANCELLED')) DEFAULT 'PENDING',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    user_id INTEGER NOT NULL,
    FOREIGN KEY (customer_id) REFERENCES customers(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL CHECK(quantity > 0),
    price_at_time REAL NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
  );
`);

// Helper to evaluate alerts
const evaluateStockAlert = (productId: number) => {
  const product = db.prepare("SELECT * FROM products WHERE id = ?").get(productId) as any;
  if (!product || !product.is_active) return;

  // 1. Check Out of Stock
  if (product.current_stock === 0) {
    const existing = db.prepare("SELECT id FROM alerts WHERE product_id = ? AND type = 'OUT_OF_STOCK' AND status = 'ACTIVE'").get(productId);
    if (!existing) {
      db.prepare("INSERT INTO alerts (product_id, type, severity, message) VALUES (?, 'OUT_OF_STOCK', 'HIGH', ?)")
        .run(productId, `Product ${product.name} is out of stock!`);
    }
  } else {
    // Resolve OUT_OF_STOCK if stock > 0
    db.prepare("UPDATE alerts SET status = 'RESOLVED' WHERE product_id = ? AND type = 'OUT_OF_STOCK' AND status = 'ACTIVE'").run(productId);
  }

  // 2. Check Low Stock
  if (product.current_stock > 0 && product.current_stock < product.min_stock) {
    const existing = db.prepare("SELECT id FROM alerts WHERE product_id = ? AND type = 'LOW_STOCK' AND status = 'ACTIVE'").get(productId);
    if (!existing) {
      db.prepare("INSERT INTO alerts (product_id, type, severity, message) VALUES (?, 'LOW_STOCK', 'MEDIUM', ?)")
        .run(productId, `Product ${product.name} stock is low (${product.current_stock} units).`);
    }
  } else if (product.current_stock >= product.min_stock) {
    // Resolve LOW_STOCK if stock >= min
    db.prepare("UPDATE alerts SET status = 'RESOLVED' WHERE product_id = ? AND type = 'LOW_STOCK' AND status = 'ACTIVE'").run(productId);
  }

  // 3. Check Expiry (within 30 days)
  if (product.expiry_date) {
    const expiry = new Date(product.expiry_date);
    const now = new Date();
    const diffDays = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 30 && diffDays > 0) {
      const existing = db.prepare("SELECT id FROM alerts WHERE product_id = ? AND type = 'EXPIRY_ALERT' AND status = 'ACTIVE'").get(productId);
      if (!existing) {
        db.prepare("INSERT INTO alerts (product_id, type, severity, message) VALUES (?, 'EXPIRY_ALERT', 'LOW', ?)")
          .run(productId, `Product ${product.name} is expiring soon (${diffDays} days left).`);
      }
    }
  }
};

// Seed Users if empty
const userCount = db.prepare("SELECT COUNT(*) as count FROM users").get() as { count: number };
if (userCount.count === 0) {
  db.prepare("INSERT INTO users (username, password, role) VALUES (?, ?, ?)").run("admin", "admin123", "ADMIN");
  db.prepare("INSERT INTO users (username, password, role) VALUES (?, ?, ?)").run("manager", "manager123", "MANAGER");
  db.prepare("INSERT INTO users (username, password, role) VALUES (?, ?, ?)").run("staff", "staff123", "STAFF");
  db.prepare("INSERT INTO users (username, password, role) VALUES (?, ?, ?)").run("customer", "customer123", "CUSTOMER");
  db.prepare("INSERT INTO users (username, password, role) VALUES (?, ?, ?)").run("sarah", "sarah123", "MANAGER");
  db.prepare("INSERT INTO users (username, password, role) VALUES (?, ?, ?)").run("mike", "mike123", "STAFF");
}

// Seed Products if empty
const productCount = db.prepare("SELECT COUNT(*) as count FROM products").get() as { count: number };
if (productCount.count === 0) {
  const products = [
    { sku: 'LAP-001', name: 'MacBook Pro 14"', description: 'Apple M3 Pro chip, 16GB RAM, 512GB SSD', price: 1999.99, min_stock: 5, current_stock: 12, expiry_date: null },
    { sku: 'PHN-001', name: 'iPhone 15 Pro', description: 'Titanium design, A17 Pro chip, 128GB', price: 999.99, min_stock: 10, current_stock: 25, expiry_date: null },
    { sku: 'AUD-001', name: 'AirPods Pro 2', description: 'Active Noise Cancellation, USB-C charging', price: 249.99, min_stock: 15, current_stock: 8, expiry_date: null }, // Low stock
    { sku: 'ACC-001', name: 'Magic Mouse', description: 'Wireless, rechargeable, Multi-Touch surface', price: 79.00, min_stock: 20, current_stock: 45, expiry_date: null },
    { sku: 'MON-001', name: 'Dell 27" Monitor', description: '4K UHD, IPS, USB-C Hub', price: 449.99, min_stock: 8, current_stock: 0, expiry_date: null }, // Out of stock
    { sku: 'BAT-001', name: 'AA Batteries (4-pack)', description: 'Alkaline batteries', price: 5.99, min_stock: 50, current_stock: 100, expiry_date: '2026-04-10' }, // Expiring soon
  ];

  const insertProduct = db.prepare("INSERT INTO products (sku, name, description, price, min_stock, current_stock, expiry_date) VALUES (?, ?, ?, ?, ?, ?, ?)");
  for (const p of products) {
    const info = insertProduct.run(p.sku, p.name, p.description, p.price, p.min_stock, p.current_stock, p.expiry_date);
    evaluateStockAlert(Number(info.lastInsertRowid));
  }
}

// Seed Customers if empty
const customerCount = db.prepare("SELECT COUNT(*) as count FROM customers").get() as { count: number };
if (customerCount.count === 0) {
  db.prepare("INSERT INTO customers (name, email, phone, address) VALUES (?, ?, ?, ?)")
    .run("Walk-in Customer", "customer@example.com", "123-456-7890", "123 Main St, Inventra City");
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Auth API
  app.post("/api/login", (req, res) => {
    const { username, password } = req.body;
    const user = db.prepare("SELECT id, username, role FROM users WHERE username = ? AND password = ?").get(username, password) as any;
    
    if (user) {
      res.json({ success: true, user });
    } else {
      res.status(401).json({ success: false, message: "Invalid credentials" });
    }
  });

  // User Management (Admin only)
  app.get("/api/users", (req, res) => {
    const users = db.prepare("SELECT id, username, role FROM users").all();
    res.json(users);
  });

  app.post("/api/users", (req, res) => {
    const { username, password, role } = req.body;
    try {
      db.prepare("INSERT INTO users (username, password, role) VALUES (?, ?, ?)").run(username, password, role);
      res.json({ success: true });
    } catch (e: any) {
      res.status(400).json({ success: false, message: e.message });
    }
  });

  app.delete("/api/users/:id", (req, res) => {
    db.prepare("DELETE FROM users WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  // Product Management
  app.get("/api/products", (req, res) => {
    const products = db.prepare("SELECT * FROM products").all();
    res.json(products);
  });

  app.post("/api/products", (req, res) => {
    const { sku, name, description, price, min_stock, expiry_date } = req.body;
    try {
      const info = db.prepare("INSERT INTO products (sku, name, description, price, min_stock, current_stock, expiry_date) VALUES (?, ?, ?, ?, ?, 0, ?)")
        .run(sku, name, description, price, min_stock, expiry_date);
      evaluateStockAlert(Number(info.lastInsertRowid));
      res.json({ success: true });
    } catch (e: any) {
      res.status(400).json({ success: false, message: e.message });
    }
  });

  app.put("/api/products/:id", (req, res) => {
    const { name, description, price, min_stock, expiry_date, is_active } = req.body;
    db.prepare("UPDATE products SET name = ?, description = ?, price = ?, min_stock = ?, expiry_date = ?, is_active = ? WHERE id = ?")
      .run(name, description, price, min_stock, expiry_date, is_active === undefined ? 1 : is_active, req.params.id);
    evaluateStockAlert(Number(req.params.id));
    res.json({ success: true });
  });

  app.delete("/api/products/:id", (req, res) => {
    db.prepare("DELETE FROM products WHERE id = ?").run(req.params.id);
    db.prepare("DELETE FROM alerts WHERE product_id = ?").run(req.params.id);
    res.json({ success: true });
  });

  // Stock Operations
  app.post("/api/stock", (req, res) => {
    const { product_id, type, quantity, user_id } = req.body;
    
    const product = db.prepare("SELECT current_stock, is_active FROM products WHERE id = ?").get(product_id) as any;
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });
    if (!product.is_active) return res.status(400).json({ success: false, message: "Product is inactive" });

    if (type === "STOCK_OUT" && product.current_stock < quantity) {
      return res.status(400).json({ success: false, message: "Insufficient stock" });
    }

    const newStock = type === "STOCK_IN" ? product.current_stock + quantity : product.current_stock - quantity;

    const transaction = db.transaction(() => {
      db.prepare("UPDATE products SET current_stock = ? WHERE id = ?").run(newStock, product_id);
      db.prepare("INSERT INTO transactions (product_id, type, quantity, user_id) VALUES (?, ?, ?, ?)")
        .run(product_id, type, quantity, user_id);
    });

    transaction();
    evaluateStockAlert(product_id);
    res.json({ success: true, newStock });
  });

  // Alerts API
  app.get("/api/alerts", (req, res) => {
    const { type, severity, product_id, status } = req.query;
    let query = `
      SELECT a.*, p.name as product_name, p.sku as product_sku
      FROM alerts a
      JOIN products p ON a.product_id = p.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (type) {
      query += " AND a.type = ?";
      params.push(type);
    }
    if (severity) {
      query += " AND a.severity = ?";
      params.push(severity);
    }
    if (product_id) {
      query += " AND a.product_id = ?";
      params.push(product_id);
    }
    if (status) {
      query += " AND a.status = ?";
      params.push(status);
    }

    query += " ORDER BY a.created_at DESC";
    const alerts = db.prepare(query).all(...params);
    res.json(alerts);
  });

  app.put("/api/alerts/:id/resolve", (req, res) => {
    db.prepare("UPDATE alerts SET status = 'RESOLVED' WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  app.get("/api/transactions", (req, res) => {
    const { product_id, type, user_id, start_date, end_date, min_quantity } = req.query;
    let query = `
      SELECT t.*, p.name as product_name, u.username 
      FROM transactions t 
      JOIN products p ON t.product_id = p.id 
      JOIN users u ON t.user_id = u.id 
      WHERE 1=1
    `;
    const params: any[] = [];

    if (product_id) {
      query += " AND t.product_id = ?";
      params.push(product_id);
    }
    if (type) {
      query += " AND t.type = ?";
      params.push(type);
    }
    if (user_id) {
      query += " AND t.user_id = ?";
      params.push(user_id);
    }
    if (start_date) {
      query += " AND t.timestamp >= ?";
      params.push(start_date);
    }
    if (end_date) {
      query += " AND t.timestamp <= ?";
      params.push(end_date);
    }
    if (min_quantity) {
      query += " AND t.quantity >= ?";
      params.push(min_quantity);
    }

    query += " ORDER BY t.timestamp DESC";
    const transactions = db.prepare(query).all(...params);
    res.json(transactions);
  });

  // Customers API
  app.get("/api/customers", (req, res) => {
    const customers = db.prepare("SELECT * FROM customers ORDER BY name ASC").all();
    res.json(customers);
  });

  app.post("/api/customers", (req, res) => {
    const { name, email, phone, address } = req.body;
    try {
      db.prepare("INSERT INTO customers (name, email, phone, address) VALUES (?, ?, ?, ?)").run(name, email, phone, address);
      res.json({ success: true });
    } catch (e: any) {
      res.status(400).json({ success: false, message: e.message });
    }
  });

  app.put("/api/customers/:id", (req, res) => {
    const { name, email, phone, address } = req.body;
    db.prepare("UPDATE customers SET name = ?, email = ?, phone = ?, address = ? WHERE id = ?")
      .run(name, email, phone, address, req.params.id);
    res.json({ success: true });
  });

  app.delete("/api/customers/:id", (req, res) => {
    db.prepare("DELETE FROM customers WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  // Orders API
  app.get("/api/orders", (req, res) => {
    const orders = db.prepare(`
      SELECT o.*, c.name as customer_name, u.username 
      FROM orders o 
      JOIN customers c ON o.customer_id = c.id 
      JOIN users u ON o.user_id = u.id 
      ORDER BY o.created_at DESC
    `).all();
    res.json(orders);
  });

  app.get("/api/orders/:id", (req, res) => {
    const order = db.prepare(`
      SELECT o.*, c.name as customer_name, u.username 
      FROM orders o 
      JOIN customers c ON o.customer_id = c.id 
      JOIN users u ON o.user_id = u.id 
      WHERE o.id = ?
    `).get(req.params.id) as any;

    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    const items = db.prepare(`
      SELECT oi.*, p.name as product_name, p.sku as product_sku
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = ?
    `).all(req.params.id);

    res.json({ ...order, items });
  });

  app.post("/api/orders", (req, res) => {
    const { customer_id, items, user_id } = req.body; // items: [{product_id, quantity}]
    
    try {
      const transaction = db.transaction(() => {
        let totalAmount = 0;
        
        // 1. Validate stock and calculate total
        for (const item of items) {
          const product = db.prepare("SELECT price, current_stock, name FROM products WHERE id = ?").get(item.product_id) as any;
          if (!product) throw new Error(`Product not found`);
          if (product.current_stock < item.quantity) throw new Error(`Insufficient stock for ${product.name}`);
          totalAmount += product.price * item.quantity;
        }

        // 2. Create Order
        const orderInfo = db.prepare("INSERT INTO orders (customer_id, total_amount, user_id, status) VALUES (?, ?, ?, 'COMPLETED')")
          .run(customer_id, totalAmount, user_id);
        const orderId = orderInfo.lastInsertRowid;

        // 3. Create Order Items and update stock
        for (const item of items) {
          const product = db.prepare("SELECT price, current_stock FROM products WHERE id = ?").get(item.product_id) as any;
          
          db.prepare("INSERT INTO order_items (order_id, product_id, quantity, price_at_time) VALUES (?, ?, ?, ?)")
            .run(orderId, item.product_id, item.quantity, product.price);
          
          const newStock = product.current_stock - item.quantity;
          db.prepare("UPDATE products SET current_stock = ? WHERE id = ?").run(newStock, item.product_id);
          
          // Log transaction
          db.prepare("INSERT INTO transactions (product_id, type, quantity, user_id) VALUES (?, 'STOCK_OUT', ?, ?)")
            .run(item.product_id, item.quantity, user_id);
          
          evaluateStockAlert(Number(item.product_id));
        }

        return orderId;
      });

      const orderId = transaction();
      res.json({ success: true, orderId });
    } catch (e: any) {
      res.status(400).json({ success: false, message: e.message });
    }
  });

  // Global Error Handler
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error(err.stack);
    res.status(500).json({ success: false, message: err.message || "Internal Server Error" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
