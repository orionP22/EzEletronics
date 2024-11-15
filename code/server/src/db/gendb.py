import sqlite3

# Create a new database file
conn = sqlite3.connect('db.db')
cursor = conn.cursor()

# Execute multiple queries
queries = '''
CREATE TABLE users (
    username VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255),
    surname VARCHAR(255),
    role VARCHAR(255),
    password VARCHAR(255),
    salt VARCHAR(255),
    address TEXT,
    birthdate DATE
);

CREATE TABLE products (
    sellingPrice NUMBER,
    model VARCHAR(255) PRIMARY KEY,
    category VARCHAR(255),
    arrivalDate DATE,
    details TEXT,
    quantity INT
);

CREATE TABLE ProductReview (
    model VARCHAR(255),
    user VARCHAR(255),
    score INT,
    date DATE,
    comment TEXT,
    PRIMARY KEY (model, user),
    FOREIGN KEY (model) REFERENCES products(model) ON DELETE CASCADE,
    FOREIGN KEY (user) REFERENCES users(username) ON DELETE CASCADE
);

CREATE TABLE carts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer VARCHAR(255),
    paid BOOLEAN,
    paymentDate DATE,
    total NUMBER,
    FOREIGN KEY (customer) REFERENCES users(username) ON DELETE CASCADE
);

CREATE TABLE productsInCart (
    idCart INT,
    model VARCHAR(255),
    price DECIMAL(10, 2),
    category VARCHAR(255),
    quantity INT,
    PRIMARY KEY (idCart, model),
    FOREIGN KEY (idCart) REFERENCES carts(id) ON DELETE CASCADE,
    FOREIGN KEY (model) REFERENCES products(model) ON DELETE CASCADE
);
'''

cursor.executescript(queries)

# Commit the changes and close the connection
conn.commit()
conn.close()

conn = sqlite3.connect('testdb.db')
cursor = conn.cursor()
cursor.executescript(queries)

# Commit the changes and close the connection
conn.commit()
conn.close()