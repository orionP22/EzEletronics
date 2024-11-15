//create complete user tests based on this for user controller and dao
import { test, expect, jest } from "@jest/globals";
import UserController from "../../src/controllers/userController";
import UserDAO from "../../src/dao/userDAO";
import { User, Role } from "../../src/components/user";
import { UnauthorizedUserError, UserAlreadyExistsError, UserIsAdminError, UserNotAdminError, UserNotFoundError } from "../../src/errors/userError";

jest.mock("../../src/dao/userDAO")

//Example of a unit test for the createUser method of the UserController
//The test checks if the method returns true when the DAO method returns true
//The test also expects the DAO method to be called once with the correct parameters
afterEach(() => {
    jest.clearAllMocks(); //Clears the mock call history after each test
});



test("It should return true", async () => {
    const testUser = { //Define a test user object
        username: "test",
        name: "test",
        surname: "test",
        password: "test",
        role: "Manager"
    }
    jest.spyOn(UserDAO.prototype, "createUser").mockResolvedValueOnce(true); //Mock the createUser method of the DAO
    const controller = new UserController(); //Create a new instance of the controller
    //Call the createUser method of the controller with the test user object
    const response = await controller.createUser(testUser.username, testUser.name, testUser.surname, testUser.password, testUser.role);

    //Check if the createUser method of the DAO has been called once with the correct parameters
    expect(UserDAO.prototype.createUser).toHaveBeenCalledTimes(1);
    expect(UserDAO.prototype.createUser).toHaveBeenCalledWith(testUser.username,
        testUser.name,
        testUser.surname,
        testUser.password,
        testUser.role);
    expect(response).toBe(true); //Check if the response is true
});


// `getUsers` Method

test("It should return a list of users", async () => {
    const testUsers = [
        new User("user1", "name1", "surname1", Role.MANAGER, "address1", "birthdate1"),
        new User("user2", "name2", "surname2", Role.CUSTOMER, "address2", "birthdate2")
    ];
    
    jest.spyOn(UserDAO.prototype, "getUsers").mockResolvedValueOnce(testUsers);
    const controller = new UserController();
    const response = await controller.getUsers();
    
    expect(UserDAO.prototype.getUsers).toHaveBeenCalledTimes(1);
    expect(response).toEqual(testUsers);
});

// `getUsersByRole` Method

test("It should return a list of users with a specific role", async () => {
    const role = Role.MANAGER;
    const testUsers = [
        new User("user1", "name1", "surname1", role, "address1", "birthdate1")
    ];
    
    jest.spyOn(UserDAO.prototype, "getUsersByRole").mockResolvedValueOnce(testUsers);
    const controller = new UserController();
    const response = await controller.getUsersByRole(role);
    
    expect(UserDAO.prototype.getUsersByRole).toHaveBeenCalledTimes(1);
    expect(UserDAO.prototype.getUsersByRole).toHaveBeenCalledWith(role);
    expect(response).toEqual(testUsers);
});

// `getUserByUsername` Method

test("Admin should be able to get any user by username", async () => {
    const user = new User("username", "name", "surname", Role.ADMIN, "address", "birthdate");
    const usernameToFetch = "user1";
    const fetchedUser = new User(usernameToFetch, "name", "surname", Role.CUSTOMER, "address", "birthdate");

    jest.spyOn(UserDAO.prototype, "getUserByUsername").mockResolvedValueOnce(fetchedUser);
    const controller = new UserController();
    const response = await controller.getUserByUsername(user, usernameToFetch);
    
    expect(UserDAO.prototype.getUserByUsername).toHaveBeenCalledTimes(1);
    expect(UserDAO.prototype.getUserByUsername).toHaveBeenCalledWith(usernameToFetch);
    expect(response).toEqual(fetchedUser);
});

test("Non-admin user should be able to get their own data", async () => {
    const username = "user1";
    const user = new User(username, "name", "surname", Role.CUSTOMER, "address", "birthdate");
    const fetchedUser = new User(username, "name", "surname", Role.CUSTOMER, "address", "birthdate");

    jest.spyOn(UserDAO.prototype, "getUserByUsername").mockResolvedValueOnce(fetchedUser);
    const controller = new UserController();
    const response = await controller.getUserByUsername(user, username);
    
    // expect(UserDAO.prototype.getUserByUsername).toHaveBeenCalledTimes(1);
    expect(UserDAO.prototype.getUserByUsername).toHaveBeenCalledWith(username);
    expect(response).toEqual(fetchedUser);
});

test("Non-admin user should not be able to get data of other users", async () => {
    const user = new User("username", "name", "surname", Role.CUSTOMER, "address", "birthdate");
    const usernameToFetch = "user2";

    const controller = new UserController();
    
    await expect(controller.getUserByUsername(user, usernameToFetch)).rejects.toThrow(UserNotAdminError);
});

// `deleteUser` Method

test("Admin should be able to delete any non-admin user", async () => {
    const user = new User("username", "name", "surname", Role.ADMIN, "address", "birthdate");
    const usernameToDelete = "user1";
    const userToDelete = new User("username", "name", "surname", Role.CUSTOMER, "address", "birthdate");

    jest.spyOn(UserDAO.prototype, "getUserByUsername").mockResolvedValueOnce(userToDelete);
    jest.spyOn(UserDAO.prototype, "deleteUser").mockResolvedValueOnce(true);
    const controller = new UserController();
    const response = await controller.deleteUser(user, usernameToDelete);
    
    expect(UserDAO.prototype.getUserByUsername).toHaveBeenCalledWith(usernameToDelete);
    // expect(UserDAO.prototype.getUserByUsername).toHaveBeenCalledTimes(1);
    expect(UserDAO.prototype.deleteUser).toHaveBeenCalledWith(usernameToDelete);
    expect(UserDAO.prototype.deleteUser).toHaveBeenCalledTimes(1);
    expect(response).toBe(true);
});

test("Non-admin user should be able to delete their account", async () => {
    const username = "user1";
    const user = new User(username, "name", "surname", Role.CUSTOMER, "address", "birthdate");
    
    jest.spyOn(UserDAO.prototype, "deleteUser").mockResolvedValueOnce(true);
    const controller = new UserController();
    const response = await controller.deleteUser(user, username);

    // expect(UserDAO.prototype.deleteUser).toHaveBeenCalledTimes(1);
    expect(response).toBe(true);
});

test("Non-admin user should not be able to delete other users", async () => {
    const newUser = new User("username", "name", "surname", Role.CUSTOMER, "address", "birthdate");
    const usernameToDelete = "user2";

    const controller = new UserController();

    await expect(controller.deleteUser(newUser, usernameToDelete)).rejects.toThrow(UserNotAdminError);
});

test("Admin should not be able to delete another admin user", async () => {
    const adminUser = new User("admin1", "Admin", "User", Role.ADMIN, "address", "birthdate");
    const usernameToDelete = "admin2";
    const userToDelete = new User(usernameToDelete, "Another", "Admin", Role.ADMIN, "address", "birthdate");

    jest.spyOn(UserDAO.prototype, "getUserByUsername").mockResolvedValueOnce(userToDelete);
    jest.spyOn(UserDAO.prototype, "deleteUser")

    const controller = new UserController();

    await expect(controller.deleteUser(adminUser, usernameToDelete)).rejects.toThrow(UserIsAdminError);
    expect(UserDAO.prototype.getUserByUsername).toHaveBeenCalledWith(usernameToDelete);
    // Assicurati che deleteUser non sia stato chiamato
    expect(UserDAO.prototype.deleteUser).not.toHaveBeenCalled();
});

// `updateUserInfo` Method

test("User should be able to update their own information", async () => {
    const username = "user1";
    const user = new User(username, "name", "surname", Role.CUSTOMER, "address", "birthdate");
    
    const updatedUser = new User(username, "newName", "newSurname", Role.CUSTOMER, "newAddress", "newBirthdate");

    jest.spyOn(UserDAO.prototype, "updateUser").mockResolvedValueOnce(true);
    jest.spyOn(UserDAO.prototype, "getUserByUsername").mockResolvedValueOnce(updatedUser);
    const controller = new UserController();
    const response = await controller.updateUserInfo(user, "newName", "newSurname", "newAddress", "newBirthdate", username);

    expect(UserDAO.prototype.updateUser).toHaveBeenCalledWith(username, "newName", "newSurname", "newAddress", "newBirthdate");
    expect(UserDAO.prototype.updateUser).toHaveBeenCalledTimes(1);
    expect(response).toEqual(updatedUser);
});

//DeleteAllUser

test("It should delete all products and return true", async () => {
    // Mock del DAO per simulare il comportamento di deleteAllProducts
    jest.spyOn(UserDAO.prototype, "deleteAllUser").mockResolvedValueOnce(true);

    const controller = new UserController();
    const response = await controller.deleteAll();

    // Verifica che il metodo deleteAllProducts del DAO sia stato chiamato
    expect(UserDAO.prototype.deleteAllUser).toHaveBeenCalledTimes(1);
    // Verifica che la risposta sia true
    expect(response).toBe(true);
});

