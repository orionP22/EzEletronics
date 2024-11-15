import ProductDAO from "../../src/dao/productDAO";
import db from "../../src/db/db";
import { Database } from "sqlite3";
import { Product, Category } from "../../src/components/product";
import { EmptyProductStockError, InvalidArrivalDateError, LowProductStockError, ProductAlreadyExistsError, ProductNotFoundError } from "../../src/errors/productError";
import dayjs from "dayjs";

jest.mock("../../src/db/db.ts");

    let productDAO: ProductDAO;

    beforeEach(() => {
        productDAO = new ProductDAO();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    })

    test("It should register a product successfully", async() => {
        const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback(null)
            return {} as Database
        });

        await expect(productDAO.registerProducts("Model1", "Category1", 10, "Details", 100, "2023-01-01"))
            .resolves.toBeUndefined();

        expect(db.run).toHaveBeenCalledWith(
            expect.any(String), expect.any(Array),
            expect.any(Function)
        );
        
        mockDBRun.mockRestore();
    });

    test('should throw InvalidArrivalDateError for future arrival date', async () => {
        await expect(productDAO.registerProducts("Model1", "Category1", 10, "Details", 100, "2099-01-01"))
            .rejects.toThrow(InvalidArrivalDateError);
    });

    test('should throw InvalidArrivalDateError for wrong formate date', async () => {
        await expect(productDAO.registerProducts("Model1", "Category1", 10, "Details", 100, "2099-01-01"))
            .rejects.toThrow(InvalidArrivalDateError);
    });

    test('should throw ProductAlreadyExistsError for duplicate model', async () => {
        const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            const error = new Error("UNIQUE constraint failed: products.model");
            callback(error);
            return {} as Database;
        });

        await expect(productDAO.registerProducts("Model1", "Category1", 10, "Details", 100, "2023-01-01"))
            .rejects.toThrow(ProductAlreadyExistsError);

            expect(db.run).toHaveBeenCalledWith(
                expect.any(String),
                expect.any(Array),
                expect.any(Function)
            );
    
            mockDBRun.mockRestore();
    });

    test("It should throw ProductNotFoundError for other database errors", async () => {
        const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            const error = new Error("Some other database error");
            callback(error);
            return {} as Database; //Puoi specificare il tipo come {} as Database se necessario
        });

        await expect(productDAO.registerProducts("Model1", "Category1", 10, "Details", 100, "2023-01-01"))
            .rejects.toThrow(ProductNotFoundError);

        expect(db.run).toHaveBeenCalledWith(
            expect.any(String),
            ["Model1", "Category1", 10, "Details", 100, "2023-01-01"],
            expect.any(Function)
        );

        mockDBRun.mockRestore();
    });

    test('should throw InvalidArrivalDateError for invalid date format', async () => {
        jest.spyOn(global, 'Date').mockImplementation(() => { throw new Error('Invalid date'); });

        await expect(productDAO.registerProducts("Model1", "Category1", 10, "Details", 100, "invalid-date"))
            .rejects.toThrow(InvalidArrivalDateError);
    });

    //TEST changeProductQuantity

    test("It should update the quantity when product exist", async () => {
        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(null, { quantity: 10 });
            return {} as Database;
        });

        const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback(null);
            return {} as Database;
        });

        await expect(productDAO.changeProductQuantity("Model1", 5, "2024-06-01"))
            .resolves.toBe(15);

        expect(db.get).toHaveBeenCalledWith(
            expect.any(String), expect.any(Array), expect.any(Function)
        );
    
        expect(db.run).toHaveBeenCalledWith(
            expect.any(String),
            expect.any(Array),
            expect.any(Function)
        );

        mockDBGet.mockRestore();
        mockDBRun.mockRestore();
    });

    test("should reject when product does not exist", async () => {
        jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(null, null);
            return {} as Database;
        });

        await expect(productDAO.changeProductQuantity("nonExistentModel", 5, "2024-06-01"))
            .rejects.toThrow(ProductNotFoundError);

        expect(db.get).toHaveBeenCalledWith(
            expect.any(String),
            expect.any(Array),
            expect.any(Function)
        );
    });

    test("should handle database errors", async () => {
        jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(new Error("Database error"), null);
            return {} as Database;
        });

        await expect(productDAO.changeProductQuantity("Model1", 5, "2024-06-01"))
            .rejects.toThrow("Database error");
    });

    test("should handle errors during the update", async () => {
        jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(null, { quantity: 10 });
            return {} as Database;
        });

        const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback(new Error("Update error"));
            return {} as Database;
        });

        await expect(productDAO.changeProductQuantity("Model1", 5, "2024-06-01"))
            .rejects.toThrow("Update error");

        mockDBRun.mockRestore();
    });

    test("should handle unexpected errors", async () => {
        jest.spyOn(db, "get").mockImplementation(() => {
            throw new Error("Unexpected error");
        });

        await expect(productDAO.changeProductQuantity("Model1", 5, "2024-06-01"))
            .rejects.toThrow("Unexpected error");
    });

    //TEST sellProduct

    test("It should decrease the quantity when product exists", async () => {
        jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(null, { quantity: 10 });
            return {} as Database;
        });

        const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback(null);
            return {} as Database;
        });

        await expect(productDAO.sellProduct("Model1", 3, "2024-06-01"))
            .resolves.toBe(7);

        expect(db.get).toHaveBeenCalledWith(
            'SELECT quantity FROM products WHERE model = ?', ['Model1'], expect.any(Function)
        );

        expect(db.run).toHaveBeenCalledWith(
            'UPDATE products SET quantity = quantity - ? WHERE model = ?',
            [3, "Model1"],
            expect.any(Function)
        );

        mockDBRun.mockRestore();
    });

    test("should reject when product does not exist", async () => {
        jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(null, null);
            return {} as Database;
        });

        await expect(productDAO.sellProduct("nonExistentModel", 3, "2024-06-01"))
            .rejects.toThrow(ProductNotFoundError);

        expect(db.get).toHaveBeenCalledWith(
            'SELECT quantity FROM products WHERE model = ?', ['nonExistentModel'], expect.any(Function)
        );
    });

    test("should handle database errors", async () => {
        jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(new Error("Database error"), null);
            return {} as Database;
        });

        await expect(productDAO.sellProduct("Model1", 3, "2024-06-01"))
            .rejects.toThrow("Database error");
    });

    test("should handle errors during the update", async () => {
        jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(null, { quantity: 10 });
            return {} as Database;
        });

        const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback(new Error("Update error"));
            return {} as Database;
        });

        await expect(productDAO.sellProduct("Model1", 3, "2024-06-01"))
            .rejects.toThrow("Update error");

        mockDBRun.mockRestore();
    });

    test("should handle insufficient quantity", async () => {
        jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(null, { quantity: 2 });
            return {} as Database;
        });

        await expect(productDAO.sellProduct("Model1", 3, "2024-06-01"))
            .rejects.toThrow(LowProductStockError);

        expect(db.get).toHaveBeenCalledWith(
            'SELECT quantity FROM products WHERE model = ?', ['Model1'], expect.any(Function)
        );
    });

    test("should handle unexpected errors", async () => {
        jest.spyOn(db, "get").mockImplementation(() => {
            throw new Error("Unexpected error");
        });

        await expect(productDAO.sellProduct("Model1", 3, "2024-06-01"))
            .rejects.toThrow("Unexpected error");
    });

    //TEST getAllProducts

    test("should return a list of products", async () => {
        const mockProducts = [
            { sellingPrice: 100, model: "Model1", category: Category.APPLIANCE, arrivalDate: dayjs().format('YYYY-MM-DD'), details: "Details1", quantity: 10 },
            { sellingPrice: 200, model: "Model2", category: Category.APPLIANCE, arrivalDate: dayjs().format('YYYY-MM-DD'), details: "Details2", quantity: 20 }
         ];

        jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
            callback(null, mockProducts);
            return {} as Database;
        });

        const products = await productDAO.getAllProducts();

        expect(products).toHaveLength(2);
        expect(products[0]).toBeInstanceOf(Product);
        expect(products[1]).toBeInstanceOf(Product);
        expect(products[0]).toEqual(expect.objectContaining(mockProducts[0]));
        expect(products[1]).toEqual(expect.objectContaining(mockProducts[1]));
    });

    test("should handle database errors", async () => {
        jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
            callback(new Error("Database error"), []);
            return {} as Database;
        });

        await expect(productDAO.getAllProducts()).rejects.toThrow("Database error");
    });

    test("should handle unexpected errors", async () => {
        jest.spyOn(db, "all").mockImplementation(() => {
            throw new Error("Unexpected error");
        });

        await expect(productDAO.getAllProducts()).rejects.toThrow("Unexpected error");
    });

    //TEST getProductByCategory

    test("should return a list of product selected by category", async () => {
        const mockProducts = [
            { sellingPrice: 100, model: "Model1", category: Category.APPLIANCE, arrivalDate: dayjs().format('YYYY-MM-DD'), details: "Details1", quantity: 10 },
            { sellingPrice: 200, model: "Model2", category: Category.APPLIANCE, arrivalDate: dayjs().format('YYYY-MM-DD'), details: "Details2", quantity: 20 },
            { sellingPrice: 300, model: "Model3", category: Category.SMARTPHONE, arrivalDate: dayjs().format('YYYY-MM-DD'), details: "Details3", quantity: 30 }
        ];

        jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
            const filteredProducts = mockProducts.filter(product => product.category === params[0]);
            callback(null, filteredProducts);
            return {} as Database;
        });

        const products = await productDAO.getProductByCategory(Category.APPLIANCE);

        expect(products).toHaveLength(2);
        expect(products[0]).toBeInstanceOf(Product);
        expect(products[1]).toBeInstanceOf(Product);
        expect(products[0]).toEqual(expect.objectContaining(mockProducts[0]));
        expect(products[1]).toEqual(expect.objectContaining(mockProducts[1]));
        expect(products).toEqual([
            new Product(100, "Model1", Category.APPLIANCE, dayjs().format('YYYY-MM-DD'), "Details1", 10),
            new Product(200, "Model2", Category.APPLIANCE, dayjs().format('YYYY-MM-DD'), "Details2", 20)
        ])
    });
    
    test("should handle database errors", async () => {
        jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
            callback(new Error("Database error"), []);
            return {} as Database;
        });

        await expect(productDAO.getProductByCategory("Category1")).rejects.toThrow("Database error");
    });

    test("should handle unexpected errors", async () => {
        jest.spyOn(db, "all").mockImplementation(() => {
            throw new Error("Unexpected error");
        });

        await expect(productDAO.getProductByCategory("Category1")).rejects.toThrow("Unexpected error");
    });

    //TEST getProductByModel

    test("should return a list of product selected by model", async () => {
        const mockProducts = [
            { sellingPrice: 100, model: "Model1", category: Category.APPLIANCE, arrivalDate: dayjs().format('YYYY-MM-DD'), details: "Details1", quantity: 10 },
            { sellingPrice: 200, model: "Model2", category: Category.APPLIANCE, arrivalDate: dayjs().format('YYYY-MM-DD'), details: "Details2", quantity: 20 },
            { sellingPrice: 300, model: "Model3", category: Category.SMARTPHONE, arrivalDate: dayjs().format('YYYY-MM-DD'), details: "Details3", quantity: 30 }
        ];

        jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
            const filteredProducts = mockProducts.filter(product => product.model === params[0]);
            callback(null, filteredProducts);
            return {} as Database;
        });

        const products = await productDAO.getProductByModel("Model1");

        expect(products).toHaveLength(1);
        expect(products[0]).toBeInstanceOf(Product);
        expect(products[0]).toEqual(expect.objectContaining(mockProducts[0]));
        expect(products).toEqual([
            new Product(100, "Model1", Category.APPLIANCE, dayjs().format('YYYY-MM-DD'), "Details1", 10)
        ])
    });
    
    test("should handle database errors", async () => {
        jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
            callback(new Error("Database error"), []);
            return {} as Database;
        });

        await expect(productDAO.getProductByModel("Model1")).rejects.toThrow("Database error");
    });

    test("should handle unexpected errors", async () => {
        jest.spyOn(db, "all").mockImplementation(() => {
            throw new Error("Unexpected error");
        });

        await expect(productDAO.getProductByModel("Model1")).rejects.toThrow("Unexpected error");
    });

    //TEST getAvailableProducts

    test("should return a list of available products", async () => {
        const mockProducts = [
            { sellingPrice: 100, model: "Model1", category: Category.APPLIANCE, arrivalDate: dayjs().format('YYYY-MM-DD'), details: "Details1", quantity: 10 },
            { sellingPrice: 200, model: "Model2", category: Category.APPLIANCE, arrivalDate: dayjs().format('YYYY-MM-DD'), details: "Details2", quantity: 20 },
            { sellingPrice: 300, model: "Model3", category: Category.SMARTPHONE, arrivalDate: dayjs().format('YYYY-MM-DD'), details: "Details3", quantity: 0 } //Questo prodotto non dovrebbe essere incluso
        ];

        jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
            const availableProducts = mockProducts.filter(product => product.quantity > 0);
            callback(null, availableProducts);
            return {} as Database;
        });

        const products = await productDAO.getAvailableProducts(null, null, null);

        expect(products).toHaveLength(2);
        expect(products[0]).toBeInstanceOf(Product);
        expect(products[1]).toBeInstanceOf(Product);
        expect(products[0]).toEqual(expect.objectContaining(mockProducts[0]));
        expect(products[1]).toEqual(expect.objectContaining(mockProducts[1]));
        expect(products).toEqual([
            new Product(100, "Model1", Category.APPLIANCE, dayjs().format('YYYY-MM-DD'), "Details1", 10),
            new Product(200, "Model2", Category.APPLIANCE, dayjs().format('YYYY-MM-DD'), "Details2", 20)
        ]);
    });

    test("should handle database errors", async () => {
        jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
            callback(new Error("Database error"), []);
            return {} as Database;
        });

        await expect(productDAO.getAvailableProducts(null, null, null)).rejects.toThrow("Database error");
    });

    test("should handle unexpected errors", async () => {
        jest.spyOn(db, "all").mockImplementation(() => {
            throw new Error("Unexpected error");
        });

        await expect(productDAO.getAvailableProducts(null, null, null)).rejects.toThrow("Unexpected error");
    });

    //TEST getAvailableProductsByCategory

    test("should return a list of available products", async () => {
        const mockProducts = [
            { sellingPrice: 100, model: "Model1", category: Category.APPLIANCE, arrivalDate: dayjs().format('YYYY-MM-DD'), details: "Details1", quantity: 10 },
            { sellingPrice: 200, model: "Model2", category: Category.APPLIANCE, arrivalDate: dayjs().format('YYYY-MM-DD'), details: "Details2", quantity: 20 },
            { sellingPrice: 300, model: "Model3", category: Category.SMARTPHONE, arrivalDate: dayjs().format('YYYY-MM-DD'), details: "Details3", quantity: 0 } //Questo prodotto non dovrebbe essere incluso
        ];

        jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
            const availableProducts = mockProducts.filter(product => product.quantity > 0);
            callback(null, availableProducts);
            return {} as Database;
        });

        const products = await productDAO.getAvailableProductByCategory("category", Category.APPLIANCE, null);

        expect(products).toHaveLength(2);
        expect(products[0]).toBeInstanceOf(Product);
        expect(products[1]).toBeInstanceOf(Product);
        expect(products[0]).toEqual(expect.objectContaining(mockProducts[0]));
        expect(products[1]).toEqual(expect.objectContaining(mockProducts[1]));
        expect(products).toEqual([
            new Product(100, "Model1", Category.APPLIANCE, dayjs().format('YYYY-MM-DD'), "Details1", 10),
            new Product(200, "Model2", Category.APPLIANCE, dayjs().format('YYYY-MM-DD'), "Details2", 20)
        ]);
    });

    test("should handle database errors", async () => {
        jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
            callback(new Error("Database error"), []);
            return {} as Database;
        });

        await expect(productDAO.getAvailableProductByCategory("category", Category.APPLIANCE, null)).rejects.toThrow("Database error");
    });

    test("should handle unexpected errors", async () => {
        jest.spyOn(db, "all").mockImplementation(() => {
            throw new Error("Unexpected error");
        });

        await expect(productDAO.getAvailableProductByCategory("category", Category.APPLIANCE, null)).rejects.toThrow("Unexpected error");
    });

    //TEST getAvailableProductsByModel

    test("should return a list of available products by model", async () => {
        const mockProducts = [
            { sellingPrice: 100, model: "Model1", category: Category.APPLIANCE, arrivalDate: dayjs().format('YYYY-MM-DD'), details: "Details1", quantity: 10 },
            { sellingPrice: 200, model: "Model2", category: Category.APPLIANCE, arrivalDate: dayjs().format('YYYY-MM-DD'), details: "Details2", quantity: 20 },
            { sellingPrice: 300, model: "Model1", category: Category.SMARTPHONE, arrivalDate: dayjs().format('YYYY-MM-DD'), details: "Details3", quantity: 0 } //Questo prodotto non dovrebbe essere incluso
        ];

        jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
            const availableProducts = mockProducts.filter(product => product.model === params[0] && product.quantity > 0);
            callback(null, availableProducts);
            return {} as Database;
        });

        const products = await productDAO.getAvailableProductByModel("model", null, "Model1");

        expect(products).toHaveLength(1);
        expect(products[0]).toBeInstanceOf(Product);
        expect(products[0]).toEqual(expect.objectContaining(mockProducts[0]));
        expect(products).toEqual([
            new Product(100, "Model1", Category.APPLIANCE, dayjs().format('YYYY-MM-DD'), "Details1", 10)
        ]);
    });

    test("should handle empty product stock", async () => {
        jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
            callback(null, []); // Simulate empty result set
            return {} as Database;
        });

        const products = await productDAO.getAvailableProductByModel("model", null, "Model1");

        expect(products).toEqual([]);
    });

    test("should handle database errors", async () => {
        jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
            callback(new Error("Database error"), []);
            return {} as Database;
        });

        await expect(productDAO.getAvailableProductByModel("model", null, "Model1")).rejects.toThrow("Database error");
    });

    test("should handle unexpected errors", async () => {
        jest.spyOn(db, "all").mockImplementation(() => {
            throw new Error("Unexpected error");
        });

        await expect(productDAO.getAvailableProductByModel("model", null, "Model1")).rejects.toThrow("Unexpected error");
    });

    //TEST deleteAllProducts

    test("Should delete all products succefully" , async () => {
        jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback(null); // Simulate successful execution
            return {} as Database;
        });

        const result = await productDAO.deleteAllProducts();
        expect(result).toBe(true);
    });

    test("should handle database errors", async () => {
        jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback(new Error("Database error")); // Simulate database error
            return {} as Database;
        });

        await expect(productDAO.deleteAllProducts()).rejects.toThrow("Database error");
    });

    test("should handle unexpected errors", async () => {
        jest.spyOn(db, "run").mockImplementation(() => {
            throw new Error("Unexpected error"); // Simulate unexpected error
        });

        await expect(productDAO.deleteAllProducts()).rejects.toThrow("Unexpected error");
    });

    //TEST deleteUser

    test("should delete a product successfully", async () => {
        jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback(null); // Simulate successful execution
            return {} as Database;
        });

        const result = await productDAO.deleteProduct("Model1");
        expect(result).toBe(true);
    });

    test("should handle database errors", async () => {
        jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback(new Error("Database error")); // Simulate database error
            return {} as Database;
        });

        await expect(productDAO.deleteProduct("Model1")).rejects.toThrow("Database error");
    });

    test("should handle unexpected errors", async () => {
        jest.spyOn(db, "run").mockImplementation(() => {
            throw new Error("Unexpected error"); // Simulate unexpected error
        });

        await expect(productDAO.deleteProduct("Model1")).rejects.toThrow("Unexpected error");
    });