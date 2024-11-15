import { test, expect, jest } from "@jest/globals";
import { User, Role } from "../../src/components/user";
import { ProductReview } from "../../src/components/review";
import ReviewController from "../../src/controllers/reviewController";
import ReviewDAO from "../../src/dao/reviewDAO";
import { beforeEach, describe, it } from "node:test";
import { UnauthorizedUserError, UserNotCustomerError } from "../../src/errors/userError";
import dayjs from "dayjs";


// Simular el comportamiento del DAO
jest.mock("../../src/dao/reviewDAO");

test("check addReview", async () => {

    const testUser = new User("user1", "name1", "surname1", Role.CUSTOMER, "address1", "birthdate1")

    const testReview = { //Define a test user object
        model: "test",
        user: testUser,
        score: 3,
        comment: "test",
    }
    jest.spyOn(ReviewDAO.prototype, "createReview").mockResolvedValueOnce(); //Mock the createUser method of the DAO
    const controller = new ReviewController(); //Create a new instance of the controller
    const response = await controller.addReview(testReview.model, testReview.user, testReview.score, testReview.comment);

    expect(ReviewDAO.prototype.createReview).toHaveBeenCalledTimes(1);
    expect(ReviewDAO.prototype.createReview).toHaveBeenCalledWith(
        testReview.model, 
        testReview.user.username, 
        testReview.score, 
        dayjs().format("YYYY-MM-DD"),
        testReview.comment);
});


test("check getProductReviews", async () => {

    const testResult = [
        new ProductReview("testModel", "user1", 2, "2024-06-02", "comment1"),
        new ProductReview("testModel", "user2", 4, "2024-05-14", "comment2"),
        new ProductReview("testModel", "user3", 3, "2024-05-22", "comment3")
    ]

    const testReview = "testModel"; //Define a test model string

    jest.spyOn(ReviewDAO.prototype, "viewReview").mockResolvedValueOnce(testResult); //Mock the viewReview method of the DAO
    const controller = new ReviewController(); //Create a new instance of the controller
    //Call the getProductReviews method of the controller with the test model string
    const response = await controller.getProductReviews(testReview);

    //Check if the viewReview method of the DAO has been called once with the correct parameters
    expect(ReviewDAO.prototype.viewReview).toHaveBeenCalledTimes(1);
    expect(ReviewDAO.prototype.viewReview).toHaveBeenCalledWith(testReview);
    expect(response).toBe(testResult); 
});

test("check deleteReview", async () => {
    const testUser = new User("user1", "name1", "surname1", Role.CUSTOMER, "address1", "birthdate1");
    const testReview = "testModel"; // Define a test model string

    // Mock the deleteReview method of the DAO to resolve with undefined (void)
    jest.spyOn(ReviewDAO.prototype, "deleteReview").mockResolvedValueOnce(undefined);

    const controller = new ReviewController(); // Create a new instance of the controller

    // Call the deleteReview method of the controller with the test model string and the user object
    await controller.deleteReview(testReview, testUser);

    // Check if the deleteReview method of the DAO has been called once with the correct parameters
    expect(ReviewDAO.prototype.deleteReview).toHaveBeenCalledTimes(1);
    expect(ReviewDAO.prototype.deleteReview).toHaveBeenCalledWith(testReview, testUser.username);
});

test("check deleteReviewsOfProduct", async () => {

    const testReview = "testModel"; //Define a test model string

    jest.spyOn(ReviewDAO.prototype, "deleteReviewsOfProduct").mockResolvedValueOnce(undefined); //Mock the deleteReviewsOfProduct method of the DAO
    const controller = new ReviewController(); //Create a new instance of the controller
    //Call the deleteReviewsOfProduct method of the controller with the test model string 
    const response = await controller.deleteReviewsOfProduct(testReview);

    //Check if the deleteReviewsOfProduct method of the DAO has been called once with the correct parameters
    expect(ReviewDAO.prototype.deleteReviewsOfProduct).toHaveBeenCalledTimes(1);
    expect(ReviewDAO.prototype.deleteReviewsOfProduct).toHaveBeenCalledWith(testReview);
});

test("check deleteAllReviews", async () => {

    jest.spyOn(ReviewDAO.prototype, "deleteAllReviews").mockResolvedValueOnce(undefined); //Mock the deleteAllReviews method of the DAO
    const controller = new ReviewController(); //Create a new instance of the controller
    //Call the deleteAllReviews method of the controller 
    const response = await controller.deleteAllReviews();

    //Check if the deleteAllReviews method of the DAO has been called once with the correct parameters
    expect(ReviewDAO.prototype.deleteAllReviews).toHaveBeenCalledTimes(1);
    expect(ReviewDAO.prototype.deleteAllReviews).toHaveBeenCalledWith();
});
