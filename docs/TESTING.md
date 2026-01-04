# ShopSphere Testing Guide

This guide covers testing strategies, best practices, and how to write and run tests for ShopSphere.

## Table of Contents

1. [Testing Strategy](#testing-strategy)
2. [Test Setup](#test-setup)
3. [Unit Testing](#unit-testing)
4. [Integration Testing](#integration-testing)
5. [End-to-End Testing](#end-to-end-testing)
6. [API Testing](#api-testing)
7. [Test Coverage](#test-coverage)
8. [Continuous Integration](#continuous-integration)
9. [Best Practices](#best-practices)

---

## Testing Strategy

ShopSphere follows a comprehensive testing pyramid:

```sh
         /\
        /E2E\           <- End-to-End Tests (Few)
       /------\
      /        \
     /Integration\      <- Integration Tests (Some)
    /------------\
   /              \
  /   Unit Tests   \    <- Unit Tests (Many)
 /------------------\
```

### Test Types

| Type | Purpose | Tool | Coverage Goal |
| --- | --- | --- | --- |
| **Unit** | Test individual functions/methods | Jest | 70%+ |
| **Integration** | Test API endpoints and services | Jest + Supertest | 60%+ |
| **E2E** | Test complete user flows | Cypress/Playwright | Critical paths |
| **Load** | Test performance under load | k6/Artillery | Key endpoints |

---

## Test Setup

### Install Testing Dependencies

```bash
# Navigate to each service
cd user-service

# Install test dependencies
npm install --save-dev \
  jest \
  supertest \
  mongodb-memory-server \
  @faker-js/faker \
  eslint-plugin-jest
```

### Jest Configuration

Create `jest.config.js` in each service:

```javascript
module.exports = {
  testEnvironment: 'node',
  coveragePathIgnorePatterns: ['/node_modules/'],
  testMatch: ['**/__tests__/**/*.js', '**/?(*.)+(spec|test).js'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.test.js',
    '!src/**/__tests__/**',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  testTimeout: 10000,
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
};
```

### Test Setup File

Create `tests/setup.js`:

```javascript
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

// Setup before all tests
beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
});

// Cleanup after all tests
afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

// Clear database between tests
afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany();
  }
});

// Increase test timeout for async operations
jest.setTimeout(10000);
```

### Update package.json

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:verbose": "jest --verbose"
  }
}
```

---

## Unit Testing

### Testing Models

**User Model Test (`tests/models/User.test.js`):**

```javascript
const User = require('../../src/models/User');

describe('User Model', () => {
  describe('Validation', () => {
    it('should create a valid user', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'hashedPassword123',
        role: 'user',
      };

      const user = new User(userData);
      const savedUser = await user.save();

      expect(savedUser._id).toBeDefined();
      expect(savedUser.name).toBe(userData.name);
      expect(savedUser.email).toBe(userData.email);
      expect(savedUser.role).toBe('user');
    });

    it('should fail without required fields', async () => {
      const user = new User({});

      let error;
      try {
        await user.save();
      } catch (err) {
        error = err;
      }

      expect(error).toBeDefined();
      expect(error.errors.name).toBeDefined();
      expect(error.errors.email).toBeDefined();
      expect(error.errors.password).toBeDefined();
    });

    it('should fail with invalid email', async () => {
      const user = new User({
        name: 'John Doe',
        email: 'invalid-email',
        password: 'password123',
      });

      let error;
      try {
        await user.save();
      } catch (err) {
        error = err;
      }

      expect(error).toBeDefined();
      expect(error.errors.email).toBeDefined();
    });

    it('should fail with duplicate email', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
      };

      await User.create(userData);

      let error;
      try {
        await User.create(userData);
      } catch (err) {
        error = err;
      }

      expect(error).toBeDefined();
      expect(error.code).toBe(11000); // MongoDB duplicate key error
    });

    it('should default role to user', async () => {
      const user = new User({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
      });

      const savedUser = await user.save();
      expect(savedUser.role).toBe('user');
    });
  });

  describe('Timestamps', () => {
    it('should have createdAt and updatedAt', async () => {
      const user = await User.create({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
      });

      expect(user.createdAt).toBeDefined();
      expect(user.updatedAt).toBeDefined();
      expect(user.createdAt).toEqual(user.updatedAt);
    });

    it('should update updatedAt on modification', async () => {
      const user = await User.create({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
      });

      const originalUpdatedAt = user.updatedAt;

      // Wait a bit and update
      await new Promise((resolve) => setTimeout(resolve, 10));
      user.name = 'Jane Doe';
      await user.save();

      expect(user.updatedAt).not.toEqual(originalUpdatedAt);
    });
  });
});
```

### Testing Services

**Auth Service Test (`tests/services/authService.test.js`):**

```javascript
const authService = require('../../src/services/authService');
const User = require('../../src/models/User');
const bcrypt = require('bcryptjs');

jest.mock('bcryptjs');

describe('Auth Service', () => {
  describe('register', () => {
    it('should register a new user', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
      };

      bcrypt.hash.mockResolvedValue('hashedPassword');

      const result = await authService.register(userData);

      expect(result.user).toBeDefined();
      expect(result.user.email).toBe(userData.email);
      expect(result.token).toBeDefined();
    });

    it('should throw error for existing email', async () => {
      await User.create({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'hashedPassword',
      });

      await expect(
        authService.register({
          name: 'Jane Doe',
          email: 'john@example.com',
          password: 'password123',
        })
      ).rejects.toThrow('Email already exists');
    });
  });

  describe('login', () => {
    beforeEach(async () => {
      bcrypt.hash.mockResolvedValue('hashedPassword');
      await User.create({
        name: 'John Doe',
        email: 'john@example.com',
        password: await bcrypt.hash('password123', 10),
      });
    });

    it('should login with valid credentials', async () => {
      bcrypt.compare.mockResolvedValue(true);

      const result = await authService.login({
        email: 'john@example.com',
        password: 'password123',
      });

      expect(result.user).toBeDefined();
      expect(result.token).toBeDefined();
    });

    it('should fail with invalid email', async () => {
      await expect(
        authService.login({
          email: 'nonexistent@example.com',
          password: 'password123',
        })
      ).rejects.toThrow('Invalid credentials');
    });

    it('should fail with invalid password', async () => {
      bcrypt.compare.mockResolvedValue(false);

      await expect(
        authService.login({
          email: 'john@example.com',
          password: 'wrong-password',
        })
      ).rejects.toThrow('Invalid credentials');
    });
  });
});
```

### Testing Utilities

**Password Hashing Test (`tests/utils/hashPassword.test.js`):**

```javascript
const { hashPassword, comparePassword } = require('../../src/utils/hashPassword');

describe('Password Utilities', () => {
  describe('hashPassword', () => {
    it('should hash a password', async () => {
      const password = 'testPassword123';
      const hashed = await hashPassword(password);

      expect(hashed).toBeDefined();
      expect(hashed).not.toBe(password);
      expect(hashed.length).toBeGreaterThan(0);
    });

    it('should generate different hashes for same password', async () => {
      const password = 'testPassword123';
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('comparePassword', () => {
    it('should return true for matching password', async () => {
      const password = 'testPassword123';
      const hashed = await hashPassword(password);
      const isMatch = await comparePassword(password, hashed);

      expect(isMatch).toBe(true);
    });

    it('should return false for non-matching password', async () => {
      const password = 'testPassword123';
      const wrongPassword = 'wrongPassword';
      const hashed = await hashPassword(password);
      const isMatch = await comparePassword(wrongPassword, hashed);

      expect(isMatch).toBe(false);
    });
  });
});
```

---

## Integration Testing

### Testing API Endpoints

**Auth Routes Test (`tests/integration/auth.test.js`):**

```javascript
const request = require('supertest');
const app = require('../../app');
const User = require('../../src/models/User');

describe('Auth API', () => {
  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'John Doe',
          email: 'john@example.com',
          password: 'password123',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.user.email).toBe('john@example.com');
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.user.password).toBeUndefined(); // Should not return password
    });

    it('should return 400 for missing fields', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'john@example.com',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return 400 for invalid email', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'John Doe',
          email: 'invalid-email',
          password: 'password123',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return 400 for duplicate email', async () => {
      // Create first user
      await request(app).post('/api/auth/register').send({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
      });

      // Try to create duplicate
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Jane Doe',
          email: 'john@example.com',
          password: 'password456',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await request(app).post('/api/auth/register').send({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
      });
    });

    it('should login with valid credentials', async () => {
      const response = await request(app).post('/api/auth/login').send({
        email: 'john@example.com',
        password: 'password123',
      });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBeDefined();
    });

    it('should return 401 for invalid email', async () => {
      const response = await request(app).post('/api/auth/login').send({
        email: 'nonexistent@example.com',
        password: 'password123',
      });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should return 401 for invalid password', async () => {
      const response = await request(app).post('/api/auth/login').send({
        email: 'john@example.com',
        password: 'wrong-password',
      });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });
});
```

**Product Routes Test (`tests/integration/products.test.js`):**

```javascript
const request = require('supertest');
const app = require('../../app');
const Product = require('../../src/models/Product');

describe('Product API', () => {
  let authToken;

  beforeEach(async () => {
    // Register and login to get token
    const response = await request(app).post('/api/auth/register').send({
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'password123',
      role: 'admin',
    });
    authToken = response.body.data.token;
  });

  describe('POST /api/products', () => {
    it('should create a product with auth', async () => {
      const response = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Product',
          description: 'Test Description',
          price: 29.99,
          category: 'electronics',
          stock: 100,
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Test Product');
    });

    it('should return 401 without auth', async () => {
      const response = await request(app).post('/api/products').send({
        name: 'Test Product',
        price: 29.99,
      });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/products', () => {
    beforeEach(async () => {
      await Product.create([
        {
          name: 'Product 1',
          description: 'Description 1',
          price: 19.99,
          category: 'electronics',
          stock: 50,
        },
        {
          name: 'Product 2',
          description: 'Description 2',
          price: 29.99,
          category: 'clothing',
          stock: 30,
        },
      ]);
    });

    it('should get all products', async () => {
      const response = await request(app).get('/api/products');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBe(2);
    });

    it('should filter by category', async () => {
      const response = await request(app).get('/api/products?category=electronics');

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].category).toBe('electronics');
    });

    it('should support pagination', async () => {
      const response = await request(app).get('/api/products?page=1&limit=1');

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(1);
    });
  });
});
```

---

## End-to-End Testing

### Cypress Setup

**Install Cypress:**

```bash
npm install --save-dev cypress

# Open Cypress
npx cypress open
```

**Cypress Configuration (`cypress.config.js`):**

```javascript
const { defineConfig } = require('cypress');

module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    supportFile: 'cypress/support/e2e.js',
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
  },
});
```

**User Registration Flow Test:**

```javascript
// cypress/e2e/user-registration.cy.js
describe('User Registration', () => {
  it('should register a new user successfully', () => {
    cy.visit('/register');
    
    cy.get('[data-testid="name-input"]').type('John Doe');
    cy.get('[data-testid="email-input"]').type('john@example.com');
    cy.get('[data-testid="password-input"]').type('password123');
    cy.get('[data-testid="submit-button"]').click();
    
    cy.url().should('include', '/dashboard');
    cy.contains('Welcome, John Doe');
  });

  it('should show validation errors', () => {
    cy.visit('/register');
    
    cy.get('[data-testid="submit-button"]').click();
    
    cy.contains('Name is required');
    cy.contains('Email is required');
    cy.contains('Password is required');
  });
});
```

**Complete Shopping Flow Test:**

```javascript
// cypress/e2e/shopping-flow.cy.js
describe('Complete Shopping Flow', () => {
  beforeEach(() => {
    // Login
    cy.request('POST', '/api/auth/login', {
      email: 'user@example.com',
      password: 'password123',
    }).then((response) => {
      window.localStorage.setItem('token', response.body.data.token);
    });
  });

  it('should complete a purchase', () => {
    // Browse products
    cy.visit('/products');
    cy.contains('Products').should('be.visible');
    
    // Add product to cart
    cy.get('[data-testid="product-card"]').first().click();
    cy.get('[data-testid="add-to-cart"]').click();
    cy.contains('Added to cart');
    
    // Go to cart
    cy.get('[data-testid="cart-icon"]').click();
    cy.url().should('include', '/cart');
    
    // Proceed to checkout
    cy.get('[data-testid="checkout-button"]').click();
    
    // Fill shipping information
    cy.get('[data-testid="address-input"]').type('123 Main St');
    cy.get('[data-testid="city-input"]').type('New York');
    cy.get('[data-testid="zipcode-input"]').type('10001');
    
    // Complete order
    cy.get('[data-testid="place-order"]').click();
    
    // Verify success
    cy.contains('Order placed successfully');
    cy.url().should('include', '/orders');
  });
});
```

---

## API Testing

### Using REST Client

Create `.http` files for API testing:

```http
### Register User
POST http://localhost:3000/api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}

### Login
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}

### Get Products (with auth)
GET http://localhost:3000/api/products
Authorization: Bearer {{token}}

### Create Product
POST http://localhost:3000/api/products
Content-Type: application/json
Authorization: Bearer {{token}}

{
  "name": "Test Product",
  "description": "Test Description",
  "price": 29.99,
  "category": "electronics",
  "stock": 100
}
```

---

## Test Coverage

### Generate Coverage Reports

```bash
# Run tests with coverage
npm run test:coverage

# View HTML report
open coverage/lcov-report/index.html
```

### Coverage Configuration

```javascript
// jest.config.js
module.exports = {
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
    './src/services/': {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};
```

---

## Continuous Integration

### GitHub Actions Workflow

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      mongodb:
        image: mongo:latest
        ports:
          - 27017:27017
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '16'
      
      - name: Install dependencies
        run: |
          cd user-service && npm ci
          cd ../product-service && npm ci
          cd ../order-service && npm ci
      
      - name: Run tests
        run: |
          cd user-service && npm test
          cd ../product-service && npm test
          cd ../order-service && npm test
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./user-service/coverage/lcov.info,./product-service/coverage/lcov.info
```

---

## Best Practices

### 1. Test Organization

```sh
tests/
├── unit/
│   ├── models/
│   ├── services/
│   └── utils/
├── integration/
│   ├── auth.test.js
│   ├── products.test.js
│   └── orders.test.js
└── e2e/
    └── shopping-flow.test.js
```

### 2. Test Naming

```javascript
// Good: Descriptive test names
describe('User Service', () => {
  describe('register', () => {
    it('should create a new user with valid data', () => {});
    it('should throw error when email already exists', () => {});
    it('should hash password before saving', () => {});
  });
});

// Bad: Vague test names
describe('User Service', () => {
  it('works', () => {});
  it('test2', () => {});
});
```

### 3. Test Data Management

```javascript
// Use factories or fixtures
const { faker } = require('@faker-js/faker');

const createUser = (overrides = {}) => ({
  name: faker.person.fullName(),
  email: faker.internet.email(),
  password: faker.internet.password(),
  ...overrides,
});

// Usage
const user = createUser({ email: 'specific@example.com' });
```

### 4. Avoid Test Interdependence

```javascript
// ❌ Bad: Tests depend on each other
let userId;
it('should create user', () => {
  userId = user.id;
});
it('should update user', () => {
  updateUser(userId); // Depends on previous test
});

// ✅ Good: Tests are independent
it('should update user', () => {
  const user = await createUser();
  updateUser(user.id);
});
```

### 5. Mock External Dependencies

```javascript
// Mock external API calls
jest.mock('axios');
axios.get.mockResolvedValue({ data: { success: true } });

// Mock email service
jest.mock('../../src/services/emailService');
emailService.send.mockResolvedValue(true);
```

---

## Running Tests

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage

# Specific test file
npm test -- auth.test.js

# Verbose output
npm run test:verbose
```

---

## Additional Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [Cypress Documentation](https://docs.cypress.io/)
- [Testing Best Practices](https://testingjavascript.com/)

---

**Need help with testing?** Check the [Contributing Guide](../CONTRIBUTING.md) or open an issue on GitHub.
