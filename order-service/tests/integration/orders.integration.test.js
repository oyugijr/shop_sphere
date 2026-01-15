process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'integration_test_secret';
jest.setTimeout(120000);
process.env.MONGOMS_START_TIMEOUT = '120000';

jest.mock('../../src/utils/serviceClients', () => ({
  verifyProductStock: jest.fn(),
  updateProductStock: jest.fn(),
  getPaymentByOrderId: jest.fn()
}));

const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Order = require('../../src/models/Order');
const jwt = require('jsonwebtoken');
const { verifyProductStock } = require('../../src/utils/serviceClients');
const app = require('../../app');

const buildMockProducts = (items = []) =>
  items.map((item, index) => ({
    _id: item.productId || item.product || `mock-product-${index}`,
    stock: 100,
    name: item.name || `Mock Product ${index + 1}`,
    price: item.price || 100
  }));

const generateOrderNumber = () => `ORD-${Date.now()}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;

const buildOrderPayload = (overrides = {}) => ({
  user: overrides.user || new mongoose.Types.ObjectId(),
  items: overrides.items || [{
    product: new mongoose.Types.ObjectId(),
    quantity: 1,
    price: 100,
    name: 'Test Product',
    subtotal: 100
  }],
  totalPrice: overrides.totalPrice || 100,
  shippingAddress: overrides.shippingAddress || {
    fullName: 'John Doe',
    phoneNumber: '1234567890',
    street: '123 Main Street',
    city: 'New York',
    state: 'NY',
    zipCode: '10001',
    country: 'USA'
  },
  paymentStatus: overrides.paymentStatus || 'pending',
  status: overrides.status || 'pending',
  orderNumber: overrides.orderNumber || generateOrderNumber(),
  paymentMethod: overrides.paymentMethod || 'stripe'
});

let mongoServer;
let userToken;
let adminToken;
let userId;
let adminId;

describe('Order Service - Integration Tests (Real Database)', () => {
  beforeAll(async () => {
    // Start in-memory MongoDB with generous startup timeout for Windows/CI
    mongoServer = await MongoMemoryServer.create({
      instance: {
        dbName: 'orders-test',
        launchTimeout: 60000
      }
    });
    const mongoUri = mongoServer.getUri();

    // Connect to in-memory database
    await mongoose.disconnect();
    await mongoose.connect(mongoUri);

    // Create test user IDs
    userId = new mongoose.Types.ObjectId();
    adminId = new mongoose.Types.ObjectId();

    // Generate test tokens
    const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';
    userToken = jwt.sign({ id: userId.toString(), role: 'user' }, JWT_SECRET);
    adminToken = jwt.sign({ id: adminId.toString(), role: 'admin' }, JWT_SECRET);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    if (mongoServer) {
      await mongoServer.stop();
    }
  });

  beforeEach(async () => {
    verifyProductStock.mockReset();
    verifyProductStock.mockImplementation(async items => buildMockProducts(items));
    // Clean up database before each test
    await Order.deleteMany({});
  });

  describe('POST /api/orders - Create Order', () => {
    it('should create a new order with valid data', async () => {
      const orderData = {
        items: [
          {
            productId: new mongoose.Types.ObjectId().toString(),
            product: new mongoose.Types.ObjectId().toString(),
            quantity: 2,
            price: 99.99,
            name: 'Test Product'
          }
        ],
        totalPrice: 199.98,
        shippingAddress: {
          fullName: 'John Doe',
          phoneNumber: '1234567890',
          street: '123 Main Street',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          country: 'USA'
        },
        paymentMethod: 'stripe',
        notes: 'Please deliver in the morning'
      };

      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .send(orderData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('orderNumber');
      expect(response.body.data).toHaveProperty('_id');
      expect(response.body.data.user.toString()).toBe(userId.toString());
      expect(response.body.data.items).toHaveLength(1);
      expect(response.body.data.totalPrice).toBe(199.98);
      expect(response.body.data.status).toBe('pending');
      expect(response.body.data.paymentStatus).toBe('pending');
      expect(response.body.data.shippingAddress.fullName).toBe('John Doe');

      // Verify order was saved to database
      const savedOrder = await Order.findById(response.body.data._id);
      expect(savedOrder).toBeTruthy();
      expect(savedOrder.orderNumber).toMatch(/^ORD-\d+-\d{3}$/);
    });

    it('should reject order without authentication', async () => {
      const orderData = {
        items: [
          {
            productId: new mongoose.Types.ObjectId().toString(),
            quantity: 1,
            price: 50,
            name: 'Product'
          }
        ],
        totalPrice: 50,
        shippingAddress: {
          fullName: 'Jane Doe',
          phoneNumber: '9876543210',
          street: '456 Oak Avenue',
          city: 'Boston',
          state: 'MA',
          zipCode: '02101',
          country: 'USA'
        }
      };

      await request(app)
        .post('/api/orders')
        .send(orderData)
        .expect(401);
    });

    it('should reject order with missing items', async () => {
      const orderData = {
        items: [],
        totalPrice: 0,
        shippingAddress: {
          fullName: 'John Doe',
          phoneNumber: '1234567890',
          street: '123 Main Street',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          country: 'USA'
        }
      };

      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .send(orderData)
        .expect(400);

      expect(response.body.error).toBeTruthy();
    });

    it('should reject order with invalid shipping address', async () => {
      const orderData = {
        items: [
          {
            productId: new mongoose.Types.ObjectId().toString(),
            quantity: 1,
            price: 50,
            name: 'Product'
          }
        ],
        totalPrice: 50,
        shippingAddress: {
          fullName: 'J',
          phoneNumber: '123',
          street: '1st',
          city: 'N',
          state: 'N',
          zipCode: '1',
          country: 'U'
        }
      };

      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .send(orderData)
        .expect(400);

      expect(response.body.error).toBeTruthy();
    });
  });

  describe('GET /api/orders/:id - Get Order by ID', () => {
    let testOrder;

    beforeEach(async () => {
      testOrder = await Order.create(buildOrderPayload({ user: userId }));
    });

    it('should get order by ID for the order owner', async () => {
      const response = await request(app)
        .get(`/api/orders/${testOrder._id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data._id).toBe(testOrder._id.toString());
      expect(response.body.data.totalPrice).toBe(100);
    });

    it('should allow admin to get any order', async () => {
      const response = await request(app)
        .get(`/api/orders/${testOrder._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data._id).toBe(testOrder._id.toString());
    });

    it('should return 404 for non-existent order', async () => {
      const fakeId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .get(`/api/orders/${fakeId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(404);

      expect(response.body.error).toBeTruthy();
    });

    it('should reject access without authentication', async () => {
      await request(app)
        .get(`/api/orders/${testOrder._id}`)
        .expect(401);
    });
  });

  describe('GET /api/orders/my-orders - Get User Orders', () => {
    beforeEach(async () => {
      // Create multiple orders for the user
      await Order.create([
        buildOrderPayload({ user: userId, totalPrice: 50, status: 'pending', items: [{ product: new mongoose.Types.ObjectId(), quantity: 1, price: 50, name: 'Product 1', subtotal: 50 }] }),
        buildOrderPayload({ user: userId, totalPrice: 150, status: 'delivered', items: [{ product: new mongoose.Types.ObjectId(), quantity: 2, price: 75, name: 'Product 2', subtotal: 150 }] }),
        buildOrderPayload({
          user: new mongoose.Types.ObjectId(), totalPrice: 100, status: 'pending', items: [{ product: new mongoose.Types.ObjectId(), quantity: 1, price: 100, name: 'Product 3', subtotal: 100 }], shippingAddress: {
            fullName: 'Jane Smith',
            phoneNumber: '9876543210',
            street: '456 Oak Avenue',
            city: 'Boston',
            state: 'MA',
            zipCode: '02101',
            country: 'USA'
          }
        })
      ]);
    });

    it('should get all orders for authenticated user', async () => {
      const response = await request(app)
        .get('/api/orders/my-orders')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.pagination).toBeDefined();
      expect(response.body.pagination.total).toBe(2);

      // Verify only user's orders are returned
      response.body.data.forEach(order => {
        expect(order.user.toString()).toBe(userId.toString());
      });
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/orders/my-orders?page=1&limit=1')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(1);
      expect(response.body.pagination.pages).toBe(2);
    });

    it('should filter by status', async () => {
      const response = await request(app)
        .get('/api/orders/my-orders?status=delivered')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].status).toBe('delivered');
    });
  });

  describe('POST /api/orders/:id/cancel - Cancel Order', () => {
    let testOrder;

    beforeEach(async () => {
      testOrder = await Order.create(buildOrderPayload({ user: userId }));
    });

    it('should cancel order with valid reason', async () => {
      const response = await request(app)
        .post(`/api/orders/${testOrder._id}/cancel`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ reason: 'Changed my mind' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('cancelled');
      expect(response.body.data.cancelReason).toBe('Changed my mind');
      expect(response.body.data.cancelledAt).toBeDefined();

      // Verify in database
      const cancelledOrder = await Order.findById(testOrder._id);
      expect(cancelledOrder.status).toBe('cancelled');
      expect(cancelledOrder.history.length).toBeGreaterThan(1);
    });

    it('should reject cancellation without reason', async () => {
      await request(app)
        .post(`/api/orders/${testOrder._id}/cancel`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({})
        .expect(400);
    });
  });

  describe('PUT /api/orders/:id/status - Update Order Status (Admin)', () => {
    let testOrder;

    beforeEach(async () => {
      testOrder = await Order.create({
        user: userId,
        items: [{ product: new mongoose.Types.ObjectId(), quantity: 1, price: 100, name: 'Product', subtotal: 100 }],
        totalPrice: 100,
        shippingAddress: {
          fullName: 'John Doe',
          phoneNumber: '1234567890',
          street: '123 Main Street',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          country: 'USA'
        },
        status: 'pending'
      });
    });

    it('should update order status as admin', async () => {
      const response = await request(app)
        .put(`/api/orders/${testOrder._id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'shipped', note: 'Order shipped via FedEx' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('shipped');

      // Verify history was updated
      const updatedOrder = await Order.findById(testOrder._id);
      expect(updatedOrder.status).toBe('shipped');
      expect(updatedOrder.history.length).toBeGreaterThan(1);
      expect(updatedOrder.history.some(h => h.note === 'Order shipped via FedEx')).toBe(true);
    });

    it('should reject status update from non-admin', async () => {
      await request(app)
        .put(`/api/orders/${testOrder._id}/status`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ status: 'shipped' })
        .expect(403);
    });

    it('should reject invalid status', async () => {
      await request(app)
        .put(`/api/orders/${testOrder._id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'invalid_status' })
        .expect(400);
    });
  });

  describe('GET /api/orders/stats - Get Order Statistics', () => {
    beforeEach(async () => {
      await Order.create([
        buildOrderPayload({ user: userId, totalPrice: 100, status: 'pending' }),
        buildOrderPayload({ user: userId, totalPrice: 200, status: 'delivered' }),
        buildOrderPayload({ user: userId, totalPrice: 150, status: 'cancelled' })
      ]);
    });

    it('should get order statistics for user', async () => {
      const response = await request(app)
        .get('/api/orders/stats')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.totalOrders).toBe(3);
      expect(response.body.data.totalRevenue).toBe(450);
      expect(response.body.data.pendingOrders).toBe(1);
      expect(response.body.data.deliveredOrders).toBe(1);
      expect(response.body.data.cancelledOrders).toBe(1);
    });
  });

  describe('GET /health - Health Check', () => {
    it('should return healthy status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body.status).toBe('healthy');
      expect(response.body.service).toBe('order-service');
      expect(response.body.timestamp).toBeDefined();
      expect(response.body.uptime).toBeDefined();
    });
  });
});