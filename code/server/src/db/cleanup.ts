"use strict"

import db from "../db/db";

/**
 * Deletes all data from the database.
 * This function must be called before any integration test, to ensure a clean database state for each test run.
 */

// Define table creation SQL statements
const createTablesSQL = `
CREATE TABLE IF NOT EXISTS "users" (
    "username"  TEXT NOT NULL UNIQUE,
    "name"  TEXT NOT NULL,
    "surname"   TEXT NOT NULL,
    "role"  TEXT NOT NULL,
    "password"  TEXT,
    "salt"  TEXT,
    "address"   TEXT,
    "birthdate" TEXT,
    PRIMARY KEY("username")
);

CREATE TABLE IF NOT EXISTS "ProductReview" (
    model TEXT NOT NULL,
    user TEXT NOT NULL,
    score INTEGER NOT NULL,
    date TEXT NOT NULL,
    comment TEXT,
    PRIMARY KEY (model, user)
);

CREATE TABLE IF NOT EXISTS "products" (
    sellingPrice REAL NOT NULL,
    model TEXT PRIMARY KEY NOT NULL,
    category TEXT NOT NULL,
    arrivalDate TEXT,
    details TEXT,
    quantity INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS "carts" (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer TEXT NOT NULL,
    paid INTEGER NOT NULL,
    paymentDate TEXT,
    total REAL,
    FOREIGN KEY (customer) REFERENCES users(username)
);

CREATE TABLE IF NOT EXISTS "productsInCart" (
    idCart INTEGER NOT NULL,
    model TEXT NOT NULL,
    price REAL NOT NULL,
    category TEXT,
    quantity INTEGER NOT NULL,
    PRIMARY KEY(idCart, model),
    FOREIGN KEY (idCart) REFERENCES carts(id),
    FOREIGN KEY (model) REFERENCES products(model)
);

`;

export function cleanup(): Promise<void> {
    return new Promise((resolve, reject) => {
        
       db.run("DELETE FROM users", (err) => {
              if (err) {
                reject(err);
              }
            db.run("DELETE FROM productsInCart", (err) => {
                if (err) {
                    reject(err);
                    }
                    db.run("DELETE FROM carts", (err) => {
                        if (err) {
                            reject(err);
                            }
                            db.run("DELETE FROM products", (err) => {
                                if (err) {
                                    reject(err);
                                    }
                                    db.run("DELETE FROM ProductReview", (err) => {
                                        if (err) {
                                            reject(err);
                                            }
                                        
                                        resolve();
                                    }); 
                            }); 
                    }); 
            });


         });

    });
}

// export function cleanup(): Promise<void> {
//     return new Promise((resolve, reject) => {
        
//          // Assuming you have a list of tables you want to clear or reset
//     const tables = ['users', 'productsInCart', 'carts', 'products','ProductReview']; // Add your table names here

//     // Generate SQL to delete data from each table
//     const deletePromises = tables.map(table => new Promise((resolve, reject) => {
//       db.run(`DELETE FROM ${table}`, [], function(err) {
//         if (err) {
//           console.error(`Error clearing table ${table}`, err);
//           return reject(err);
//         }
//         resolve(true);
//       });
//     }));

//     // Execute all delete operations
//     Promise.all(deletePromises).then(() => {
//       db.close((err) => {
//         if (err) {
//           console.error('Error closing database', err);
//           return reject(err);
//         }
//         resolve();
//       });
//     }).catch(reject);
//   });
// }