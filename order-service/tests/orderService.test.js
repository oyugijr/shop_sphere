const request = require("supertest");
const app = require("../src/app");

describe("Order Service API", () => {
  it("should create a new order", async () => {
    const response = await request(app)
      .post("/api/orders")
      .send({ products: [{ product: "12345", quantity: 2 }], totalPrice: 200 })
      .set("Authorization", "Bearer sampletoken");

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("user");
  });
});
