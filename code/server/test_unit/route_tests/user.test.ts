import { test, expect, jest } from "@jest/globals"
import request from 'supertest'
import { app } from "../../index"
import { User, Role } from "../../src/components/user";
    
import Authenticator from "../../src/routers/auth";
const passport = require('passport');

import UserController from "../../src/controllers/userController"
const baseURL = "/ezelectronics"

//Example of a unit test for the POST ezelectronics/users route
//The test checks if the route returns a 200 success code
//The test also expects the createUser method of the controller to be called once with the correct parameters

const managerUser = request.agent(app);

jest.mock('../../src/routers/auth');
jest.mock('../../src/controllers/userController');

test("It should return a 200 success code", async () => {
    const testUser = { //Define a test user object sent to the route
        username: "test",
        name: "test",
        surname: "test",
        password: "test",
        role: "Manager"
    }
    jest.spyOn(UserController.prototype, "createUser").mockResolvedValueOnce(true) //Mock the createUser method of the controller
    const response = await managerUser.post(baseURL + "/users").send(testUser) //Send a POST request to the route
    expect(response.status).toBe(200) //Check if the response status is 200
    expect(UserController.prototype.createUser).toHaveBeenCalledTimes(1) //Check if the createUser method has been called once
    //Check if the createUser method has been called with the correct parameters
    expect(UserController.prototype.createUser).toHaveBeenCalledWith(testUser.username,
        testUser.name,
        testUser.surname,
        testUser.password,
        testUser.role)
})

test("GET /users should return a 200 success code and users array", async () => {
    const mockUsers = [{ username: "test1", name:"ciao", surname:"bla", role:Role.MANAGER, address:"ci", birthdate:"12/01/23" },{ username: "test1", name:"ciao", surname:"bla", role:Role.MANAGER, address:"ci", birthdate:"12/01/23" }];

    const testUser = { //Define a test user object sent to the route
        username: "test",
        name: "test",
        surname: "test",
        password: "test",
        role: Role.ADMIN
    }
    // jest.spyOn(Authenticator.prototype, "isAdmin").mockImplementation((req,res,next) => res.status(402).json({ error: "User is not a manager", status: 401 }))

    // jest.mock('express-validator', () => ({
    //     // param: jest.fn().mockImplementation(() => ({
    //     //     exists: jest.fn().mockReturnThis(),
    //     //     isString: () => ({ isLength: () => ({}) }),
    //     // })),
    //     body: jest.fn().mockImplementation(() => ({
    //         exists: jest.fn().mockReturnThis(),
    //         isString: () => ({ isLength: () => ({}) }),
    //         isInt: () => ({ isLength: () => ({}) }),
    //     }))
    // }))
    //We mock the 'isCustomer' method to return the next function, because we are not testing the Authenticator logic here (we assume it works correctly)
    jest.spyOn(Authenticator.prototype, "isAdmin").mockImplementation((req, res, next) => {
        req.user = testUser
        return next()
    })
    jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
        req.user = testUser
        return next()
    })
    jest.spyOn(UserController.prototype, "getUsers").mockResolvedValueOnce(mockUsers); // Mock the getUsers method of the controller

    
    const response = (await request(app).get(baseURL + "/users")); // Send a GET request to the route
    
    expect(response.status).toBe(200); // Check if the response status is 200
    expect(response.body).toEqual(mockUsers); // Check if the response body matches the mocked users array
    expect(UserController.prototype.getUsers).toHaveBeenCalledTimes(1); // Check if the getUsers method has been called once
});

// Example of a unit test for the POST /auth route
test("POST /auth should return a 200 success code on login", async () => {
    const testLogin = { username: "test", password: "test" };
    const mockUser ={ username: "test", name:"test", surname:"test", role:Role.MANAGER, address:"ci", birthdate:"12/01/23" };
    jest.spyOn(Authenticator.prototype, "login").mockResolvedValueOnce(mockUser); // Mock the login method of the authenticator
    
    const response = await managerUser.post(baseURL+"/sessions").send(testLogin); // Send a POST request to the login route
    
    expect(response.status).toBe(200); // Check if the response status is 200
    expect(response.body).toEqual(mockUser); // Check if the response body matches the mocked user
    expect(Authenticator.prototype.login).toHaveBeenCalledTimes(1); // Check if the login method has been called once
    expect(Authenticator.prototype.login).toHaveBeenCalledWith(expect.any(Object), expect.any(Object), expect.any(Function)); // Check if the login method has been called with the correct parameters
});

test("DELETE /auth/current should return a 200 success code on logout", async () => {
    const mockUser ={ username: "test", name:"test", surname:"test", role:Role.MANAGER, address:"ci", birthdate:"12/01/23" };
    jest.spyOn(Authenticator.prototype, "logout").mockResolvedValueOnce(mockUser)

    const response = await request(app).delete(baseURL+"/sessions/current")

    expect(response.status).toBe(200); // Check if the response status is 200
    expect(Authenticator.prototype.logout).toHaveBeenCalledTimes(1); // Check if the logout method has been called once
    expect(Authenticator.prototype.logout).toHaveBeenCalledWith(expect.any(Object), expect.any(Object), expect.any(Function)); // Check if the login method has been called with the correct parameters
})

test("GET /auth/current should return a 200 success code on logout", async () => {

    const response = await request(app).get(baseURL+"/sessions/current")

    expect(response.status).toBe(200); // Check if the response status is 200
    
})

test("DELETE /users/:username should return a 200 success code on successful deletion", async () => {
    const mockUser ={ username: "test", name:"test", surname:"test", role:Role.ADMIN, address:"ci", birthdate:"12/01/23" };

    const testUser = { //Define a test user object sent to the route
        username: "test",
        name: "test",
        surname: "test",
        password: "test",
        role: Role.ADMIN
    }

    jest.spyOn(UserController.prototype, "deleteAll").mockReturnValueOnce(Promise.resolve(true))

    jest.spyOn(Authenticator.prototype, "isAdmin").mockImplementation((req, res, next) => {
        req.user = testUser
        return next()
    })
    jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
        req.user = testUser
        return next()
    })

    const response = await request(app).delete(baseURL+"/users/")

    expect(response.status).toBe(200)
    expect(UserController.prototype.deleteAll).toHaveBeenCalledTimes(1)
    // expect(UserController.prototype.deleteAll).toHaveBeenCalledWith(undefined);
})

test("DELETE /users/:username should return a 200 success code on successful deletion", async () => {
    const mockUser ={ username: "test", name:"test", surname:"test", role:Role.ADMIN, address:"ci", birthdate:"12/01/23" };

    const testUser = { //Define a test user object sent to the route
        username: "test",
        name: "test",
        surname: "test",
        password: "test",
        role: Role.ADMIN
    }

    jest.spyOn(UserController.prototype, "deleteUser").mockReturnValueOnce(Promise.resolve(true))

    jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
        req.user = testUser
        return next()
    })

    const response = await request(app).delete(baseURL+"/users/"+mockUser.username)

    expect(response.status).toBe(200)
    expect(UserController.prototype.deleteUser).toHaveBeenCalledTimes(1)
    // expect(UserController.prototype.deleteAll).toHaveBeenCalledWith(undefined);
})

// Example of a unit test for the PATCH /users/:username route
/*test("PATCH /users/:username should return a 200 success code and updated user object", async () => {
    const username = "test"
    const updatedUser = {
        name: "updatedName",
        surname: "updatedSurname",
        address: "updatedAddress",
        birthdate: "2000-02-02"
    }
    const mockUpdatedUser = { username: "test", ...updatedUser, role: Role.CUSTOMER }

    jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
        req.user = mockUpdatedUser
        return next()
    })

    jest.spyOn(UserController.prototype, "updateUserInfo").mockResolvedValueOnce(mockUpdatedUser);

    const response = await request(app).patch(`${baseURL}/users/${username}`).send(updatedUser).set('user', JSON.stringify(mockUpdatedUser))

    expect(response.status).toBe(200)
    expect(response.body).toEqual(mockUpdatedUser)
    expect(UserController.prototype.updateUserInfo).toHaveBeenCalledTimes(1)
    expect(UserController.prototype.updateUserInfo).toHaveBeenCalledWith(mockUpdatedUser, name: string, surname: string, address: string, birthdate: string, username: string)
})*/

test("PATCH /users/:username should return a 200 success code on successful update", async () => {
    const mockUser = {
        username: "test",
        name: "test",
        surname: "test",
        role: Role.ADMIN,
        address: "ci",
        birthdate: "2000-01-12" // Data in formato ISO
    };

    const testUser = {
        username: "test",
        name: "test",
        surname: "test",
        password: "test",
        role: Role.ADMIN
    }

    jest.spyOn(UserController.prototype, "updateUserInfo").mockReturnValueOnce(Promise.resolve(mockUser));

    jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
        req.user = testUser;
        return next();
    });

    const response = await request(app)
        .patch(baseURL + "/users/" + mockUser.username)
        .send({
            name: mockUser.name,
            surname: mockUser.surname,
            address: mockUser.address,
            birthdate: mockUser.birthdate
        });

    expect(response.status).toBe(200);
    expect(UserController.prototype.updateUserInfo).toHaveBeenCalledTimes(1);
    expect(UserController.prototype.updateUserInfo).toHaveBeenCalledWith(
        testUser,
        mockUser.name,
        mockUser.surname,
        mockUser.address,
        mockUser.birthdate,
        mockUser.username
    );
});

