import { test, expect, jest } from "@jest/globals";
import request from "supertest";
import { app } from "../../index";
import Authenticator from "../../src/routers/auth";
import ProductController from "../../src/controllers/productController";
import { Category } from "../../src/components/product";

const baseURL = "/ezelectronics/products";
const adminUser = request.agent(app);

jest.mock("../../src/routers/auth");
jest.mock("../../src/controllers/productController");

const mockProduct = {
    sellingPrice: 100,
    model: "testProduct",
    category: Category.APPLIANCE,
    arrivalDate: "2024-01-01",
    details: "Test product details",
    quantity: 10
};

const mockProduct2 = {
    sellingPrice: 102,
    model: "testProduct2",
    category: Category.LAPTOP,
    arrivalDate: "2024-01-02",
    details: "Test product details2",
    quantity: 11
};


const mockAdminUser = {
    username: "adminUser",
    name: "Admin",
    surname: "User",
    role: "Admin",
    address: "Admin Address",
    birthdate: "1980-01-01",
};

const mockManagerUser = {
    ...mockAdminUser,
    role: "Manager"
};

// Test for POST / route
test("POST / should return a 200 success code on registering product arrival", async () => {
    jest.spyOn(ProductController.prototype, "registerProducts").mockResolvedValueOnce();

    jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
        req.user = mockAdminUser;
        return next();
    });

    jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
        req.user = mockAdminUser;
        return next();
    });

    const response = await adminUser.post(baseURL).send({
        model: "testProduct",
        category: "Smartphone",
        quantity: 10,
        details: "Test product details",
        sellingPrice: 100,
        arrivalDate: "2024-01-01"
    });

    expect(response.status).toBe(200);
    expect(ProductController.prototype.registerProducts).toHaveBeenCalledTimes(1);
    expect(ProductController.prototype.registerProducts).toHaveBeenCalledWith("testProduct", "Smartphone", 10, "Test product details", 100, "2024-01-01");
});

// Test for PATCH /:model route
test("PATCH /:model should return a 200 success code on updating product quantity", async () => {
    jest.spyOn(ProductController.prototype, "changeProductQuantity").mockResolvedValueOnce(20);

    jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
        req.user = mockAdminUser;
        return next();
    });

    jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
        req.user = mockAdminUser;
        return next();
    });

    const response = await adminUser.patch(baseURL + "/testProduct").send({
        quantity: 10,
        changeDate: "2024-01-02"
    });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ quantity: 20 });
    expect(ProductController.prototype.changeProductQuantity).toHaveBeenCalledTimes(1);
    expect(ProductController.prototype.changeProductQuantity).toHaveBeenCalledWith("testProduct", 10, "2024-01-02");
});

// Test for PATCH /:model/sell route
test("PATCH /:model/sell should return a 200 success code on selling product", async () => {
    jest.spyOn(ProductController.prototype, "sellProduct").mockResolvedValueOnce(5);

    jest.spyOn(Authenticator.prototype, "isManager").mockImplementation((req, res, next) => {
        req.user = mockManagerUser;
        return next();
    });

    jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
        req.user = mockManagerUser;
        return next();
    });

    const response = await adminUser.patch(baseURL + "/testProduct/sell").send({
        quantity: 5,
        sellingDate: "2024-01-03"
    });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ quantity: 5 });
    expect(ProductController.prototype.sellProduct).toHaveBeenCalledTimes(1);
    expect(ProductController.prototype.sellProduct).toHaveBeenCalledWith("testProduct", 5, "2024-01-03");
});

// Test for GET / route
test("GET / should return a 200 success code and all products", async () => {
    const mockProducts = [mockProduct];

    jest.spyOn(ProductController.prototype, "getProducts").mockResolvedValueOnce(mockProducts);

    jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
        req.user = mockAdminUser;
        return next();
    });

    jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
        req.user = mockAdminUser;
        return next();
    });

    const response = await adminUser.get(baseURL);

    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockProducts);
    expect(ProductController.prototype.getProducts).toHaveBeenCalledTimes(1);
    expect(ProductController.prototype.getProducts).toHaveBeenCalledWith(undefined, undefined, undefined);
});

// Test for GET /available route
test("GET /available should return a 200 success code and all available products", async () => {
    const mockProducts = [mockProduct];

    jest.spyOn(ProductController.prototype, "getAvailableProducts").mockResolvedValueOnce(mockProducts);

    jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
        req.user = mockAdminUser;
        return next();
    });

    const response = await adminUser.get(baseURL + "/available");

    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockProducts);
    expect(ProductController.prototype.getAvailableProducts).toHaveBeenCalledTimes(1);
    expect(ProductController.prototype.getAvailableProducts).toHaveBeenCalledWith(undefined, undefined, undefined);
});

// Test for DELETE / route
test("DELETE / should return a 200 success code on deleting all products", async () => {
    jest.spyOn(ProductController.prototype, "deleteAllProducts").mockResolvedValueOnce(true);

    jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
        req.user = mockAdminUser;
        return next();
    });

    jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
        req.user = mockAdminUser;
        return next();
    });

    const response = await adminUser.delete(baseURL);

    expect(response.status).toBe(200);
    expect(ProductController.prototype.deleteAllProducts).toHaveBeenCalledTimes(1);
    expect(ProductController.prototype.deleteAllProducts).toHaveBeenCalledWith();
});

// Test for DELETE /:model route
test("DELETE /:model should return a 200 success code on deleting a product", async () => {
    jest.spyOn(ProductController.prototype, "deleteProduct").mockResolvedValueOnce(true);

    jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
        req.user = mockAdminUser;
        return next();
    });

    jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
        req.user = mockAdminUser;
        return next();
    });

    const response = await adminUser.delete(baseURL + "/testProduct");

    expect(response.status).toBe(200);
    expect(ProductController.prototype.deleteProduct).toHaveBeenCalledTimes(1);
    expect(ProductController.prototype.deleteProduct).toHaveBeenCalledWith("testProduct");
});
