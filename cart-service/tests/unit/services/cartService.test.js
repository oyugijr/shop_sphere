const cartService = require("../../../src/services/cartService");
const cartRepository = require("../../../src/repositories/cartRepository");
const { validateProduct } = require("../../../src/utils/productValidator");

// Mock dependencies
jest.mock("../../../src/repositories/cartRepository");
jest.mock("../../../src/utils/productValidator");

describe("Cart Service Unit Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getCart", () => {
    it("should return user cart if exists", async () => {
      const userId = "507f1f77bcf86cd799439011";
      const mockCart = {
        userId,
        items: [
          {
            productId: "prod1",
            name: "Laptop",
            price: 999.99,
            quantity: 2,
            subtotal: 1999.98,
          },
        ],
        totalPrice: 1999.98,
        totalItems: 2,
      };

      cartRepository.findByUserId.mockResolvedValue(mockCart);

      const result = await cartService.getCart(userId);

      expect(cartRepository.findByUserId).toHaveBeenCalledWith(userId);
      expect(result).toEqual(mockCart);
    });

    it("should create empty cart if none exists", async () => {
      const userId = "507f1f77bcf86cd799439012";
      const emptyCart = {
        userId,
        items: [],
        totalPrice: 0,
        totalItems: 0,
      };

      cartRepository.findByUserId.mockResolvedValue(null);
      cartRepository.create.mockResolvedValue(emptyCart);

      const result = await cartService.getCart(userId);

      expect(cartRepository.create).toHaveBeenCalledWith({
        userId,
        items: [],
        totalPrice: 0,
        totalItems: 0,
      });
      expect(result).toEqual(emptyCart);
    });

    it("should throw error if userId is missing", async () => {
      await expect(cartService.getCart(null)).rejects.toThrow("User ID is required");
    });
  });

  describe("addToCart", () => {
    it("should add item to cart successfully", async () => {
      const userId = "507f1f77bcf86cd799439011";
      const productId = "prod1";
      const quantity = 2;
      const price = 999.99;
      const name = "Laptop";

      const mockCart = {
        userId,
        items: [{ productId, name, price, quantity, subtotal: 1999.98 }],
        totalPrice: 1999.98,
        totalItems: 2,
      };

      validateProduct.mockResolvedValue({ _id: productId, name, price, stock: 10 });
      cartRepository.addOrUpdateItem.mockResolvedValue(mockCart);

      const result = await cartService.addToCart(userId, productId, quantity);

      expect(validateProduct).toHaveBeenCalledWith(productId, quantity);
      expect(cartRepository.addOrUpdateItem).toHaveBeenCalledWith(userId, {
        productId,
        name,
        price,
        quantity,
        subtotal: 1999.98,
      });
      expect(result).toEqual(mockCart);
    });

    it("should throw error if userId is missing", async () => {
      await expect(cartService.addToCart(null, "prod1", 1)).rejects.toThrow(
        "User ID is required"
      );
    });

    it("should throw error if productId is missing", async () => {
      await expect(cartService.addToCart("user1", null, 1)).rejects.toThrow(
        "Product ID is required"
      );
    });

    it("should throw error if quantity is invalid", async () => {
      await expect(cartService.addToCart("user1", "prod1", 0)).rejects.toThrow(
        "Quantity must be at least 1"
      );

      await expect(cartService.addToCart("user1", "prod1", 1.5)).rejects.toThrow(
        "Quantity must be an integer"
      );
    });

    it("should throw error when product name is unavailable", async () => {
      validateProduct.mockResolvedValue({ _id: "prod1", name: "", price: 10, stock: 5 });

      await expect(cartService.addToCart("user1", "prod1", 1)).rejects.toThrow(
        "Product name is unavailable"
      );
    });

    it("should throw error when product price is invalid", async () => {
      validateProduct.mockResolvedValue({ _id: "prod1", name: "Laptop", price: 0, stock: 5 });

      await expect(cartService.addToCart("user1", "prod1", 1)).rejects.toThrow(
        "Product price is invalid"
      );
    });

    it("should propagate product validation errors", async () => {
      validateProduct.mockRejectedValue(new Error("Product not found"));

      await expect(cartService.addToCart("user1", "prod1", 1)).rejects.toThrow(
        "Product not found"
      );
    });
  });

  describe("updateQuantity", () => {
    it("should update item quantity successfully", async () => {
      const userId = "507f1f77bcf86cd799439011";
      const productId = "prod1";
      const quantity = 5;

      const mockCart = {
        userId,
        items: [{ productId, name: "Laptop", price: 999.99, quantity: 5, subtotal: 4999.95 }],
        totalPrice: 4999.95,
        totalItems: 5,
      };

      validateProduct.mockResolvedValue({ _id: productId, stock: 10 });
      cartRepository.updateItemQuantity.mockResolvedValue(mockCart);

      const result = await cartService.updateQuantity(userId, productId, quantity);

      expect(validateProduct).toHaveBeenCalledWith(productId, quantity);
      expect(cartRepository.updateItemQuantity).toHaveBeenCalledWith(userId, productId, quantity);
      expect(result).toEqual(mockCart);
    });

    it("should remove item if quantity is 0", async () => {
      const userId = "507f1f77bcf86cd799439011";
      const productId = "prod1";

      const mockCart = {
        userId,
        items: [],
        totalPrice: 0,
        totalItems: 0,
      };

      cartRepository.removeItem.mockResolvedValue(mockCart);

      const result = await cartService.updateQuantity(userId, productId, 0);

      expect(cartRepository.removeItem).toHaveBeenCalledWith(userId, productId);
      expect(result).toEqual(mockCart);
    });

    it("should throw error if quantity is negative", async () => {
      await expect(
        cartService.updateQuantity("user1", "prod1", -1)
      ).rejects.toThrow("Quantity cannot be negative");
    });

    it("should throw error if quantity is not an integer", async () => {
      await expect(
        cartService.updateQuantity("user1", "prod1", 1.5)
      ).rejects.toThrow("Quantity must be an integer");
    });

    it("should throw error if cart or item not found", async () => {
      validateProduct.mockResolvedValue({ _id: "prod1", stock: 10 });
      cartRepository.updateItemQuantity.mockResolvedValue(null);

      await expect(
        cartService.updateQuantity("user1", "prod1", 5)
      ).rejects.toThrow("Cart or item not found");
    });
  });

  describe("removeFromCart", () => {
    it("should remove item from cart successfully", async () => {
      const userId = "507f1f77bcf86cd799439011";
      const productId = "prod1";

      const mockCart = {
        userId,
        items: [],
        totalPrice: 0,
        totalItems: 0,
      };

      cartRepository.removeItem.mockResolvedValue(mockCart);

      const result = await cartService.removeFromCart(userId, productId);

      expect(cartRepository.removeItem).toHaveBeenCalledWith(userId, productId);
      expect(result).toEqual(mockCart);
    });

    it("should throw error if userId is missing", async () => {
      await expect(cartService.removeFromCart(null, "prod1")).rejects.toThrow(
        "User ID is required"
      );
    });

    it("should throw error if productId is missing", async () => {
      await expect(cartService.removeFromCart("user1", null)).rejects.toThrow(
        "Product ID is required"
      );
    });

    it("should throw error if cart not found", async () => {
      cartRepository.removeItem.mockResolvedValue(null);

      await expect(cartService.removeFromCart("user1", "prod1")).rejects.toThrow(
        "Cart not found"
      );
    });
  });

  describe("clearCart", () => {
    it("should clear all items from cart successfully", async () => {
      const userId = "507f1f77bcf86cd799439011";

      const mockCart = {
        userId,
        items: [],
        totalPrice: 0,
        totalItems: 0,
      };

      cartRepository.clearCart.mockResolvedValue(mockCart);

      const result = await cartService.clearCart(userId);

      expect(cartRepository.clearCart).toHaveBeenCalledWith(userId);
      expect(result).toEqual(mockCart);
    });

    it("should throw error if userId is missing", async () => {
      await expect(cartService.clearCart(null)).rejects.toThrow("User ID is required");
    });

    it("should throw error if cart not found", async () => {
      cartRepository.clearCart.mockResolvedValue(null);

      await expect(cartService.clearCart("user1")).rejects.toThrow("Cart not found");
    });
  });
});
