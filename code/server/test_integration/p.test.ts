import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import { app } from '../index';
import { cleanup } from '../src/db/cleanup';
import { Product } from '../src/components/product';
import Authenticator from '../src/routers/auth';

// Base route path for the API
const basePath = "/ezelectronics"
const routePath = basePath+'/products';


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
};const product2 = {
  model: 'ModelXhh',
  category: 'Smartphone',
  quantity: 10,
  details: 'Latest model with new features',
  sellingPrice: 699,
  arrivalDate: '2023-09-21',
};
type ProductRes = {
    model: string;
    category: string;
    quantity: number;
    details: string;
    sellingPrice: number;
    arrivalDate: string;
};
// Cookies for the users. We use them to keep users logged in.
let adminCookie:string
let managerCookie:string
let customerCookie:string

// User roles
const admin = { username: 'adminp', name: "customer", surname: "customer", password: 'admin', role: 'Admin' };
const manager = { username: 'managerp', name: "customer", surname: "customer", password: 'manager', role: 'Manager' };
const customer = { username: 'customerp', name: "customer", surname: "customer", password: 'customer', role: 'Customer' };

// Helper function that logs in a user and returns the cookie
const login = async (userInfo:any) => {
  return new Promise<string>((resolve, reject) => {
    request(app)
      .post(basePath+'/sessions')
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
  await request(app).post(basePath+'/users').send(admin);
  await request(app).post(basePath+'/users').send(manager);
  await request(app).post(basePath+'/users').send(customer);

  adminCookie = await login(admin);
  managerCookie = await login(manager);
  customerCookie = await login(customer);
//   await cleanup();
});




// After executing tests, clean up the database
afterAll( () => {
   cleanup();
});

// Group tests related to product routes
  test('It should return a 200 status and register a product arrival', async () => {
    await request(app)
      .post(routePath)
      .send(product)
      .set('Cookie', managerCookie)
      .expect(200);

      await request(app)
      .post(routePath)
      .send(product2)
      .set('Cookie', managerCookie)
      .expect(200);

    const products = await request(app)
      .get(`${routePath}`)
      .set('Cookie', adminCookie)
      .expect(200);

    const prod = products.body.find((p:ProductRes) => p.model === product.model);
    expect(prod).toBeDefined();
    expect(prod.category).toBe(product.category);
    expect(prod.quantity).toBe(product.quantity);
    expect(prod.details).toBe(product.details);
    expect(prod.sellingPrice).toBe(product.sellingPrice);
    expect(prod.arrivalDate).toBe(product.arrivalDate);
  });

  test('It should return a 401 status for unauthorized access', async () => {
    await request(app)
      .post(`${routePath}`)
      .send(product)
      .set('Cookie', customerCookie)
      .expect(401);

    const response = await request(app)
      .get(`${routePath}`)
      .set('Cookie', customerCookie)
      .expect(401);
  });

  test('It should return a 200 status and change product quantity', async () => {


    await request(app)
      .patch(`${routePath}/${product.model}`)
      .send({ quantity: 5 })
      .set('Cookie', managerCookie)
      .expect(200);

    const response = await request(app)
      .get(`${routePath}`)
      .set('Cookie', adminCookie)
      .expect(200);

    const prod = response.body.find((p:ProductRes) => p.model === product.model);
    expect(prod.quantity).toBe(product.quantity + 5);
  });

  test('It should return a 200 status and update the quantity after selling', async () => {
    const response0 = await request(app)
    .get(`${routePath}`)
    .set('Cookie', adminCookie)
    .expect(200);

    await request(app)
      .patch(`${routePath}/${product.model}/sell`)
      .send({ quantity: 5 })
      .set('Cookie', managerCookie)
      .expect(200);

    const response = await request(app)
      .get(`${routePath}`)
      .set('Cookie', adminCookie)
      .expect(200);

    const prod = response.body.find((p:ProductRes) => p.model === product.model);
    expect(prod.quantity).toBe(response0.body.find((p:ProductRes) => p.model === product.model).quantity- 5); // Since quantity was added and then 5 units were sold
  });

  test('It should return an array of products as per grouping query parameters', async () => {
    const response = await request(app)
      .get(`${routePath}`)
      .set('Cookie', adminCookie)
      .query({ grouping: "category", category: "Smartphone" })
      .expect(200);

    expect(response.body).toHaveLength(2);
    expect(response.body[0].category).toBe('Smartphone');
  });

  test('It should return a 200 status and get product details by model for an admin or manager', async () => {
 
  
    const response = await request(app)
          .get(`${routePath}`)
          .query({ grouping: "model", model: product.model })
          .set('Cookie', managerCookie)
          .expect(200);
  
      const retrievedProduct = response.body.find((p:ProductRes) => p.model === product.model);
      expect(retrievedProduct.model).toBe(product.model);
      expect(retrievedProduct.category).toBe(product.category);
      expect(retrievedProduct.quantity).toBe(product.quantity);
      expect(retrievedProduct.details).toBe(product.details);
      expect(retrievedProduct.sellingPrice).toBe(product.sellingPrice);
  });


  test('It should delete a product by model', async () => {
    await request(app)
      .delete(`${routePath}/${product.model}`)
      .set('Cookie', adminCookie)
      .expect(200);

    const response = await request(app)
      .get(`${routePath}`)
      .set('Cookie', adminCookie)
      .expect(200);

    const prod = response.body.find((p:ProductRes) => p.model === product.model);
    expect(prod).toBeUndefined();
  });


  test('It should return a 409 status if adding a product with a duplicate model', async () => {
    await request(app)
        .post(routePath)
        .send(product)
        .set('Cookie', managerCookie)
        .expect(200); // First addition should succeed

    await request(app)
        .post(routePath)
        .send(product)
        .set('Cookie', managerCookie)
        .expect(409); // Second addition should fail with a conflict error
});

test('It should return a 422 status if required fields are missing or invalid when adding a product', async () => {
    await request(app)
        .post(routePath)
        .send({ model: '', category: 'Smartphone', quantity: 10, details: 'Latest model', sellingPrice: 699 })
        .set('Cookie', managerCookie)
        .expect(422); // Missing model

    await request(app)
        .post(routePath)
        .send({ model: 'NewModel', category: '', quantity: 10, details: 'Latest model', sellingPrice: 699 })
        .set('Cookie', managerCookie)
        .expect(422); // Missing category

    await request(app)
        .post(routePath)
        .send({ model: 'NewModel', category: 'Smartphone', quantity: -5, details: 'Latest model', sellingPrice: 699 })
        .set('Cookie', managerCookie)
        .expect(422); // Invalid quantity
});



test('It should return a 404 status when getting details of a non-existent product model', async () => {
    await request(app)
        .get(`${routePath}/nonexistentmodel`)
        .set('Cookie', managerCookie)
        .expect(404);
});

// test('It should return a 404 status when getting details of a non-existent product model', async () => {
//   await request(app)
//     .get(`${routePath}`)
//     .query({ grouping: "model", model: "ciaone"})
//     .set('Cookie', managerCookie)
//     .expect(404);
// });