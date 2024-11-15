import { test, expect, jest } from "@jest/globals";
import CartController from "../../src/controllers/cartController";
import CartDAO from "../../src/dao/cartDAO";
import { User, Role } from "../../src/components/user";
import { Cart, ProductInCart } from "../../src/components/cart";
import { Category } from "../../src/components/product";
import { UserNotCustomerError  } from "../../src/errors/userError";
import { CartNotFoundError, EmptyCartError, ProductNotInCartError} from "../../src/errors/cartError";
import { EmptyProductStockError, LowProductStockError, ProductNotFoundError} from "../../src/errors/productError";

jest.mock("../../src/dao/cartDAO");

test("It should add product to cart for customer and return true", async () => {
    const testUser: User = {
        username: "customerTest",
        name: "Test",
        surname: "User",
        role: Role.CUSTOMER,
        address: "test",
        birthdate: "test"
    };
    const testProduct = "testProductId";

    jest.spyOn(CartDAO.prototype, "addToCart").mockResolvedValueOnce(true);
    const controller = new CartController();
    
    const response = await controller.addToCart(testUser, testProduct);

    expect(CartDAO.prototype.addToCart).toHaveBeenCalledTimes(1);
    expect(CartDAO.prototype.addToCart).toHaveBeenCalledWith(testUser, testProduct);
    expect(response).toBe(true);
});

test("It should return UserNotCustomerError for non-customer role", async () => {
    const testUser: User = {
        username: "nonCustomerTest",
        name: "Test",
        surname: "User",
        role: Role.MANAGER,
        address: "test",
        birthdate: "test"
    };
    const testProduct = "testProductId";

    const controller = new CartController();

    const response = await controller.addToCart(testUser, testProduct);

    expect(response).toBe(UserNotCustomerError);
});

test("It should return the cart for a customer", async () => {
    const testUser: User = {
        username: "customerTest",
        name: "Test",
        surname: "User",
        role: Role.CUSTOMER,
        address: "test",
        birthdate: "test"
    };
    
    const testCart: Cart = {
        customer: "customerTest",
        paid: false,
        paymentDate: "null",
        total: 100,
        products: [
            new ProductInCart("product1", 1, "category1" as Category, 50),
            new ProductInCart("product2", 1, "category2" as Category, 50)
        ]
    };

    jest.spyOn(CartDAO.prototype, "getCart").mockResolvedValueOnce(testCart);
    const controller = new CartController();
    
    const response = await controller.getCart(testUser);

    expect(CartDAO.prototype.getCart).toHaveBeenCalledTimes(1);
    expect(CartDAO.prototype.getCart).toHaveBeenCalledWith(testUser);
    expect(response).toEqual(testCart);
});

test("It should throw UserNotCustomerError for non-customer role", async () => {
    const testUser: User = {
        username: "nonCustomerTest",
        name: "Test",
        surname: "User",
        role: Role.ADMIN,
        address: "test",
        birthdate: "test" 
    };

    const controller = new CartController();

    await expect(controller.getCart(testUser)).rejects.toThrow(UserNotCustomerError);
});


test("It should successfully checkout the cart for a customer", async () => {
    const testUser: User = {
        username: "customerTest",
        name: "Test",
        surname: "User",
        role: Role.CUSTOMER,
        address: "test",
        birthdate: "test"
    };

    jest.spyOn(CartDAO.prototype, "checkoutCart").mockResolvedValueOnce(true);
    const controller = new CartController();

    const response = await controller.checkoutCart(testUser);

    expect(CartDAO.prototype.checkoutCart).toHaveBeenCalledTimes(1);
    expect(CartDAO.prototype.checkoutCart).toHaveBeenCalledWith(testUser);
    expect(response).toBe(true);
});

test("It should throw UserNotCustomerError for non-customer role", async () => {
    const testUser: User = {
        username: "nonCustomerTest",
        name: "Test",
        surname: "User",
        role: Role.MANAGER,
        address: "test",
        birthdate: "test"
    };

    const controller = new CartController();

    
    const response = await controller.checkoutCart(testUser);

    expect(response).toBe(UserNotCustomerError);
});


test("It should throw CartNotFoundError if no current cart exists", async () => {
    const testUser: User = {
        username: "customerTest",
        name: "Test",
        surname: "User",
        role: Role.CUSTOMER,
        address: "test",
        birthdate: "test"
    };

    jest.spyOn(CartDAO.prototype, "checkoutCart").mockRejectedValueOnce(new CartNotFoundError());
    const controller = new CartController();

    await expect(controller.checkoutCart(testUser)).rejects.toThrow(CartNotFoundError);
});

test("It should throw EmptyCartError if the current cart is empty", async () => {
    const testUser: User = {
        username: "customerTest",
        name: "Test",
        surname: "User",
        role: Role.CUSTOMER,
        address: "test",
        birthdate: "test"
    };

    jest.spyOn(CartDAO.prototype, "checkoutCart").mockRejectedValueOnce(new EmptyCartError());
    const controller = new CartController();

    await expect(controller.checkoutCart(testUser)).rejects.toThrow(EmptyCartError);
});

test("It should throw EmptyProductStockError if any product in the cart is out of stock", async () => {
    const testUser: User = {
        username: "customerTest",
        name: "Test",
        surname: "User",
        role: Role.CUSTOMER,
        address: "test",
        birthdate: "test"
    };

    jest.spyOn(CartDAO.prototype, "checkoutCart").mockRejectedValueOnce(new EmptyProductStockError());
    const controller = new CartController();

    await expect(controller.checkoutCart(testUser)).rejects.toThrow(EmptyProductStockError);
});

test("It should throw LowProductStockError if any product in the cart has insufficient stock", async () => {
    const testUser: User = {
        username: "customerTest",
        name: "Test",
        surname: "User",
        role: Role.CUSTOMER,
        address: "test",
        birthdate: "test"
    };

    jest.spyOn(CartDAO.prototype, "checkoutCart").mockRejectedValueOnce(new LowProductStockError());
    const controller = new CartController();

    await expect(controller.checkoutCart(testUser)).rejects.toThrow(LowProductStockError);
});

test("It should return all paid carts for a customer", async () => {
    const testUser: User = {
        username: "customerTest",
        name: "Test",
        surname: "User",
        role: Role.CUSTOMER,
        address: "test",
        birthdate: "test"
    };

    const testCarts = [
        new Cart(
            "customerTest",
            true,
            "2023-06-01",
            150,
            [
                new ProductInCart("product1", 2, "category1" as Category, 50),
                new ProductInCart("product2", 1, "category2" as Category, 50)
            ]
        ),
        new Cart(
            "customerTest",
            true,
            "2023-06-05",
            200,
            [
                new ProductInCart("product3", 2, "category3" as Category, 100)
            ]
        )
    ];

    jest.spyOn(CartDAO.prototype, "getCustomerCarts").mockResolvedValueOnce(testCarts);
    const controller = new CartController();

    const response = await controller.getCustomerCarts(testUser);

    expect(CartDAO.prototype.getCustomerCarts).toHaveBeenCalledTimes(1);
    expect(CartDAO.prototype.getCustomerCarts).toHaveBeenCalledWith(testUser);
    expect(response).toEqual(testCarts);
});

test("It should throw UserNotCustomerError for non-customer role", async () => {
    const testUser: User = {
        username: "nonCustomerTest",
        name: "Test",
        surname: "User",
        role: Role.MANAGER,
        address: "test",
        birthdate: "test"
    };

    const controller = new CartController();
    const response = await controller.getCustomerCarts(testUser);

    expect(response).toBe(UserNotCustomerError);
});

test("It should remove a product from the cart for a customer", async () => {
    const testUser: User = {
        username: "customerTest",
        name: "Test",
        surname: "User",
        role: Role.CUSTOMER,
        address: "test",
        birthdate: "test"
    };

    const testProduct = "product1";

    jest.spyOn(CartDAO.prototype, "removeProductFromCart").mockResolvedValueOnce(true);
    const controller = new CartController();

    const response = await controller.removeProductFromCart(testUser, testProduct);

    expect(CartDAO.prototype.removeProductFromCart).toHaveBeenCalledTimes(1);
    expect(CartDAO.prototype.removeProductFromCart).toHaveBeenCalledWith(testUser, testProduct);
    expect(response).toBe(true);
});

test("It should throw UserNotCustomerError for non-customer role", async () => {
    const testUser: User = {
        username: "nonCustomerTest",
        name: "Test",
        surname: "User",
        role: Role.MANAGER,
        address: "test",
        birthdate: "test"
    };

    const testProduct = "product1";

    const controller = new CartController();
    const response = await controller.removeProductFromCart(testUser, testProduct);

    expect(response).toBe(UserNotCustomerError);
});

test("It should throw ProductNotFoundError if the product does not exist", async () => {
    const testUser: User = {
        username: "customerTest",
        name: "Test",
        surname: "User",
        role: Role.CUSTOMER,
        address: "test",
        birthdate: "test"
    };

    const testProduct = "nonExistentProduct";

    jest.spyOn(CartDAO.prototype, "removeProductFromCart").mockRejectedValueOnce(new ProductNotFoundError());
    const controller = new CartController();

    await expect(controller.removeProductFromCart(testUser, testProduct)).rejects.toThrow(ProductNotFoundError);
});

test("It should throw CartNotFoundError if the cart does not exist", async () => {
    const testUser: User = {
        username: "customerTest",
        name: "Test",
        surname: "User",
        role: Role.CUSTOMER,
        address: "test",
        birthdate: "test"
    };

    const testProduct = "product1";

    jest.spyOn(CartDAO.prototype, "removeProductFromCart").mockRejectedValueOnce(new CartNotFoundError());
    const controller = new CartController();

    await expect(controller.removeProductFromCart(testUser, testProduct)).rejects.toThrow(CartNotFoundError);
});

test("It should throw ProductNotInCartError if the product is not in the cart", async () => {
    const testUser: User = {
        username: "customerTest",
        name: "Test",
        surname: "User",
        role: Role.CUSTOMER,
        address: "test",
        birthdate: "test"
    };

    const testProduct = "productNotInCart";

    jest.spyOn(CartDAO.prototype, "removeProductFromCart").mockRejectedValueOnce(new ProductNotInCartError());
    const controller = new CartController();

    await expect(controller.removeProductFromCart(testUser, testProduct)).rejects.toThrow(ProductNotInCartError);
});

test("It should clear the cart for a customer", async () => {
    const testUser: User = {
        username: "customerTest",
        name: "Test",
        surname: "User",
        role: Role.CUSTOMER,
        address: "test",
        birthdate: "test"
    };

    jest.spyOn(CartDAO.prototype, "clearCart").mockResolvedValueOnce(true);
    const controller = new CartController();

    const response = await controller.clearCart(testUser);

    expect(CartDAO.prototype.clearCart).toHaveBeenCalledTimes(1);
    expect(CartDAO.prototype.clearCart).toHaveBeenCalledWith(testUser);
    expect(response).toBe(true);
});

test("It should throw UserNotCustomerError for non-customer role", async () => {
    const testUser: User = {
        username: "nonCustomerTest",
        name: "Test",
        surname: "User",
        role: Role.MANAGER,
        address: "test",
        birthdate: "test"
    };

    const controller = new CartController();
    const response = await controller.clearCart(testUser);

    expect(response).toBe(UserNotCustomerError);
});


test("It should throw CartNotFoundError if the cart does not exist", async () => {
    const testUser: User = {
        username: "customerTest",
        name: "Test",
        surname: "User",
        role: Role.CUSTOMER,
        address: "test",
        birthdate: "test"
    };

    jest.spyOn(CartDAO.prototype, "clearCart").mockRejectedValueOnce(new CartNotFoundError());
    const controller = new CartController();

    await expect(controller.clearCart(testUser)).rejects.toThrow(CartNotFoundError);
});

test("It should delete all carts", async () => {
    jest.spyOn(CartDAO.prototype, "deleteAllCarts").mockResolvedValueOnce(true);
    const controller = new CartController();

    const response = await controller.deleteAllCarts();

    expect(CartDAO.prototype.deleteAllCarts).toHaveBeenCalledTimes(1);
    expect(response).toBe(true);
});

test("It should handle errors when deleting all carts", async () => {
    const error = new Error("Failed to delete carts");
    jest.spyOn(CartDAO.prototype, "deleteAllCarts").mockRejectedValueOnce(error);
    const controller = new CartController();

    await expect(controller.deleteAllCarts()).rejects.toThrow(error);
});

test("It should retrieve all carts", async () => {
    const mockCarts = [
        new Cart("customer1", true, "2023-01-01", 100, [
            new ProductInCart("product1", 2, Category.APPLIANCE, 50)
        ]),
        new Cart("customer2", false, "test", 200, [
            new ProductInCart("product2", 1, Category.SMARTPHONE, 200)
        ])
    ];

    jest.spyOn(CartDAO.prototype, "getAllCarts").mockResolvedValueOnce(mockCarts);
    const controller = new CartController();

    const response = await controller.getAllCarts();

    expect(CartDAO.prototype.getAllCarts).toHaveBeenCalledTimes(1);
    expect(response).toEqual(mockCarts);
});

test("It should handle errors when retrieving all carts", async () => {
    const error = new Error("Failed to retrieve carts");
    jest.spyOn(CartDAO.prototype, "getAllCarts").mockRejectedValueOnce(error);
    const controller = new CartController();

    await expect(controller.getAllCarts()).rejects.toThrow(error);
});