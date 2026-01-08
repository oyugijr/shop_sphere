const productController = require('../../../src/controllers/product.controller');
const productService = require('../../../src/services/productService');
const { ValidationError, NotFoundError } = require('../../../src/utils/errorHandler');

jest.mock('../../../src/services/productService');

const VALID_ID = '507f1f77bcf86cd799439011';
const flushPromises = () => new Promise(setImmediate);

describe('Product Controller', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      params: {},
      body: {},
      query: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('getProducts', () => {
    it('should return all products', async () => {
      req.query = { page: '1', limit: '10' };
      const mockResult = {
        products: [
          { _id: VALID_ID, name: 'Laptop', price: 999.99 },
          { _id: '507f1f77bcf86cd799439012', name: 'Mouse', price: 29.99 }
        ],
        pagination: { page: 1, limit: 10, total: 2 }
      };
      productService.getAllProducts.mockResolvedValue(mockResult);

      await productController.getProducts(req, res, next);

      expect(productService.getAllProducts).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockResult);
      expect(next).not.toHaveBeenCalled();
    });

    it('should forward errors to next middleware', async () => {
      req.query = { page: '1', limit: '10' };
      const error = new Error('Database error');
      productService.getAllProducts.mockRejectedValue(error);

      await productController.getProducts(req, res, next);
      await flushPromises();

      expect(next).toHaveBeenCalledWith(error);
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe('getProduct', () => {
    it('should return a single product', async () => {
      const mockProduct = { _id: VALID_ID, name: 'Laptop', price: 999.99 };
      req.params.id = VALID_ID;
      productService.getProductById.mockResolvedValue(mockProduct);

      await productController.getProduct(req, res, next);

      expect(productService.getProductById).toHaveBeenCalledWith(VALID_ID);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockProduct);
      expect(next).not.toHaveBeenCalled();
    });

    it('should forward not found errors', async () => {
      req.params.id = VALID_ID;
      const error = new NotFoundError('Product');
      productService.getProductById.mockRejectedValue(error);

      await productController.getProduct(req, res, next);
      await flushPromises();

      expect(next).toHaveBeenCalledWith(error);
    });

    it('should handle errors', async () => {
      req.params.id = VALID_ID;
      const error = new Error('Database error');
      productService.getProductById.mockRejectedValue(error);

      await productController.getProduct(req, res, next);
      await flushPromises();

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('createProduct', () => {
    it('should create a new product', async () => {
      const productData = {
        name: 'New Laptop',
        price: 1299.99,
        description: 'Gaming laptop',
        category: 'electronics',
        stock: 5
      };
      const mockCreatedProduct = { _id: '3', ...productData };

      req.body = productData;
      productService.createProduct.mockResolvedValue(mockCreatedProduct);

      await productController.createProduct(req, res, next);

      expect(productService.createProduct).toHaveBeenCalledWith(productData);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Product created successfully',
        product: mockCreatedProduct
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should throw validation error for invalid payload', async () => {
      req.body = {};

      await productController.createProduct(req, res, next);
      await flushPromises();

      expect(productService.createProduct).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
      const error = next.mock.calls[0][0];
      expect(error).toBeInstanceOf(ValidationError);
    });

    it('should forward service errors', async () => {
      const productData = {
        name: 'Laptop',
        description: 'Gaming laptop',
        price: 1299.99,
        category: 'electronics',
        stock: 5
      };
      req.body = productData;
      const error = new Error('Database error');
      productService.createProduct.mockRejectedValue(error);

      await productController.createProduct(req, res, next);
      await flushPromises();

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('updateProduct', () => {
    it('should update a product', async () => {
      const updateData = { price: 899.99 };
      const mockUpdatedProduct = { _id: VALID_ID, name: 'Laptop', ...updateData };

      req.params.id = VALID_ID;
      req.body = updateData;
      productService.updateProduct.mockResolvedValue(mockUpdatedProduct);

      await productController.updateProduct(req, res, next);

      expect(productService.updateProduct).toHaveBeenCalledWith(VALID_ID, updateData);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Product updated successfully',
        product: mockUpdatedProduct
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should forward not found errors', async () => {
      req.params.id = VALID_ID;
      req.body = { price: 100 };
      const error = new NotFoundError('Product');
      productService.updateProduct.mockRejectedValue(error);

      await productController.updateProduct(req, res, next);
      await flushPromises();

      expect(next).toHaveBeenCalledWith(error);
    });

    it('should handle errors', async () => {
      req.params.id = VALID_ID;
      req.body = { price: 100 };
      const error = new Error('Database error');
      productService.updateProduct.mockRejectedValue(error);

      await productController.updateProduct(req, res, next);
      await flushPromises();

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('deleteProduct', () => {
    it('should delete a product', async () => {
      const mockDeletedProduct = { _id: VALID_ID, name: 'Laptop' };
      req.params.id = VALID_ID;
      productService.deleteProduct.mockResolvedValue(mockDeletedProduct);

      await productController.deleteProduct(req, res, next);

      expect(productService.deleteProduct).toHaveBeenCalledWith(VALID_ID);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Product deleted successfully',
        product: mockDeletedProduct
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should forward not found errors', async () => {
      req.params.id = VALID_ID;
      const error = new NotFoundError('Product');
      productService.deleteProduct.mockRejectedValue(error);

      await productController.deleteProduct(req, res, next);
      await flushPromises();

      expect(next).toHaveBeenCalledWith(error);
    });

    it('should handle errors', async () => {
      req.params.id = VALID_ID;
      const error = new Error('Database error');
      productService.deleteProduct.mockRejectedValue(error);

      await productController.deleteProduct(req, res, next);
      await flushPromises();

      expect(next).toHaveBeenCalledWith(error);
    });
  });
});
