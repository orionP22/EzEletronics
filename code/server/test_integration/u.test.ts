import { describe, test, expect, beforeAll, afterAll } from "@jest/globals"
import request from 'supertest'
import { app } from "../index"
import { cleanup } from "../src/db/cleanup"
import { PassThrough } from "stream"

const routePath = "/ezelectronics" //Base route path for the API

//Default user information. We use them to create users and evaluate the returned values
const customer = { username: "custom", name: "custom", surname: "custom", password: "customer", role: "Customer" }
const admin = { username: "admin", name: "admin", surname: "admin", password: "admin", role: "Admin" }
//Cookies for the users. We use them to keep users logged in. Creating them once and saving them in a variables outside of the tests will make cookies reusable
let customerCookie: string
let adminCookie: string


const SECONDS = 1000;
jest.setTimeout(70 * SECONDS)
//Helper function that creates a new user in the database.
//Can be used to create a user before the tests or in the tests
//Is an implicit test because it checks if the return code is successful
const postUser = async (userInfo: any) => {
    await request(app)
        .post(routePath +"/users")
        .send(userInfo)

}

//Helper function that logs in a user and returns the cookie
//Can be used to log in a user before the tests or in the tests
const login = async (userInfo: any) => {
    return new Promise<string>((resolve, reject) => {
        request(app)
            .post(routePath+"/sessions")
            .send(userInfo)
            .expect(200)
            .end((err, res) => {
                if (err) {
                    reject(err)
                }
                resolve(res.headers["set-cookie"][0])
            })
    })
}

//Before executing tests, we remove everything from our test database, create an Admin user and log in as Admin, saving the cookie in the corresponding variable
beforeAll(async () => {
    await cleanup()
    await postUser(admin)
    adminCookie = await login({username:admin.username, password:admin.password})
    // const users = await request(app) //It is possible to assign the response to a variable and use it later. 
    //     .get(`${routePath}/users`)
    //     .set("Cookie", adminCookie) //Authentication is specified with the 'set' block. Adding a cookie to the request will allow authentication (if the cookie has been created with the correct login route). Without this cookie, the request will be unauthorized
    // console.log(users.body);
})

//After executing tests, we remove everything from our test database
afterAll( () => {
     cleanup()
})


//A 'describe' block is a way to group tests. It can be used to group tests that are related to the same functionality
//In this example, tests are for the user routes
//Inner 'describe' blocks define tests for each route

// A 'test' block is a single test. It should be a single logical unit of testing for a specific functionality and use case (e.g. correct behavior, error handling, authentication checks)
test("It should return a 200 success code and create a new user", async () => {
    //da errore
    //A 'request' function is used to send a request to the server. It is similar to the 'fetch' function in the browser
    //It executes an API call to the specified route, similarly to how the client does it
    //It is an actual call, with no mocking, so it tests the real behavior of the server
    //Route calls are asynchronous operations, so we need to use 'await' to wait for the response
    
    
    console.log("first");
    await request(app)
        .post(`${routePath}/users`) //The route path is specified here. Other operation types can be defined with similar blocks (e.g. 'get', 'patch', 'delete'). Route and query parameters can be added to the path
        .send(customer) //In case of a POST request, the data is sent in the body of the request. It is specified with the 'send' block. The data sent should be consistent with the API specifications in terms of names and types
        .expect(200) //The 'expect' block is used to check the response status code. We expect a 200 status code for a successful operation

    //After the request is sent, we can add additional checks to verify the operation, since we need to be sure that the user is present in the database
    //A possible way is retrieving all users and looking for the user we just created.
    const users = await request(app) //It is possible to assign the response to a variable and use it later. 
        .get(`${routePath}/users`)
        .set("Cookie", adminCookie) //Authentication is specified with the 'set' block. Adding a cookie to the request will allow authentication (if the cookie has been created with the correct login route). Without this cookie, the request will be unauthorized
        .expect(200)
    expect(users.body).toHaveLength(2) //Since we know that the database was empty at the beginning of our tests and we created two users (an Admin before starting and a Customer in this test), the array should contain only two users
    let cust = users.body.find((user: any) => user.username === customer.username) //We look for the user we created in the array of users
    expect(cust).toBeDefined() //We expect the user we have created to exist in the array. The parameter should also be equal to those we have sent
    expect(cust.name).toBe(customer.name)
    expect(cust.surname).toBe(customer.surname)
    expect(cust.role).toBe(customer.role)
})

//Tests for error conditions can be added in separate 'test' blocks.
//We can group together tests for the same condition, no need to create a test for each body parameter, for example
test("It should return a 422 error code if at least one request body parameter is empty/missing", async () => {
    await request(app)
        .post(`${routePath}/users`)
        .send({ username: "", name: "test", surname: "test", password: "test", role: "Customer" }) //We send a request with an empty username. The express-validator checks will catch this and return a 422 error code
        .expect(422)
    await request(app).post(`${routePath}/users`).send({ username: "test", name: "", surname: "test", password: "test", role: "Customer" }).expect(422) //We can repeat the call for the remaining body parameters
})

test("It should return an array of users", async () => {
    //da errore
    const users = await request(app).get(`${routePath}/users`).set("Cookie", adminCookie).expect(200)
    expect(users.body).toHaveLength(2)
    let cust = users.body.find((user: any) => user.username === customer.username)
    expect(cust).toBeDefined()
    expect(cust.name).toBe(customer.name)
    expect(cust.surname).toBe(customer.surname)
    expect(cust.role).toBe(customer.role)
    let adm = users.body.find((user: any) => user.username === admin.username)
    expect(adm).toBeDefined()
    expect(adm.name).toBe(admin.name)
    expect(adm.surname).toBe(admin.surname)
    expect(adm.role).toBe(admin.role)
})




test("It should return a 401 error code if the user is not an Admin", async () => {
    customerCookie = await login(customer)
    await request(app).get(`${routePath}/users`).set("Cookie", customerCookie).expect(401) //We call the same route but with the customer cookie. The 'expect' block must be changed to validate the error
    await request(app).get(`${routePath}/users`).expect(401) //We can also call the route without any cookie. The result should be the same
})

test("It should return an array of users with a specific role", async () => {
    //Route parameters are set in this way by placing directly the value in the path
    //It is not possible to send an empty value for the role (/users/roles/ will not be recognized as an existing route, it will return 404)
    //Empty route parameters cannot be tested in this way, but there should be a validation block for them in the route
    const admins = await request(app).get(`${routePath}/users/roles/Admin`).set("Cookie", adminCookie).expect(200)
    expect(admins.body).toHaveLength(1) //In this case, we expect only one Admin user to be returned
    let adm = admins.body[0]
    expect(adm.username).toBe(admin.username)
    expect(adm.name).toBe(admin.name)
    expect(adm.surname).toBe(admin.surname)
})

test("It should fail if the role is not valid", async () => {
    //Invalid route parameters can be sent and tested in this way. The 'expect' block should contain the corresponding code
    await request(app).get(`${routePath}/users/roles/Invalid`).set("Cookie", adminCookie).expect(422)
})

test("It should update a user's information", async () => {
    const updatedInfo = { name: "new_customer", surname: "new_customer", address: "stomer", birthdate: "2021-01-01"};

    await request(app)
        .patch(`${routePath}/users/${customer.username}`)
        .send(updatedInfo)
        .set("Cookie", adminCookie)
        .expect(200);

    const users = await request(app)
        .get(`${routePath}/users`)
        .set("Cookie", adminCookie)
        .expect(200);

    const updatedUser = users.body.find((user: any) => user.username === customer.username);
    expect(updatedUser.name).toBe(updatedInfo.name);
    expect(updatedUser.surname).toBe(updatedInfo.surname);
});

test("It should return a 404 error code if user does not exist while updating", async () => {
    const updatedInfo = { name: "new_customer", surname: "new_customer", address: "stomer", birthdate: "2021-01-01"};
    await request(app)
        .patch(`${routePath}/users/nonexistentuser`)
        .send(updatedInfo)
        .set("Cookie", adminCookie)
        .expect(404);
});

test("It should delete a user", async () => {
    await request(app)
        .delete(`${routePath}/users/${customer.username}`)
        .set("Cookie", adminCookie)
        .expect(200);

    const users = await request(app)
        .get(`${routePath}/users`)
        .set("Cookie", adminCookie)
        .expect(200);

    const deletedUser = users.body.find((user: any) => user.username === customer.username);
    expect(deletedUser).toBeUndefined();
});

test("It should return a 404 error code if user does not exist when deleting", async () => {
    await request(app)
        .delete(`${routePath}/users/nonexistentuser`)
        .set("Cookie", adminCookie)
        .expect(404);
});

test("It should return user information for the logged-in user", async () => {
    // customerCookie = await login(customer)
    const response = await request(app)
        .get(`${routePath}/sessions/current`)
        .set("Cookie", adminCookie)
        .expect(200);
    
    console.log(response.body)

    expect(response.body.username).toBe(admin.username);
    expect(response.body.name).toBe(admin.name);
    expect(response.body.surname).toBe(admin.surname);
    expect(response.body.role).toBe(admin.role);
});