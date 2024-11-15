import { Category, Product } from "../../src/components/product";
import ProductController from "../../src/controllers/productController";
import ProductDAO from "../../src/dao/productDAO";
import { test, expect, jest } from "@jest/globals";
import dayjs from "dayjs";
import { beforeEach, describe, it } from "node:test";

// Simular el comportamiento del DAO
jest.mock("../../src/dao/productDAO");

//test registerProducts
test("It should return nothing", async () => {
    const testProduct = { //Define a test user object
        sellingPrice: 120,
        model: "test",
        category: Category.APPLIANCE,
        arrivalDate: "test",
        details: "test",
        quantity: 3
    }
    jest.spyOn(ProductDAO.prototype, "registerProducts").mockResolvedValueOnce();
    const controller = new ProductController();

    const response = await controller.registerProducts(testProduct.model, testProduct.category, testProduct.quantity, testProduct.details, testProduct.sellingPrice, testProduct.arrivalDate);

    //Check if the createUser method of the DAO has been called once with the correct parameters
    expect(ProductDAO.prototype.registerProducts).toHaveBeenCalledTimes(1);
    expect(ProductDAO.prototype.registerProducts).toHaveBeenCalledWith(
        testProduct.model,
        testProduct.category,
        testProduct.quantity,
        testProduct.details,        
        testProduct.sellingPrice,
        testProduct.arrivalDate,
    );
});

//test changeProductQuantity
test("It should return the product quantity and return the updated quantity", async () => {
    const model = "test";
    const newQuantity = 5;
    const changeDate = dayjs().format('YYYY-MM-DD');
    const initialQuantity = 10;
    const expectedUpdatedQuantity = initialQuantity + newQuantity;

    jest.spyOn(ProductDAO.prototype, "changeProductQuantity").mockResolvedValueOnce(expectedUpdatedQuantity);
    jest.spyOn(ProductDAO.prototype, "getProductByModel").mockResolvedValueOnce([{
        arrivalDate: dayjs().format('YYYY-MM-DD'),
        sellingPrice: 0,
        model: "",
        category: Category.SMARTPHONE,
        details: null,
        quantity: 0
    }]);
    const controller = new ProductController();
    const response = await controller.changeProductQuantity(model, newQuantity, changeDate);

    // Verifica che il metodo changeProductQuantity sia stato chiamato
    // Verifica che il metodo changeProductQuantity sia stato chiamato
    expect(ProductDAO.prototype.changeProductQuantity).toHaveBeenCalledTimes(1);
    // Verifica che changeProductQuantity sia stato chiamato con i parametri corretti
    expect(ProductDAO.prototype.changeProductQuantity).toHaveBeenCalledWith(model, newQuantity, changeDate);
    // Verifica che la risposta sia quella attesa
    expect(response).toEqual(expectedUpdatedQuantity);
});

//test sellProduct
test("It should return the product quantity and return the updated quantity", async () => {
    const model = "test";
    const sellQuantity = 2;
    const sellingDate = dayjs().format('YYYY-MM-DD');
    const initialQuantity = 10;
    const expectedUpdatedQuantity = initialQuantity - sellQuantity;

    jest.spyOn(ProductDAO.prototype, "sellProduct").mockResolvedValueOnce(expectedUpdatedQuantity);
    jest.spyOn(ProductDAO.prototype, "getProductByModel").mockResolvedValueOnce([{
        arrivalDate: dayjs().format('YYYY-MM-DD'),
        sellingPrice: 0,
        model: "",
        category: Category.SMARTPHONE,
        details: null,
        quantity: 0
    }]);
    const controller = new ProductController();
    const response = await controller.sellProduct(model, sellQuantity, sellingDate);

    // Verifica che il metodo sellProduct sia stato chiamato
    expect(ProductDAO.prototype.sellProduct).toHaveBeenCalledTimes(1);
    // Verifica che sellProduct sia stato chiamato con i parametri corretti
    expect(ProductDAO.prototype.sellProduct).toHaveBeenCalledWith(model, sellQuantity, sellingDate);
    // Verifica che la risposta sia quella attesa
    expect(response).toEqual(expectedUpdatedQuantity);
});

//test getAllProducts
test("It should return a list of products", async () => {
    const testProducts = [
        new Product(120, "Model1", Category.APPLIANCE, dayjs().format('YYYY-MM-DD'), "dettagli", 3),
        new Product(120, "Model2", Category.APPLIANCE, dayjs().format('YYYY-MM-DD'), "dettagli", 3)
    ];

    jest.spyOn(ProductDAO.prototype, "getAllProducts").mockResolvedValueOnce(testProducts);
    const controller = new ProductController();
    const response = await controller.getProducts(null, null, null);

    expect(ProductDAO.prototype.getAllProducts).toHaveBeenCalledTimes(1);
    expect(response).toEqual(testProducts);
});

//test getProductByCategory
test("It should return a list of products by a specific category", async () => {
    const category = Category.APPLIANCE
    const testProducts = [
        new Product(120, "Model1", category, dayjs().format('YYYY-MM-DD'), "dettagli", 3),
        new Product(120, "Model2", category, dayjs().format('YYYY-MM-DD'), "dettagli", 3)
    ];
    
    jest.spyOn(ProductDAO.prototype, "getProductByCategory").mockResolvedValueOnce(testProducts);
    const controller = new ProductController();
    const response = await controller.getProducts("category", category, null);

    expect(ProductDAO.prototype.getProductByCategory).toHaveBeenCalledTimes(1);
    expect(ProductDAO.prototype.getProductByCategory).toHaveBeenCalledWith(category);
    expect(response).toEqual(testProducts);
});

//test getProductByModel
test("It should return a list of products by a specific model", async () => {
    const category = Category.APPLIANCE
    const testProducts = [
        new Product(120, "Model1", category, dayjs().format('YYYY-MM-DD'), "dettagli", 3)
    ];
    
    jest.spyOn(ProductDAO.prototype, "getProductByModel").mockResolvedValueOnce(testProducts);
    const controller = new ProductController();
    const response = await controller.getProducts("model", null, "Model1");

    expect(ProductDAO.prototype.getProductByModel).toHaveBeenCalledWith("Model1");
    expect(response).toEqual(testProducts);
});

//test getAvailableProducts
test("It should return a list of available products (quantity > 0) without grouping", async () => {
    const testProducts = [
        new Product(120, "Model1", Category.APPLIANCE, dayjs().format('YYYY-MM-DD'), "details", 3),
        new Product(121, "Model2", Category.APPLIANCE, dayjs().format('YYYY-MM-DD'), "details", 0), // Not available
        new Product(122, "Model3", Category.APPLIANCE, dayjs().format('YYYY-MM-DD'), "details", 5)
    ];
    
    const expectedAvailableProducts = testProducts.filter(product => product.quantity > 0);
    
    jest.spyOn(ProductDAO.prototype, "getAvailableProducts").mockResolvedValueOnce(expectedAvailableProducts);
    const controller = new ProductController();
    const response = await controller.getAvailableProducts(null, null, null);

    // Verifica che il metodo getAvailableProducts del DAO sia stato chiamato
    expect(ProductDAO.prototype.getAvailableProducts).toHaveBeenCalledTimes(1);
    // Verifica che getAvailableProducts sia stato chiamato con i parametri corretti
    expect(ProductDAO.prototype.getAvailableProducts).toHaveBeenCalledWith(null, null, null);
    // Verifica che la risposta sia quella attesa (solo prodotti con quantità > 0)
    expect(response).toEqual(expectedAvailableProducts);
});

//getAvailableProductsByCategory
test("It should return a list of available products (quantity > 0) grouped by category", async () => {
    const testProducts = [
        new Product(120, "Model1", Category.APPLIANCE, dayjs().format('YYYY-MM-DD'), "details", 3),
        new Product(121, "Model2", Category.APPLIANCE, dayjs().format('YYYY-MM-DD'), "details", 0), // Not available
        new Product(122, "Model3", Category.APPLIANCE, dayjs().format('YYYY-MM-DD'), "details", 5)
    ];
    
    const expectedAvailableProducts = testProducts.filter(product => product.quantity > 0);
    
    jest.spyOn(ProductDAO.prototype, "getAvailableProductByCategory").mockResolvedValueOnce(expectedAvailableProducts);
    const controller = new ProductController();
    const response = await controller.getAvailableProducts("category", Category.APPLIANCE, null);

    // Verifica che il metodo getAvailableProductByCategory del DAO sia stato chiamato
    expect(ProductDAO.prototype.getAvailableProductByCategory).toHaveBeenCalledTimes(1);
    // Verifica che getAvailableProductByCategory sia stato chiamato con i parametri corretti
    expect(ProductDAO.prototype.getAvailableProductByCategory).toHaveBeenCalledWith("category", Category.APPLIANCE, null);
    // Verifica che la risposta sia quella attesa (solo prodotti con quantità > 0)
    expect(response).toEqual(expectedAvailableProducts);
});

//getAvailableProductsByModel
test("It should return a list of available products (quantity > 0) grouped by model", async () => {
    const testProducts = [
        new Product(120, "Model1", Category.APPLIANCE, dayjs().format('YYYY-MM-DD'), "details", 3),
        new Product(121, "Model2", Category.APPLIANCE, dayjs().format('YYYY-MM-DD'), "details", 0), // Not available
        new Product(122, "Model3", Category.APPLIANCE, dayjs().format('YYYY-MM-DD'), "details", 5)
    ];
    
    const expectedAvailableProducts = testProducts.filter(product => product.quantity > 0);
    
    jest.spyOn(ProductDAO.prototype, "getAvailableProductByModel").mockResolvedValueOnce(expectedAvailableProducts);
    const controller = new ProductController();
    const response = await controller.getAvailableProducts("model", null, "Model1");

    // Verifica che il metodo getAvailableProductByModel del DAO sia stato chiamato
    expect(ProductDAO.prototype.getAvailableProductByModel).toHaveBeenCalledTimes(1);
    // Verifica che getAvailableProductByModel sia stato chiamato con i parametri corretti
    expect(ProductDAO.prototype.getAvailableProductByModel).toHaveBeenCalledWith("model", null, "Model1");
    // Verifica che la risposta sia quella attesa (solo prodotti con quantità > 0)
    expect(response).toEqual(expectedAvailableProducts);
});

//deleteAllProducts
test("It should delete all products and return true", async () => {
    // Mock del DAO per simulare il comportamento di deleteAllProducts
    jest.spyOn(ProductDAO.prototype, "deleteAllProducts").mockResolvedValueOnce(true);

    const controller = new ProductController();
    const response = await controller.deleteAllProducts();

    // Verifica che il metodo deleteAllProducts del DAO sia stato chiamato
    expect(ProductDAO.prototype.deleteAllProducts).toHaveBeenCalledTimes(1);
    // Verifica che la risposta sia true
    expect(response).toBe(true);
});

//deleteProduct
test("It should delete a product by model and return true", async () => {
    const modelToDelete = "Model1";

    // Mock del DAO per simulare il comportamento di deleteProduct
    jest.spyOn(ProductDAO.prototype, "deleteProduct").mockResolvedValueOnce(true);

    const controller = new ProductController();
    const response = await controller.deleteProduct(modelToDelete);

    // Verifica che il metodo deleteProduct del DAO sia stato chiamato
    expect(ProductDAO.prototype.deleteProduct).toHaveBeenCalledTimes(1);
    // Verifica che deleteProduct sia stato chiamato con il parametro corretto
    expect(ProductDAO.prototype.deleteProduct).toHaveBeenCalledWith(modelToDelete);
    // Verifica che la risposta sia true
    expect(response).toBe(true);
});
