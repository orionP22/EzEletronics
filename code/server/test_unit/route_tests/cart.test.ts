import { test, expect, jest } from "@jest/globals";
import request from "supertest";
import { app } from "../../index";
import Authenticator from "../../src/routers/auth";
import CartController from "../../src/controllers/cartController";
import { Category } from "../../src/components/product";

const baseURL = "/ezelectronics";
const customerUser = request.agent(app);

jest.mock("../../src/routers/auth");
jest.mock("../../src/controllers/cartController");

const mockCart = {
    customer: "testUser",
    paid: false,
    paymentDate: "",
    total: 100,
    products: [{ model: "product1", quantity: 1, category: Category.APPLIANCE, price: 5}],
};

const mockUser = {
    username: "testUser",
    name: "Test",
    surname: "User",
    role: "Customer",
    address: "Test Address",
    birthdate: "2000-01-01",
};

// Test for GET /carts route
test("GET /carts should return a 200 success code and the user's cart", async () => {
    jest.spyOn(CartController.prototype, "getCart").mockResolvedValueOnce(mockCart);

    jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => {
        req.user = mockUser;
        return next();
    });

    jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
        req.user = mockUser;
        return next();
    });

    const response = await customerUser.get(baseURL + "/carts");

    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockCart);
    expect(CartController.prototype.getCart).toHaveBeenCalledTimes(1);
    expect(CartController.prototype.getCart).toHaveBeenCalledWith(mockUser);
});

// Test for POST /carts route
test("POST /carts should return a 200 success code on adding a product to the cart", async () => {
    jest.spyOn(CartController.prototype, "addToCart").mockResolvedValueOnce(true);

    jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => {
        req.user = mockUser;
        return next();
    });

    jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
        req.user = mockUser;
        return next();
    });

    const response = await customerUser.post(baseURL + "/carts").send({ model: "product1" });

    expect(response.status).toBe(200);
    expect(CartController.prototype.addToCart).toHaveBeenCalledTimes(1);
    expect(CartController.prototype.addToCart).toHaveBeenCalledWith(mockUser, "product1");
});

// Test for PATCH /carts route
test("PATCH /carts should return a 200 success code on checking out the cart", async () => {
    jest.spyOn(CartController.prototype, "checkoutCart").mockResolvedValueOnce(true);

    jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => {
        req.user = mockUser;
        return next();
    });

    jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
        req.user = mockUser;
        return next();
    });

    const response = await customerUser.patch(baseURL + "/carts");

    expect(response.status).toBe(200);
    expect(CartController.prototype.checkoutCart).toHaveBeenCalledTimes(1);
    expect(CartController.prototype.checkoutCart).toHaveBeenCalledWith(mockUser);
});

// Test for GET /carts/history route
test("GET /carts/history should return a 200 success code and the cart history", async () => {
    const mockCartHistory = [mockCart];

    jest.spyOn(CartController.prototype, "getCustomerCarts").mockResolvedValueOnce(mockCartHistory);

    jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => {
        req.user = mockUser;
        return next();
    });

    jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
        req.user = mockUser;
        return next();
    });

    const response = await customerUser.get(baseURL + "/carts/history");

    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockCartHistory);
    expect(CartController.prototype.getCustomerCarts).toHaveBeenCalledTimes(1);
    expect(CartController.prototype.getCustomerCarts).toHaveBeenCalledWith(mockUser);
});

// Test for DELETE /carts/products/:model route
test("DELETE /carts/products/:model should return a 200 success code on removing a product", async () => {
    jest.spyOn(CartController.prototype, "removeProductFromCart").mockResolvedValueOnce(true);

    jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => {
        req.user = mockUser;
        return next();
    });

    jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
        req.user = mockUser;
        return next();
    });

    const response = await customerUser.delete(baseURL + "/carts/products/product1");

    expect(response.status).toBe(200);
    expect(CartController.prototype.removeProductFromCart).toHaveBeenCalledTimes(1);
    expect(CartController.prototype.removeProductFromCart).toHaveBeenCalledWith(mockUser, "product1");
});

// Test for DELETE /carts/current route
test("DELETE /carts/current should return a 200 success code on clearing the cart", async () => {
    jest.spyOn(CartController.prototype, "clearCart").mockResolvedValueOnce(true);

    jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => {
        req.user = mockUser;
        return next();
    });

    jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
        req.user = mockUser;
        return next();
    });

    const response = await customerUser.delete(baseURL + "/carts/current");

    expect(response.status).toBe(200);
    expect(CartController.prototype.clearCart).toHaveBeenCalledTimes(1);
    expect(CartController.prototype.clearCart).toHaveBeenCalledWith(mockUser);
});

// Test for DELETE /carts route
test("DELETE /carts should return a 200 success code on deleting all carts", async () => {
    jest.spyOn(CartController.prototype, "deleteAllCarts").mockResolvedValueOnce(true);

    jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
        req.user = mockUser;
        return next();
    });

    jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
        req.user = mockUser;
        return next();
    });

    const response = await customerUser.delete(baseURL + "/carts");

    expect(response.status).toBe(200);
    expect(CartController.prototype.deleteAllCarts).toHaveBeenCalledTimes(1);
    expect(CartController.prototype.deleteAllCarts).toHaveBeenCalledWith();
});

// Test for GET /carts/all route
test("GET /carts/all should return a 200 success code and all carts", async () => {
    const mockAllCarts = [mockCart, { ...mockCart, customer: "testUser2" }];

    jest.spyOn(CartController.prototype, "getAllCarts").mockResolvedValueOnce(mockAllCarts);

    jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
        req.user = mockUser;
        return next();
    });

    jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
        req.user = mockUser;
        return next();
    });

    const response = await customerUser.get(baseURL + "/carts/all");

    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockAllCarts);
    expect(CartController.prototype.getAllCarts).toHaveBeenCalledTimes(1);
    expect(CartController.prototype.getAllCarts).toHaveBeenCalledWith();
});
