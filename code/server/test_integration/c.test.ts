import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import { app } from '../index';
import { cleanup } from '../src/db/cleanup';

// Base route path for the API
const basePath = "/ezelectronics";
const cartRoutePath = basePath + '/carts';
const productRoutePath = basePath + '/products';

const SECONDS = 1000;
jest.setTimeout(70 * SECONDS)

// Default product information to use in tests
const product = {
  model: 'ModelX',
  category: 'Smartphone',
  quantity: 10,
  details: 'Latest model with new features',
  sellingPrice: 699,
  arrivalDate: '2023-09-21',
};

// Cookies for the users. We use them to keep users logged in.
let adminCookie:string
let managerCookie:string
let customerCookie:string

// User roles
const admin = { username: 'adminc', name: "admin", surname: "admin", password: 'admin', role: 'Admin' };
const manager = { username: 'managerc', name: "manager", surname: "manager", password: 'manager', role: 'Manager' };
const customer = { username: 'customerc', name: "customer", surname: "customer", password: 'customer', role: 'Customer' };

// Helper function that logs in a user and returns the cookie
const login = async (userInfo:any) => {
    return new Promise<string>((resolve, reject) => {
    request(app)
      .post(basePath + '/sessions')
      .send(userInfo)
      .expect(200)
      .end((err, res) => {
        if (err) {
          reject(err);
        }
        resolve(res.headers['set-cookie'][0]);
      });
  });
};

// Before executing tests, set up the database and log in users
beforeAll(async () => {
  await cleanup();
  await request(app).post(basePath + '/users').send(admin);
  await request(app).post(basePath + '/users').send(manager);
  await request(app).post(basePath + '/users').send(customer);

  adminCookie = await login(admin);
  managerCookie = await login(manager);
  customerCookie = await login(customer);

  await request(app)
    .post(productRoutePath)
    .send(product)
    .set('Cookie', managerCookie)
    .expect(200);
});

// After executing tests, clean up the database ERROR_JEST
afterAll( () => {
   cleanup();
});

// Tests for Cart Routes
  test('It should return a 200 status and the cart for the logged in customer', async () => {
    const response = await request(app)
      .get(cartRoutePath)
      .set('Cookie', customerCookie)
      .expect(200);

    expect(response.body).toBeDefined();
    expect(response.body).toHaveProperty('customer', 'customerc');
  });

  test('It should return a 200 status and add a product to the cart', async () => {
    await request(app)
      .post(cartRoutePath)
      .send({ model: product.model })
      .set('Cookie', customerCookie)
      .expect(200);

    const response = await request(app)
      .get(cartRoutePath)
      .set('Cookie', customerCookie)
      .expect(200);

    expect(response.body.products).toHaveLength(1);
    expect(response.body.products[0].model).toBe(product.model);
  });

  test('It should return a 200 status and checkout the cart', async () => {
    await request(app)
      .patch(cartRoutePath)
      .set('Cookie', customerCookie)
      .expect(200);

    const response = await request(app)
      .get(cartRoutePath + '/history')
      .set('Cookie', customerCookie)
      .expect(200);

    expect(response.body).toHaveLength(1);
    // expect(response.body[0].status).toBe('PAID');
  });

  test('It should return a 200 status and remove a product from the cart', async () => {
    await request(app)
      .post(cartRoutePath)
      .send({ model: product.model })
      .set('Cookie', customerCookie)
      .expect(200);

    await request(app)
      .delete(cartRoutePath + `/products/${product.model}`)
      .set('Cookie', customerCookie)
      .expect(200);

    const response = await request(app)
      .get(cartRoutePath)
      .set('Cookie', customerCookie)
      .expect(200);

    expect(response.body.products).toHaveLength(0);
  });

  test('It should return a 401 for unauthorized user trying to access cart', async () => {
    await request(app)
      .get(cartRoutePath)
      .set('Cookie', adminCookie)
      .expect(401);

    await request(app)
      .post(cartRoutePath)
      .send({ model: product.model })
      .set('Cookie', adminCookie)
      .expect(401);
  });

  test('It should clear the current cart for the logged in customer', async () => {
    await request(app)
      .post(cartRoutePath)
      .send({ model: product.model })
      .set('Cookie', customerCookie)
      .expect(200);

    await request(app)
      .delete(cartRoutePath + `/current`)
      .set('Cookie', customerCookie)
      .expect(200);

    const response = await request(app)
      .get(cartRoutePath)
      .set('Cookie', customerCookie)
      .expect(200);

    expect(response.body.products).toHaveLength(0);
  });

  test('It should delete all carts as admin or manager', async () => {
    await request(app)
      .delete(cartRoutePath)
      .set('Cookie', adminCookie)
      .expect(200);

    const response = await request(app)
      .get(cartRoutePath + '/all')
      .set('Cookie', adminCookie)
      .expect(200);

    expect(response.body).toHaveLength(0);
  });

  test('It should return an array of all carts for admin or manager', async () => {
    const response = await request(app)
      .get(cartRoutePath + '/all')
      .set('Cookie', adminCookie)
      .expect(200);

    expect(response.body).toBeInstanceOf(Array);
  });


// Tests for Product Routes getAllCarts
