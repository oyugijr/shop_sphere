# ShopSphere

This project is a microservices-based online store system, designed for scalability and ease of maintenance. Below is the project structure and an overview of each component:


## Overview of Each Component

- **`docker-compose.yml`**: This file is used to orchestrate all services within the project, allowing you to bring up the entire system with a single command.
  
- **`api-gateway/`**: This component acts as the entry point for all requests, handling routing, security (authentication, authorization), and load balancing.
  
- **`user-service/`**: Manages all user-related operations, including authentication, profile management, and user account data.
  
- **`product-service/`**: Responsible for handling products and inventory management, such as adding new products, updating stock, and querying product details.
  
- **`order-service/`**: Handles order processing, including placing orders, tracking their status, and managing customer order history.
  
- **`payment-service/`**: Ensures secure and reliable payment processing, supporting various payment methods (credit card, PayPal, etc.).
  
- **`notification-service/`**: Manages notifications such as email or push notifications for order updates, promotions, and user activity.
  
- **`shared-libs/`**: Contains shared libraries that are used across multiple services, such as data transfer objects (DTOs), utilities, and common functions.
  
- **`infra/`**: Contains infrastructure-related scripts for managing databases, monitoring, and other operations related to the deployment environment.
  
- **`docs/`**: Includes all project documentation, including API documentation, system architecture design, and setup guides.

---

## Getting Started

To get started with the project, clone this repository and run the following commands:

```bash
docker-compose up
```
