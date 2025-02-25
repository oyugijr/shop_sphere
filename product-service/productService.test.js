const productService = require("../src/services/productService");
const productRepository = require("../src/repositories/productRepository");

jest.mock("../src/repositories/productRepository");

describe("Product Service Tests", () => {
  it("should return all products", async () => {
    const mockProducts = [{ name: "Laptop" }, { name: "Phone" }];
    productRepository.findAll.mockResolvedValue(mockProducts);
    
    const products = await productService.getAllProducts();
    expect(products).toEqual(mockProducts);
  });

  it("should return a single product", async () => {
    const mockProduct = { name: "Laptop" };
    productRepository.findById.mockResolvedValue(mockProduct);
    
    const product = await productService.getProductById("123");
    expect(product).toEqual(mockProduct);
  });
});
