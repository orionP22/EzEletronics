import { test, expect, jest } from "@jest/globals";
import request from "supertest";
import { app } from "../../index";
import Authenticator from "../../src/routers/auth";
import ReviewController from "../../src/controllers/reviewController";

const baseURL = "/ezelectronics/reviews";
const customerUser = request.agent(app);

jest.mock("../../src/routers/auth");
jest.mock("../../src/controllers/reviewController");

const mockReview = {
    model: "testProduct",
    user: "testUser",
    score: 5,
    date: "2024-01-01",
    comment: "Great product!",
};

const mockUser = {
    username: "testUser",
    name: "Test",
    surname: "User",
    role: "Customer",
    address: "Test Address",
    birthdate: "2000-01-01",
};

const mockAdminUser = {
    ...mockUser,
    role: "Admin",
};

// Test for POST /:model route
test("POST /:model should return a 200 success code on adding a review", async () => {
    jest.spyOn(ReviewController.prototype, "addReview").mockResolvedValueOnce();

    jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => {
        req.user = mockUser;
        return next();
    });

    jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
        req.user = mockUser;
        return next();
    });

    const response = await customerUser.post(baseURL + "/testProduct").send({ score: 5, comment: "Great product!" });

    expect(response.status).toBe(200);
    expect(ReviewController.prototype.addReview).toHaveBeenCalledTimes(1);
    expect(ReviewController.prototype.addReview).toHaveBeenCalledWith("testProduct", mockUser, 5, "Great product!");
    jest.clearAllMocks();
});

test('POST /:model should return 503 if controller.addReview throws an error', async () => {
    jest.spyOn(ReviewController.prototype, 'addReview').mockRejectedValueOnce(new Error('Database error'));

    jest.spyOn(Authenticator.prototype, 'isCustomer').mockImplementation((req, res, next) => {
        req.user = mockUser;
        return next();
    });

    jest.spyOn(Authenticator.prototype, 'isLoggedIn').mockImplementation((req, res, next) => {
        req.user = mockUser;
        return next();
    });

    const response = await request(app)
        .post(baseURL + '/testProduct')
        .send({ score: 3, comment: 'Great product!' });
    

    expect(response.status).toBe(503);
    expect(response.body.error).toBe('Internal Server Error');
    expect(ReviewController.prototype.addReview).toHaveBeenCalledTimes(1);
    expect(ReviewController.prototype.addReview).toHaveBeenCalledWith('testProduct', mockUser, 3, 'Great product!');
    jest.clearAllMocks();
});

// Test for GET /:model route
test("GET /:model should return a 200 success code and the product reviews", async () => {
    const mockReviews = [mockReview];

    jest.spyOn(ReviewController.prototype, "getProductReviews").mockResolvedValueOnce(mockReviews);

    jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
        req.user = mockUser;
        return next();
    });

    const response = await customerUser.get(baseURL + "/testProduct");

    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockReviews);
    expect(ReviewController.prototype.getProductReviews).toHaveBeenCalledTimes(1);
    expect(ReviewController.prototype.getProductReviews).toHaveBeenCalledWith("testProduct");
    jest.clearAllMocks();
});

test('GET /:model should return 500 if controller.getProductReviews throws an error', async () => {
    jest.spyOn(ReviewController.prototype, 'getProductReviews').mockRejectedValueOnce(new Error('Database error'));

    const response = await request(app)
        .get(baseURL + '/testProduct')
        .send();

    expect(response.status).toBe(503);
    expect(response.body.error).toBe('Internal Server Error');
    expect(ReviewController.prototype.getProductReviews).toHaveBeenCalledTimes(1);
    expect(ReviewController.prototype.getProductReviews).toHaveBeenCalledWith('testProduct');
    jest.clearAllMocks();
});

// Test for DELETE /:model route
test("DELETE /:model should return a 200 success code on deleting a review", async () => {
    jest.spyOn(ReviewController.prototype, "deleteReview").mockResolvedValueOnce();

    jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => {
        req.user = mockUser;
        return next();
    });

    jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
        req.user = mockUser;
        return next();
    });

    const response = await customerUser.delete(baseURL + "/testProduct");

    expect(response.status).toBe(200);
    expect(ReviewController.prototype.deleteReview).toHaveBeenCalledTimes(1);
    expect(ReviewController.prototype.deleteReview).toHaveBeenCalledWith("testProduct", mockUser);
    jest.clearAllMocks();
});

test('DELETE /:model should return 503 if controller.deleteReview throws an error', async () => {
    jest.spyOn(ReviewController.prototype, 'deleteReview').mockRejectedValueOnce(new Error('Database error'));

    const response = await request(app)
        .delete(baseURL + '/testProduct')
        .send();

    expect(response.status).toBe(503);
    expect(response.body.error).toBe('Internal Server Error');
    expect(ReviewController.prototype.deleteReview).toHaveBeenCalledTimes(1);
    expect(ReviewController.prototype.deleteReview).toHaveBeenCalledWith('testProduct', expect.any(Object)); // Verifica che il secondo argomento sia un oggetto (l'utente)
    jest.clearAllMocks();
});

// Test for DELETE /:model/all route
test("DELETE /:model/all should return a 200 success code on deleting all reviews of a product", async () => {
    jest.spyOn(ReviewController.prototype, "deleteReviewsOfProduct").mockResolvedValueOnce();

    jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
        req.user = mockAdminUser;
        return next();
    });

    jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
        req.user = mockAdminUser;
        return next();
    });

    const response = await customerUser.delete(baseURL + "/testProduct/all");

    expect(response.status).toBe(200);
    expect(ReviewController.prototype.deleteReviewsOfProduct).toHaveBeenCalledTimes(1);
    expect(ReviewController.prototype.deleteReviewsOfProduct).toHaveBeenCalledWith("testProduct");
    jest.clearAllMocks();
});

test('DELETE /:model/all should return 503 if controller.deleteReviewsOfProduct throws an error', async () => {
    jest.spyOn(ReviewController.prototype, 'deleteReviewsOfProduct').mockRejectedValueOnce(new Error('Database error'));

    const response = await request(app)
        .delete(baseURL + '/testProduct/all')
        .send();

    expect(response.status).toBe(503);
    expect(response.body.error).toBe('Internal Server Error');
    expect(ReviewController.prototype.deleteReviewsOfProduct).toHaveBeenCalledTimes(1);
    expect(ReviewController.prototype.deleteReviewsOfProduct).toHaveBeenCalledWith('testProduct');
    jest.clearAllMocks();
});

// Test for DELETE / route
test("DELETE / should return a 200 success code on deleting all reviews of all products", async () => {
    jest.spyOn(ReviewController.prototype, "deleteAllReviews").mockResolvedValueOnce();

    jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
        req.user = mockAdminUser;
        return next();
    });

    jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
        req.user = mockAdminUser;
        return next();
    });

    const response = await customerUser.delete(baseURL);

    expect(response.status).toBe(200);
    expect(ReviewController.prototype.deleteAllReviews).toHaveBeenCalledTimes(1);
    expect(ReviewController.prototype.deleteAllReviews).toHaveBeenCalledWith();
    jest.clearAllMocks();
});

test('DELETE / should return 503 if controller.deleteAllReviews throws an error', async () => {
    jest.spyOn(ReviewController.prototype, 'deleteAllReviews').mockRejectedValueOnce(new Error('Database error'));

    const response = await request(app)
        .delete(baseURL)
        .send();

    expect(response.status).toBe(503);
    expect(response.body.error).toBe('Internal Server Error');
    expect(ReviewController.prototype.deleteAllReviews).toHaveBeenCalledTimes(1);
    expect(ReviewController.prototype.deleteAllReviews).toHaveBeenCalledWith();
    jest.clearAllMocks();
});
