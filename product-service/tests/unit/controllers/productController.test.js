const productController = require('../../../src/controllers/product.controller');
const productService = require('../../../src/services/productService');

jest.mock('../../../src/services/productService');

describe('Product Controller', () => {
  let req, res;

  beforeEach(() => {
    req = {
      params: {},
      body: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    jest.clearAllMocks();
  });

  describe('getProducts', () => {
    it('should return all products', async () => {
      const mockProducts = [
        { _id: '1', name: 'Laptop', price: 999.99 },
        { _id: '2', name: 'Mouse', price: 29.99 }
      ];
      productService.getAllProducts.mockResolvedValue(mockProducts);

      await productController.getProducts(req, res);

      expect(productService.getAllProducts).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(mockProducts);
    });

    it('should handle errors', async () => {
      productService.getAllProducts.mockRejectedValue(new Error('Database error'));

      await productController.getProducts(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Server error' });
    });
  });

  describe('getProduct', () => {
    it('should return a single product', async () => {
      const mockProduct = { _id: '1', name: 'Laptop', price: 999.99 };
      req.params.id = '1';
      productService.getProductById.mockResolvedValue(mockProduct);

      await productController.getProduct(req, res);

      expect(productService.getProductById).toHaveBeenCalledWith('1');
      expect(res.json).toHaveBeenCalledWith(mockProduct);
    });

    it('should return 404 if product not found', async () => {
      req.params.id = 'nonexistent';
      productService.getProductById.mockResolvedValue(null);

      await productController.getProduct(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Product not found' });
    });

    it('should handle errors', async () => {
      req.params.id = '1';
      productService.getProductById.mockRejectedValue(new Error('Database error'));

      await productController.getProduct(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Server error' });
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

      await productController.createProduct(req, res);

      expect(productService.createProduct).toHaveBeenCalledWith(productData);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(mockCreatedProduct);
    });

    it('should handle errors', async () => {
      req.body = {};
      productService.createProduct.mockRejectedValue(new Error('Validation error'));

      await productController.createProduct(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Server error' });
    });
  });

  describe('updateProduct', () => {
    it('should update a product', async () => {
      const updateData = { price: 899.99 };
      const mockUpdatedProduct = { _id: '1', name: 'Laptop', ...updateData };

      req.params.id = '1';
      req.body = updateData;
      productService.updateProduct.mockResolvedValue(mockUpdatedProduct);

      await productController.updateProduct(req, res);

      expect(productService.updateProduct).toHaveBeenCalledWith('1', updateData);
      expect(res.json).toHaveBeenCalledWith(mockUpdatedProduct);
    });

    it('should return 404 if product not found', async () => {
      req.params.id = 'nonexistent';
      req.body = { price: 100 };
      productService.updateProduct.mockResolvedValue(null);

      await productController.updateProduct(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Product not found' });
    });

    it('should handle errors', async () => {
      req.params.id = '1';
      req.body = {};
      productService.updateProduct.mockRejectedValue(new Error('Database error'));

      await productController.updateProduct(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Server error' });
    });
  });

  describe('deleteProduct', () => {
    it('should delete a product', async () => {
      const mockDeletedProduct = { _id: '1', name: 'Laptop' };
      req.params.id = '1';
      productService.deleteProduct.mockResolvedValue(mockDeletedProduct);

      await productController.deleteProduct(req, res);

      expect(productService.deleteProduct).toHaveBeenCalledWith('1');
      expect(res.json).toHaveBeenCalledWith({ message: 'Product deleted successfully' });
    });

    it('should return 404 if product not found', async () => {
      req.params.id = 'nonexistent';
      productService.deleteProduct.mockResolvedValue(null);

      await productController.deleteProduct(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Product not found' });
    });

    it('should handle errors', async () => {
      req.params.id = '1';
      productService.deleteProduct.mockRejectedValue(new Error('Database error'));

      await productController.deleteProduct(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Server error' });
    });
  });
});
