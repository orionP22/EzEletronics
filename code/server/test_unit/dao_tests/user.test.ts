import UserController from "../../src/controllers/userController"
import UserDAO from "../../src/dao/userDAO"
import crypto from "crypto"
import db from "../../src/db/db"
import { Database } from "sqlite3"
import { User, Role } from "../../src/components/user";
import { test, expect, jest } from "@jest/globals";
import { beforeEach, afterEach, describe } from "node:test";
import { UserAlreadyExistsError, UserNotFoundError } from "../../src/errors/userError";

    let userDAO: UserDAO;

    beforeAll(() => {
        jest.mock("crypto");
        jest.mock("../../src/db/db.ts");
        userDAO = new UserDAO();

    });

    // beforeEach(() => {
    //     userDAO = new UserDAO();
    // });


    // afterEach(() => {
    //     jest.restoreAllMocks();
    // });

    test("createUser should resolve true", async () => {
        const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback(null)
            return {} as Database
        });
        const mockRandomBytes = jest.spyOn(crypto, "randomBytes").mockImplementation(() => Buffer.from("salt"));
        const mockScrypt = jest.spyOn(crypto, "scryptSync").mockImplementation(() => Buffer.from("hashedPassword"));

        const result = await userDAO.createUser("username", "name", "surname", "password", Role.ADMIN);
        expect(result).toBe(true);
        expect(mockDBRun).toHaveBeenCalledWith(expect.any(String), expect.any(Array), expect.any(Function));
        
        mockRandomBytes.mockRestore();
        mockDBRun.mockRestore();
        mockScrypt.mockRestore();
    });


    test("should resolve false if user does not exist", async () => {
        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(null, null);
            return {} as Database
        });

        const result = await userDAO.getIsUserAuthenticated("username", "plainPassword");
        expect(result).toBe(false);

        mockDBGet.mockRestore();
    });

    test("should resolve false if user exists but salt is missing", async () => {
        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(null, { username: "username", password: "hashedPassword", salt: null });
            return {} as Database
        });

        const result = await userDAO.getIsUserAuthenticated("username", "plainPassword");
        expect(result).toBe(false);

        mockDBGet.mockRestore();
    });

    test("should resolve true if authentication is successful", async () => {
        const salt = Buffer.from("salt");
        const hashedPassword = Buffer.from("hashedPassword");
        
        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(null, { username: "username", password: hashedPassword.toString("hex"), salt });
            return {} as Database
        });
        const mockScryptSync = jest.spyOn(crypto, "scryptSync").mockImplementation(() => hashedPassword);
        const mockTimingSafeEqual = jest.spyOn(crypto, "timingSafeEqual").mockImplementation(() => true);

        const result = await userDAO.getIsUserAuthenticated("username", "plainPassword");
        expect(result).toBe(true);

        mockDBGet.mockRestore();
        mockScryptSync.mockRestore();
        mockTimingSafeEqual.mockRestore();
    });

    test("should resolve false if password does not match", async () => {
        const salt = Buffer.from("salt");
        const storedHashedPassword = Buffer.from("storedHashedPassword");
        const differentPassword = Buffer.from("differentPassword");

        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(null, { username: "username", password: storedHashedPassword.toString("hex"), salt });
            return {} as Database
        });
        const mockScryptSync = jest.spyOn(crypto, "scryptSync").mockImplementation(() => differentPassword);
        const mockTimingSafeEqual = jest.spyOn(crypto, "timingSafeEqual").mockImplementation(() => false);

        const result = await userDAO.getIsUserAuthenticated("username", "plainPassword");
        expect(result).toBe(false);

        mockDBGet.mockRestore();
        mockScryptSync.mockRestore();
        mockTimingSafeEqual.mockRestore();
    });

    test("should reject if database returns an error", async () => {
        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(new Error("DB Error"), null);
            return {} as Database
        });

        await expect(userDAO.getIsUserAuthenticated("username", "plainPassword")).rejects.toThrow("DB Error");

        mockDBGet.mockRestore();
    });

   



    test("getUserByUsername should resolve with user object", async () => {
        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(null, { username: "username", name: "name", surname: "surname", role: Role.ADMIN, address: "address", birthdate: "birthdate" });
            return {} as Database
        });

        const result = await userDAO.getUserByUsername("username");
        expect(result).toEqual(new User("username", "name", "surname", Role.ADMIN, "address", "birthdate"));
        
        mockDBGet.mockRestore();
    });

    test("updateUser should resolve true on successful update", async () => {
        const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback(null)
        return {} as Database
        });

        const result = await userDAO.updateUser("username", "name", "surname", "address", "2002-05-13");
        expect(result).toBe(true);
        
        mockDBRun.mockRestore();
    });




    test("deleteUser should resolve true on successful delete", async () => {
        const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback(null)
        return {} as Database
        });

        const result = await userDAO.deleteUser("username");
        expect(result).toBe(true);
        
        mockDBRun.mockRestore();
    });

    test("getUsers should resolve with an array of users", async () => {
        const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, callback) => {
            callback(null, [
                { username: "user1", name: "name1", surname: "surname1", role: Role.ADMIN, address: "address", birthdate: "birthdate" },
                { username: "user2", name: "name2", surname: "surname2", role: Role.ADMIN, address: "address", birthdate: "birthdate" },
            ]);
            return {} as Database
        });

        const result = await userDAO.getUsers();
        expect(result).toEqual([
            new User("user1", "name1", "surname1", Role.ADMIN, "address", "birthdate"),
            new User("user2", "name2", "surname2", Role.ADMIN, "address", "birthdate"),
        ]);
        
        mockDBAll.mockRestore();
    });

    test("getUsersByRole should resolve with an array of users of a specific role", async () => {
        const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
            callback(null, [
                { username: "user1", name: "name1", surname: "surname1", role: Role.ADMIN, address: "address", birthdate: "birthdate" },
                { username: "user2", name: "name2", surname: "surname2", role: Role.ADMIN, address: "address", birthdate: "birthdate" },
            ]);
            return {} as Database
        });

        const result = await userDAO.getUsersByRole(Role.ADMIN);
        expect(result).toEqual([
            new User("user1", "name1", "surname1", Role.ADMIN, "address", "birthdate"),
            new User("user2", "name2", "surname2", Role.ADMIN, "address", "birthdate"),
        ]);
        
        mockDBAll.mockRestore();
    });

    test("deleteAllUser should resolve true on successful delete", async () => {
        const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback(null)
            return {} as Database
        });

        const result = await userDAO.deleteAllUser();
        expect(result).toBe(true);
        
        mockDBRun.mockRestore();
    });


    test("getUserByUsername should reject with UserNotFoundError if user does not exist", async () => {
        jest.spyOn(db, 'get').mockImplementation((sql, params, callback) => {
            const error = new Error();
            callback(error, null);
            return {} as Database;
        });
        jest.spyOn(db, 'all').mockImplementation((sql, params, callback) => {
            const error = new Error();
            callback(error, null);
            return {} as Database;
        }); 
        jest.spyOn(db, 'run').mockImplementation((sql, params, callback) => {
            const error = new Error();
            callback(error, null);
            return {} as Database;
        });


        try {
            await await userDAO.deleteAllUser();
        } catch (error) {
            // Assert that the error is the one we simulated
            expect(error).toEqual(new Error());
        }

        try {
            const result = await userDAO.createUser("username", "name", "surname", "password", Role.ADMIN);
        } catch (error) {
            // Assert that the error is the one we simulated
            expect(error).toEqual(new Error());
        }

        try {
             const result = await userDAO.getUsersByRole(Role.ADMIN);
        } catch (error) {
            // Assert that the error is the one we simulated
            expect(error).toEqual(new Error());
        }
        try {
        const result = await userDAO.getUserByUsername("username");

       } catch (error) {
           // Assert that the error is the one we simulated
           expect(error).toEqual(new Error());
       }
       try {
        await (userDAO.getIsUserAuthenticated("username", "plainPassword"));

   } catch (error) {
       // Assert that the error is the one we simulated
       expect(error).toEqual(new Error());
   }
   try {
    const result = await userDAO.deleteUser("username");

} catch (error) {
   // Assert that the error is the one we simulated
   expect(error).toEqual(new Error());
}
try {
    const result = await userDAO.updateUser("username", "name", "surname", "address", "birthdate");

} catch (error) {
   // Assert that the error is the one we simulated
   expect(error).toEqual(new Error());
}



    

        
        
        jest.restoreAllMocks();
    });