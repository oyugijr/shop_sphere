const productService = require('../../src/services/productService');
const productRepository = require('../../src/repositories/productRepository');

jest.mock('../../src/repositories/productRepository');

describe('Product Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllProducts', () => {
    it('should return all products', async () => {
      const mockProducts = [
        { _id: '1', name: 'Laptop', price: 999.99, stock: 10 },
        { _id: '2', name: 'Mouse', price: 29.99, stock: 50 }
      ];
      productRepository.findAll.mockResolvedValue(mockProducts);

      const result = await productService.getAllProducts();

      expect(productRepository.findAll).toHaveBeenCalled();
      expect(result).toEqual(mockProducts);
    });

    it('should return empty array if no products found', async () => {
      productRepository.findAll.mockResolvedValue([]);

      const result = await productService.getAllProducts();

      expect(result).toEqual([]);
    });

    it('should propagate repository errors', async () => {
      productRepository.findAll.mockRejectedValue(new Error('Database error'));

      await expect(productService.getAllProducts()).rejects.toThrow('Database error');
    });
  });

  describe('getProductById', () => {
    it('should return a product by id', async () => {
      const mockProduct = { _id: '1', name: 'Laptop', price: 999.99, stock: 10 };
      productRepository.findById.mockResolvedValue(mockProduct);

      const result = await productService.getProductById('1');

      expect(productRepository.findById).toHaveBeenCalledWith('1');
      expect(result).toEqual(mockProduct);
    });

    it('should return null if product not found', async () => {
      productRepository.findById.mockResolvedValue(null);

      const result = await productService.getProductById('nonexistent');

      expect(result).toBeNull();
    });

    it('should propagate repository errors', async () => {
      productRepository.findById.mockRejectedValue(new Error('Database error'));

      await expect(productService.getProductById('1')).rejects.toThrow('Database error');
    });
  });

  describe('createProduct', () => {
    it('should create a new product', async () => {
      const productData = {
        name: 'New Laptop',
        description: 'Gaming laptop',
        price: 1299.99,
        category: 'electronics',
        stock: 5
      };
      const mockCreatedProduct = { _id: '3', ...productData };
      productRepository.create.mockResolvedValue(mockCreatedProduct);

      const result = await productService.createProduct(productData);

      expect(productRepository.create).toHaveBeenCalledWith(productData);
      expect(result).toEqual(mockCreatedProduct);
    });

    it('should propagate repository errors', async () => {
      const productData = { name: 'Test', price: 100 };
      productRepository.create.mockRejectedValue(new Error('Validation error'));

      await expect(productService.createProduct(productData)).rejects.toThrow('Validation error');
    });
  });

  describe('updateProduct', () => {
    it('should update a product', async () => {
      const updateData = { price: 899.99, stock: 15 };
      const mockUpdatedProduct = { _id: '1', name: 'Laptop', ...updateData };
      productRepository.update.mockResolvedValue(mockUpdatedProduct);

      const result = await productService.updateProduct('1', updateData);

      expect(productRepository.update).toHaveBeenCalledWith('1', updateData);
      expect(result).toEqual(mockUpdatedProduct);
    });

    it('should return null if product not found', async () => {
      productRepository.update.mockResolvedValue(null);

      const result = await productService.updateProduct('nonexistent', { price: 100 });

      expect(result).toBeNull();
    });

    it('should propagate repository errors', async () => {
      productRepository.update.mockRejectedValue(new Error('Database error'));

      await expect(productService.updateProduct('1', { price: 100 })).rejects.toThrow('Database error');
    });
  });

  describe('deleteProduct', () => {
    it('should delete a product', async () => {
      const mockDeletedProduct = { _id: '1', name: 'Laptop', price: 999.99 };
      productRepository.remove.mockResolvedValue(mockDeletedProduct);

      const result = await productService.deleteProduct('1');

      expect(productRepository.remove).toHaveBeenCalledWith('1');
      expect(result).toEqual(mockDeletedProduct);
    });

    it('should return null if product not found', async () => {
      productRepository.remove.mockResolvedValue(null);

      const result = await productService.deleteProduct('nonexistent');

      expect(result).toBeNull();
    });

    it('should propagate repository errors', async () => {
      productRepository.remove.mockRejectedValue(new Error('Database error'));

      await expect(productService.deleteProduct('1')).rejects.toThrow('Database error');
    });
  });
});
