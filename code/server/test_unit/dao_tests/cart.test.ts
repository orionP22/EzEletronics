import db from "../../src/db/db";
import { Role, User } from "../../src/components/user";
import CartDAO from "../../src/dao/cartDAO";
import { ProductNotFoundError, EmptyProductStockError, LowProductStockError } from "../../src/errors/productError";
import { CartNotFoundError, EmptyCartError, ProductNotInCartError } from "../../src/errors/cartError";
import { Database } from "sqlite3";
import dayjs from "dayjs";

jest.mock("../../src/db/db.ts");

let cartDAO: CartDAO;
const testUser = new User("testuser", "Test", "User", Role.CUSTOMER,   "address", "2023/12/04");

beforeEach(() => {
    cartDAO = new CartDAO();
});

afterEach(() => {
    jest.restoreAllMocks();
});


    test('should return an empty cart when no cart exists for the user', async () => {
        jest.spyOn(db, "get").mockImplementation((_sql, _params, callback) => {
            callback(null, null);
            return {} as Database;
        });

        const cart = await cartDAO.getCart(testUser);
        expect(cart.total).toBe(0);
        expect(cart.products.length).toBe(0);
    });

    test('should add a product to a new cart', async () => {
        jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            if (sql.includes("FROM products")) {
                callback(null, { category: "Category1", sellingPrice: 100, quantity: 10 });
            } else if (sql.includes("SELECT id, total FROM carts WHERE customer=? AND paid=0")) {
                callback(null, { id: 1, total: 0 });
            } else if (sql.includes("SELECT id FROM carts WHERE customer=? AND paid=0")) {
                callback(null, { id: 1 });
            }
            return {} as Database;
        });
    
        jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            if (sql.includes("INSERT INTO productsInCart(price, model, category, quantity, idCart) VALUES(?, ?, ?, ?, ?)")) {
                callback(null);
            } else if (sql.includes("UPDATE productsInCart SET quantity=? WHERE model=? AND idCart=?")) {
                callback(null);
            } else if (sql.includes("UPDATE carts SET total=? WHERE id=?")) {
                callback(null);
            } else if (sql.includes("INSERT INTO carts(customer, paid, paymentDate, total) VALUES(?, ?, ?, ?)")) {
                callback(null);
            }
            return {} as Database;
        });
    
        const mock1 = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
            if (sql.includes("SELECT model, category, quantity, price FROM productsInCart WHERE idCart=?")) {
                callback(null, [{ model: "Product1", category: "Category1", quantity: 1, price: 100 }]);
            } else if (sql.includes("SELECT id FROM carts WHERE customer=? AND paid=0")) {
                callback(null, [{ id: 1 }]);
            } else {
                callback(null, []);
            }
            return {} as Database;
        });


        const result = await cartDAO.addToCart(testUser, "Product1");
        expect(result).toBe(true);
        mock1.mockRestore();
    });

    
    test('should return all carts', async () => {
        jest.spyOn(db, "all").mockImplementation((sql, callback) => {
            callback(null, []);
            return {} as Database

        });
    
        const result = await cartDAO.getAllCarts();
        expect(result).toEqual([
            
        ]);
    });
    
    // Additional tests for other methods
    test('should throw ProductNotFoundError when product does not exist', async () => {
        jest.spyOn(db, "get").mockImplementation((_sql, _params, callback) => {
            callback(null, null);
            return {} as Database;
        });

        await expect(cartDAO.addToCart(testUser, "NonExistentProduct"))
            .rejects.toThrow(ProductNotFoundError);
    });

    test('should throw EmptyProductStockError when product is out of stock', async () => {
        jest.spyOn(db, "get").mockImplementation((_sql, _params, callback) => {
            callback(null, { category: "Category1", sellingPrice: 100, quantity: 0 });
            return {} as Database;
        });

        await expect(cartDAO.addToCart(testUser, "Product1"))
            .rejects.toThrow(EmptyProductStockError);
    });

    ////CHECKOUT
    test('should successfully checkout a cart', async () => {
        jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            if (sql.includes("SELECT id, customer, paid, paymentDate, total FROM carts WHERE customer=? AND paid=?")) {
                callback(null, { id: 1, total: 200 });
            }
            return {} as Database;
        });
    
        jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
            if (sql.includes("SELECT pc.model AS model, (p.quantity-pc.quantity) AS diffStock, p.quantity AS avaiableStock FROM productsInCart AS pc, products AS p WHERE pc.idCart=? AND pc.model=p.model")) {
                callback(null, [{ model: "Product1", diffStock: 8, avaiableStock: 10 }]);
            }
            return {} as Database;
        });
    
        jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback(null);
            return {} as Database;
        });
    
        const result = await cartDAO.checkoutCart(testUser);
        expect(result).toBe(true);
    });
    
    test('should throw CartNotFoundError when there is no current cart for the user', async () => {
        jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(null, null);
            return {} as Database;
        });
    
        await expect(cartDAO.checkoutCart(testUser))
            .rejects.toThrow(CartNotFoundError);
    });
    
    test('should throw EmptyCartError when the current cart is empty', async () => {
        jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(null, { id: 1, total: 0 });
            return {} as Database;
        });
    
        await expect(cartDAO.checkoutCart(testUser))
            .rejects.toThrow(EmptyCartError);
    });
    
    test('should throw EmptyProductStockError when any product in the cart is out of stock', async () => {
        jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(null, { id: 1, total: 200 });
            return {} as Database;
        });
    
        jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
            if (sql.includes("SELECT pc.model AS model, (p.quantity-pc.quantity) AS diffStock, p.quantity AS avaiableStock FROM productsInCart AS pc, products AS p WHERE pc.idCart=? AND pc.model=p.model")) {
                callback(null, [{ model: "Product1", diffStock: 0, avaiableStock: 0 }]);
            }
            return {} as Database;
        });
    
        await expect(cartDAO.checkoutCart(testUser))
            .rejects.toThrow(EmptyProductStockError);
    });

    test('should throw LowProductStockError when any product in the cart has insufficient stock', async () => {
        jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(null, { id: 1, total: 200 });
            return {} as Database;
        });
    
        jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
            if (sql.includes("SELECT pc.model AS model, (p.quantity-pc.quantity) AS diffStock, p.quantity AS avaiableStock FROM productsInCart AS pc, products AS p WHERE pc.idCart=? AND pc.model=p.model")) {
                callback(null, [{ model: "Product1", diffStock: -1, avaiableStock: 10 }]);
            }
            return {} as Database;
        });
    
        await expect(cartDAO.checkoutCart(testUser))
            .rejects.toThrow(LowProductStockError);
    });


    //GET ALL CARTS
    test('should return customer carts with products', async () => {
        const mockCart = { id: 1, customer: "testuser", paid: 1, paymentDate: "2023-12-04", total: 200 };
        const mockProduct = { price: 100, model: "Product1", category: "Category1", quantity: 2 };
    
        jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
            if (sql.includes("SELECT id, customer, paid, paymentDate, total FROM carts WHERE customer=? AND paid=?")) {
                callback(null, [mockCart]);
            } else if (sql.includes("SELECT price, model, category, quantity FROM productsInCart WHERE idCart=?")) {
                callback(null, [mockProduct]);
            }
            return {} as Database;
        });
    
        const result = await cartDAO.getCustomerCarts(testUser);
        expect(result.length).toBe(1);
        expect(result[0].customer).toBe("testuser");
        expect(result[0].products.length).toBe(1);
        expect(result[0].products[0].model).toBe("Product1");
        expect(result[0].products[0].quantity).toBe(2);
    });
    
    test('should return an empty array when the customer has no paid carts', async () => {
        jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
            if (sql.includes("SELECT id, customer, paid, paymentDate, total FROM carts WHERE customer=? AND paid=?")) {
                callback(null, []);
            }
            return {} as Database;
        });
    
        const result = await cartDAO.getCustomerCarts(testUser);
        expect(result).toEqual([]);
    });
    
    test('should reject when there is a database error', async () => {
        jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
            callback(new Error("Database error"), null);
            return {} as Database;
        });
    
        await expect(cartDAO.getCustomerCarts(testUser))
            .rejects.toThrow("Database error");
    });
    
    test('should reject when there is a database error fetching products', async () => {
        const mockCart = { id: 1, customer: "testuser", paid: 1, paymentDate: "2023-12-04", total: 200 };
    
        jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
            if (sql.includes("SELECT id, customer, paid, paymentDate, total FROM carts WHERE customer=? AND paid=?")) {
                callback(null, [mockCart]);
            } else if (sql.includes("SELECT price, model, category, quantity FROM productsInCart WHERE idCart=?")) {
                callback(new Error("Database error"), null);
            }
            return {} as Database;
        });
    
        await expect(cartDAO.getCustomerCarts(testUser))
            .rejects.toThrow("Database error");
    });

    //REMOVE PRODUCT FROM CART
    test('should remove a product from the cart by decreasing its quantity', async () => {
        const mockProduct = { sellingPrice: 100, model: "Product1", category: "Category1", arrivalDate: "2023-01-01", details: "Details", quantity: 10 };
        const mockCart = { id: 1, customer: "testuser", paid: 0, paymentDate: null as any, total: 200 };
        const mockProductInCart = { price: 100, model: "Product1", quantity: 2 };
    
        jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            if (sql.includes("SELECT sellingPrice, model, category, arrivalDate, details, quantity FROM products WHERE model=?")) {
                callback(null, mockProduct);
            } else if (sql.includes("SELECT id, customer, paid, paymentDate, total FROM carts WHERE customer=? AND paid=?")) {
                callback(null, mockCart);
            } else if (sql.includes("SELECT price, model, quantity FROM productsInCart WHERE idCart=? AND model=?")) {
                callback(null, mockProductInCart);
            }
            return {} as Database;
        });
    
        jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback(null);
            return {} as Database;
        });
    
        const result = await cartDAO.removeProductFromCart(testUser, "Product1");
        expect(result).toBe(true);
    });
    
    test('should remove a product from the cart by deleting it when quantity is 1', async () => {
        const mockProduct = { sellingPrice: 100, model: "Product1", category: "Category1", arrivalDate: "2023-01-01", details: "Details", quantity: 10 };
        const mockCart = { id: 1, customer: "testuser", paid: 0, paymentDate: null as any, total: 100 };
        const mockProductInCart = { price: 100, model: "Product1", quantity: 1 };
    
        jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            if (sql.includes("SELECT sellingPrice, model, category, arrivalDate, details, quantity FROM products WHERE model=?")) {
                callback(null, mockProduct);
            } else if (sql.includes("SELECT id, customer, paid, paymentDate, total FROM carts WHERE customer=? AND paid=?")) {
                callback(null, mockCart);
            } else if (sql.includes("SELECT price, model, quantity FROM productsInCart WHERE idCart=? AND model=?")) {
                callback(null, mockProductInCart);
            }
            return {} as Database;
        });
    
        jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback(null);
            return {} as Database;
        });
    
        const result = await cartDAO.removeProductFromCart(testUser, "Product1");
        expect(result).toBe(true);
    });
    
    test('should throw ProductNotFoundError when the product does not exist', async () => {
        jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(null, null);
            return {} as Database;
        });
    
        await expect(cartDAO.removeProductFromCart(testUser, "NonExistentProduct"))
            .rejects.toThrow(ProductNotFoundError);
    });
    
    test('should throw CartNotFoundError when there is no current cart for the user', async () => {
        const mockProduct = { sellingPrice: 100, model: "Product1", category: "Category1", arrivalDate: "2023-01-01", details: "Details", quantity: 10 };
    
        jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            if (sql.includes("SELECT sellingPrice, model, category, arrivalDate, details, quantity FROM products WHERE model=?")) {
                callback(null, mockProduct);
            } else if (sql.includes("SELECT id, customer, paid, paymentDate, total FROM carts WHERE customer=? AND paid=?")) {
                callback(null, null);
            }
            return {} as Database;
        });
    
        await expect(cartDAO.removeProductFromCart(testUser, "Product1"))
            .rejects.toThrow(CartNotFoundError);
    });
    
    test('should throw ProductNotInCartError when the product is not in the cart', async () => {
        const mockProduct = { sellingPrice: 100, model: "Product1", category: "Category1", arrivalDate: "2023-01-01", details: "Details", quantity: 10 };
        const mockCart = { id: 1, customer: "testuser", paid: 0, paymentDate: null as any, total: 200 };
    
        jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            if (sql.includes("SELECT sellingPrice, model, category, arrivalDate, details, quantity FROM products WHERE model=?")) {
                callback(null, mockProduct);
            } else if (sql.includes("SELECT id, customer, paid, paymentDate, total FROM carts WHERE customer=? AND paid=?")) {
                callback(null, mockCart);
            } else if (sql.includes("SELECT price, model, quantity FROM productsInCart WHERE idCart=? AND model=?")) {
                callback(null, null);
            }
            return {} as Database;
        });
    
        await expect(cartDAO.removeProductFromCart(testUser, "Product1"))
            .rejects.toThrow(ProductNotInCartError);
    });

    //CLEAR CART
    
test('should clear the cart successfully', async () => {
    const mockCart = { id: 1, customer: "testuser", paid: 0, paymentDate: null as any, total: 200 };

    jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
        callback(null, mockCart);
        return {} as Database;
    });

    jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
        callback(null);
        return {} as Database;
    });

    const result = await cartDAO.clearCart(testUser);
    expect(result).toBe(true);
});

test('should throw CartNotFoundError when there is no current cart for the user', async () => {
    jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
        callback(null, null);
        return {} as Database;
    });

    await expect(cartDAO.clearCart(testUser))
        .rejects.toThrow(CartNotFoundError);
});

test('should handle error when deleting products from cart', async () => {
    const mockCart = { id: 1, customer: "testuser", paid: 0, paymentDate: null as any, total: 200 };

    jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
        callback(null, mockCart);
        return {} as Database;
    });

    jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
        callback(new Error("Error deleting products"));
        return {} as Database;
    });

    await expect(cartDAO.clearCart(testUser))
        .rejects.toThrow("Error deleting products");
});

test('should handle error when updating cart total', async () => {
    const mockCart = { id: 1, customer: "testuser", paid: 0, paymentDate: null as any, total: 200 };

    jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
        callback(null, mockCart);
        return {} as Database;
    });

    jest.spyOn(db, "run").mockImplementationOnce((sql, params, callback) => {
        callback(null); // Successful delete from productsInCart
        return {} as Database;
    });

    jest.spyOn(db, "run").mockImplementationOnce((sql, params, callback) => {
        callback(new Error("Error updating cart total")); // Error updating total
        return {} as Database;
    });

    await expect(cartDAO.clearCart(testUser))
        .rejects.toThrow("Error updating cart total");
});

//DELETE ALL CARTS

test('should delete all carts successfully', async () => {
    jest.spyOn(db, "run").mockImplementation((sql, callback) => {
        callback(null);
        return {} as Database;
    });

    const result = await cartDAO.deleteAllCarts();
    expect(result).toBe(true);
});

test('should handle error when deleting all carts', async () => {
    jest.spyOn(db, "run").mockImplementation((sql, callback) => {
        callback(new Error("Error deleting all carts"));
        return {} as Database;
    });

    await expect(cartDAO.deleteAllCarts())
        .rejects.toThrow("Error deleting all carts");
});

//GET ALL CARTS
test('should return an empty list when no carts are found', async () => {
    jest.spyOn(db, "all").mockImplementation((sql, callback) => {
        if (sql.includes("SELECT id, customer, paid, total FROM carts")) {
            callback(null, []);
        }
        return {} as Database;
    });

    const result = await cartDAO.getAllCarts();
    expect(result).toEqual([]);
});

test('should handle a database error when fetching carts', async () => {
    jest.spyOn(db, "all").mockImplementation((sql, callback) => {
        if (sql.includes("SELECT id, customer, paid, total FROM carts")) {
            callback(new Error("Database error"), null);
        }
        return {} as Database;
    });

    await expect(cartDAO.getAllCarts())
        .rejects.toThrow("Database error");
});

test('should handle a database error when fetching products for a cart', async () => {
    const mockCart = { id: 1, customer: "testuser", paid: 1, total: 200 };

    // Mocking the db.all method
    jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
        if (typeof params === 'function') {
            callback = params;
        }

        if (sql.includes("SELECT id, customer, paid, total FROM carts")) {
            callback(null, [mockCart]);
        } else if (sql.includes("SELECT model, category, quantity, price FROM productsInCart WHERE idCart=?")) {
            callback(new Error("Database error"), null);
        }
        return {} as any;
    });

    // Your function call that should trigger the mocked db.all
    await expect(cartDAO.getAllCarts()).rejects.toThrow("Database error");
});


test('should return all carts with their associated products', async () => {
    const mockCart = { id: 1, customer: "testuser", paid: 1, total: 200 };
    const mockProduct = { model: "Product1", category: "Category1", quantity: 2, price: 100 };

    jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
        if (typeof params === 'function') {
            callback = params;
        }

        if (sql.includes("SELECT id, customer, paid, total FROM carts")) {
            callback(null, [mockCart]);
        } else if (sql.includes("SELECT model, category, quantity, price FROM productsInCart WHERE idCart=?")) {
            callback(null, [mockProduct]);
        }
        return {} as any;
    });

    const result = await cartDAO.getAllCarts();
    expect(result.length).toBe(1);
    expect(result[0].customer).toBe("testuser");
    expect(result[0].products.length).toBe(1);
    expect(result[0].products[0].model).toBe("Product1");
    expect(result[0].products[0].quantity).toBe(2);
});
