-- SQLite
/*CREATE TABLE "productsInCart" (
 "price" REAL NOT NULL,
 "model" TEXT NOT NULL,
 "category" TEXT NOT NULL,
 "quantity" INTEGER NOT NULL,
 "idCart" TEXT,
  FOREIGN KEY("model") REFERENCES "products"("model") ON DELETE CASCADE,
   FOREIGN KEY("idCart") REFERENCES "carts"("id") ON DELETE CASCADE
);*/

/*INSERT INTO productsInCart(idCart, model, quantity, category, price)
VALUES(2, 'prod3', 1, 'Appliance', 355)*/

/*INSERT INTO productsInCart(idCart, model, quantity, category, price)
VALUES(2, 'prod2', 4, 'Smartphone', 1200)*/

/*INSERT INTO carts(paid, customer, paymentDate, total)
VALUES(0, 'davi23', NULL, 100)*/

/*INSERT INTO products(sellingPrice, model, category, arrivalDate, details, quantity)
VALUES(300, 'prod2', 'Smartphone', NULL, NULL, 5)*/

/*UPDATE productsInCart SET price=300 WHERE model='prod2'*/

UPDATE users SET role='Admin', username='davi25' WHERE username='davide25'

/*UPDATE productsInCart SET quantity=3 WHERE model='prod3'*/

/*UPDATE carts SET total=1255 WHERE id=2*/

