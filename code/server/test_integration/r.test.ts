import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import { app } from '../index';
import { cleanup } from '../src/db/cleanup';

// Base route path for the API
const basePath = "/ezelectronics";
const reviewRoutePath = basePath + '/reviews';
const productRoutePath = basePath + '/products';
const cartRoutePath = basePath + '/carts';


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

// Default review information to use in tests
const review = {
  score: 5,
  comment: 'Excellent product!',
};

// Cookies for the users. We use them to keep users logged in.
let adminCookie:string
let managerCookie:string
let customerCookie:string


// User roles
const admin = { username: 'adminr', name: "admin", surname: "admin", password: 'admin', role: 'Admin' };
const manager = { username: 'managerr', name: "manager", surname: "manager", password: 'manager', role: 'Manager' };
const customer = { username: 'customerr', name: "customer", surname: "customer", password: 'customer', role: 'Customer' };

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
  
  await request(app)
      .post(cartRoutePath)
      .send({ model: product.model })
      .set('Cookie', customerCookie)
      .expect(200);

  await request(app)
    .patch(cartRoutePath)
    .set('Cookie', customerCookie)
    .expect(200);


});

// After executing tests, clean up the database ERROR_JEST
afterAll( () => {
   cleanup();
});

// Tests for Review Routes

test('It should add a review to a product', async () => {
  await request(app)
    .post(`${reviewRoutePath}/${product.model}`)
    .send(review)
    .set('Cookie', customerCookie)
    .expect(200);

  const response = await request(app)
    .get(`${reviewRoutePath}/${product.model}`)
    .set('Cookie', customerCookie)
    .expect(200);

  const addedReview = response.body.find((r:any) => r.comment === review.comment);
  expect(addedReview).toBeDefined();
  expect(addedReview.score).toBe(review.score);
  expect(addedReview.comment).toBe(review.comment);
});

  test('It should return unauthorized for non-customer trying to add a review', async () => {
    await request(app)
      .post(`${reviewRoutePath}/${product.model}`)
      .send(review)
      .set('Cookie', adminCookie)
      .expect(401);
  });

  test('It should retrieve all reviews of a product', async () => {
    const response = await request(app)
      .get(`${reviewRoutePath}/${product.model}`)
      .set('Cookie', customerCookie)
      .expect(200);

    expect(response.body).toBeInstanceOf(Array);
    expect(response.body).toHaveLength(1);
    expect(response.body[0].comment).toBe(review.comment);
  });

  test('It should delete the review made by a user for one product', async () => {
    await request(app)
      .delete(`${reviewRoutePath}/${product.model}`)
      .set('Cookie', customerCookie)
      .expect(200);

    const response = await request(app)
      .get(`${reviewRoutePath}/${product.model}`)
      .set('Cookie', customerCookie)
      .expect(200);

    expect(response.body).toHaveLength(0);
  });

  test('It should delete all reviews of a product by admin', async () => {
    await request(app)
      .post(`${reviewRoutePath}/${product.model}`)
      .send(review)
      .set('Cookie', customerCookie)
      .expect(200);

    await request(app)
      .delete(`${reviewRoutePath}/${product.model}/all`)
      .set('Cookie', adminCookie)
      .expect(200);

    const response = await request(app)
      .get(`${reviewRoutePath}/${product.model}`)
      .set('Cookie', adminCookie)
      .expect(200);

    expect(response.body).toHaveLength(0);
  });

  test('It should delete all reviews of all products by admin', async () => {
    await request(app)
      .post(`${reviewRoutePath}/${product.model}`)
      .send(review)
      .set('Cookie', customerCookie)
      .expect(200);

    await request(app)
      .delete(`${reviewRoutePath}`)
      .set('Cookie', adminCookie)
      .expect(200);

    const response = await request(app)
      .get(`${reviewRoutePath}/${product.model}`)
      .set('Cookie', adminCookie)
      .expect(200);

    expect(response.body).toHaveLength(0);
  });

  test('It should return 401 for unauthorized user trying to delete reviews', async () => {
    await request(app)
      .delete(`${reviewRoutePath}/${product.model}`)
      .set('Cookie', managerCookie)
      .expect(401);


  });

  test('It should prevent reviews with invalid score', async () => {
    await request(app)
      .post(`${reviewRoutePath}/${product.model}`)
      .send({ score: 10, comment: review.comment })
      .set('Cookie', customerCookie)
      .expect(422);
  });

  test('It should prevent reviews with empty comment', async () => {
    await request(app)
      .post(`${reviewRoutePath}/${product.model}`)
      .send({ score: review.score, comment: '' })
      .set('Cookie', customerCookie)
      .expect(422);
  });