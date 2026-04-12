# CS4218 Project - Virtual Vault

## Team Workload

This project’s testing work was divided by component ownership and testing scope. Below is a summary of each member’s contributions.

### Brenna Lauren Tan
**Unit Tests (MS1)**

Source files tested & unit test files created
1. Order feature - Order.js (Orders.test.js)
2. Order feature - authController.js (order.authController.test.js)
3. Order feature - orderModel.js (orderModel.test.js)
4. Payment feature - productController.js (payment.brainTreePaymentController.test.js, payment.braintreeTokenController.test.js)

**Integration Tests (MS2)**
1. Braintree token generation (payment.braintreeTokenController.integration.test.js)
2. Payment processing -> order creation (payment.brainTreePaymentController.integration.test.js)
3. User orders retrieval with authentication (order.getOrdersController.integration.test.js)
4. Admin orders retrieval and status update (order.adminOrders.integration.test.js)

**UI Tests (MS2)**
1. Login -> Checkout/Pay -> Order appears in user orders (checkout-orders.spec.ts)
2. Admin create product -> Product on product list (admin-product-view.spec.ts)
3. Admin update product -> Updated product on product list (admin-product-view.spec.ts)

### Fajar Ibnu Fatihan
**Features unit tested:**
   1. Authentication feature (Login, Register, Forgot Password)
   2. Protected routes (JWT middleware, Admin check)

**Source Files tested & unit test files created:**
   1. authHelper.js (authHelper.test.js)
   2. authMiddleware.js (authMiddleware.test.js)
   3. authController.js (login.authController.test.js)
   4. Login.js (Login.test.js)
   5. Register.js (Register.test.js)
   6. auth.js (auth.test.js)

**Integration Tests (MS2)**
   1. User login authentication (integration/auth/login.integration.test.js)
   2. User registration (integration/auth/register.integration.test.js)
   3. User profile update (integration/auth/profile.integration.test.js)
   4. Auth middleware and protected routes (integration/auth/authMiddleware.integration.test.js)
   5. Category CRUD operations (integration/category/category.integration.test.js)
   6. Product CRUD operations (integration/product/product.integration.test.js)

**UI Tests (MS2)**
   1. User registration flow (tests/auth-register.spec.ts)
   2. User login flow (tests/auth-login.spec.ts)
   3. Authentication error handling and redirects (tests/auth-error.spec.ts)
   4. Admin product create and update (tests/admin-product.spec.ts)
   5. Admin category CRUD management (tests/admin-category.spec.ts)

**Non-Functional Testing — Security Testing (MS3)**
   - Tool: Grafana k6 (penetration testing)
   - Test type: Security testing (white-box penetration testing)
   1. Authentication security — JWT tampering, forged tokens, algorithm "none" attack, malformed headers (security-tests/auth-security.js)
   2. Authorization & access control — regular user vs admin routes, unauthenticated access, positive controls (security-tests/authz-security.js)
   3. NoSQL injection — operator injection on login, forgot-password, product filters, role injection on register (security-tests/injection-security.js)
   4. Sensitive data exposure — password hash leakage, stack trace leakage, X-Powered-By header, security answer leakage (security-tests/data-exposure-security.js)
   5. Shared config and helpers (security-tests/config.js, security-tests/helpers.js)

### Amanda Quek Yan Ling
**Features unit tested: (MS1)**
   1. Product features
   2. Admin Product features

**Source Files tested & unit test files created:**
   1. productController.js (product.getProductController.test.js, 
                              product.getSingleProductController.test.js, 
                              product.PhotoController.test.js, 
                              product.productFiltersController.test.js, 
                              product.productCountController.test.js, 
                              product.productListController.test.js, 
                              product.searchProductController.test.js, 
                              product.relatedProductController.test.js, 
                              product.productCategoryController.test.js, 
                              product.createProductController.test.js, 
                              product.deleteProductController.test.js, 
                              product.updateProductController.test.js)
   2. ProductDetails.js (ProductDetails.test.js)
   3. CategoryProduct.js (CategoryProduct.test.js)
   4. admin/Products.js (admin/Products.test.js)
   5. admin/UpdateProducts.js (admin/UpdateProducts.test.js)
   6. admin/CreateProducts.js (admin/CreateProducts.test.js)
   7. productModel.js (productModel.test.js)

**Integration Tests (MS2)**
   1. Category mapping → product retrieval (integration/categoryMapping.test.js)
   2. Product filtering  (integration/filter.test.js)
   3. Product photo handling  (integration/photo.test.js)
   4. Product listing  (integration/productList.test.js)
   5. Related products  (integration/related.test.js)
   6. Product search  (integration/search.test.js)

**UI Tests (MS2)**
   1. Homepage → Product list → Product details (tests/product-list-details.spec.ts)
   2. Categories → Category page → Product details (tests/product-details-from-category.spec.ts)
   3. Homepage → Apply category filter → Product cards update (tests/product-filters.spec.ts)
   4. Homepage → Add to cart (tests/add-to-cart.spec.ts)
   5. Product details → Related products → Navigate to another product (tests/related-products.spec.ts)
   6. Homepage → Search product (tests/product-search.spec.ts)
   7. Product details → Product photo rendering (tests/product-photo.spec.ts)


## 1. Project Introduction

Virtual Vault is a full-stack MERN (MongoDB, Express.js, React.js, Node.js) e-commerce website, offering seamless connectivity and user-friendly features. The platform provides a robust framework for online shopping. The website is designed to adapt to evolving business needs and can be efficiently extended.

## 2. Website Features

- **User Authentication**: Secure user authentication system implemented to manage user accounts and sessions.
- **Payment Gateway Integration**: Seamless integration with popular payment gateways for secure and reliable online transactions.
- **Search and Filters**: Advanced search functionality and filters to help users easily find products based on their preferences.
- **Product Set**: Organized product sets for efficient navigation and browsing through various categories and collections.

## 3. Your Task

- **Unit and Integration Testing**: Utilize Jest for writing and running tests to ensure individual components and functions work as expected, finding and fixing bugs in the process.
- **UI Testing**: Utilize Playwright for UI testing to validate the behavior and appearance of the website's user interface.
- **Code Analysis and Coverage**: Utilize SonarQube for static code analysis and coverage reports to maintain code quality and identify potential issues.
- **Load Testing**: Leverage JMeter for load testing to assess the performance and scalability of the ecommerce platform under various traffic conditions.

## 4. Setting Up The Project

### 1. Installing Node.js

1. **Download and Install Node.js**:

   - Visit [nodejs.org](https://nodejs.org) to download and install Node.js.

2. **Verify Installation**:
   - Open your terminal and check the installed versions of Node.js and npm:
     ```bash
     node -v
     npm -v
     ```

### 2. MongoDB Setup

1. **Download and Install MongoDB Compass**:

   - Visit [MongoDB Compass](https://www.mongodb.com/products/tools/compass) and download and install MongoDB Compass for your operating system.

2. **Create a New Cluster**:

   - Sign up or log in to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register).
   - After logging in, create a project and within that project deploy a free cluster.

3. **Configure Database Access**:

   - Create a new user for your database (if not alredy done so) in MongoDB Atlas.
   - Navigate to "Database Access" under "Security" and create a new user with the appropriate permissions.

4. **Whitelist IP Address**:

   - Go to "Network Access" under "Security" and whitelist your IP address to allow access from your machine.
   - For example, you could whitelist 0.0.0.0 to allow access from anywhere for ease of use.

5. **Connect to the Database**:

   - In your cluster's page on MongoDB Atlas, click on "Connect" and choose "Compass".
   - Copy the connection string.

6. **Establish Connection with MongoDB Compass**:
   - Open MongoDB Compass on your local machine, paste the connection string (replace the necessary placeholders), and establish a connection to your cluster.

### 3. Application Setup

To download and use the MERN (MongoDB, Express.js, React.js, Node.js) app from GitHub, follow these general steps:

1. **Clone the Repository**

   - Go to the GitHub repository of the MERN app.
   - Click on the "Code" button and copy the URL of the repository.
   - Open your terminal or command prompt.
   - Use the `git clone` command followed by the repository URL to clone the repository to your local machine:
     ```bash
     git clone <repository_url>
     ```
   - Navigate into the cloned directory.

2. **Install Frontend and Backend Dependencies**

   - Run the following command in your project's root directory:

     ```
     npm install && cd client && npm install && cd ..
     ```

3. **Add database connection string to `.env`**

   - Add the connection string copied from MongoDB Atlas to the `.env` file inside the project directory (replace the necessary placeholders):
     ```env
     MONGO_URL = <connection string>
     ```

4. **Adding sample data to database**

   - Download “Sample DB Schema” from Canvas and extract it.
   - In MongoDB Compass, create a database named `test` under your cluster.
   - Add four collections to this database: `categories`, `orders`, `products`, and `users`.
   - Under each collection, click "ADD DATA" and import the respective JSON from the extracted "Sample DB Schema".

5. **Running the Application**
   - Open your web browser.
   - Use `npm run dev` to run the app from root directory, which starts the development server.
   - Navigate to `http://localhost:3000` to access the application.

## 5. Unit Testing with Jest

Unit testing is a crucial aspect of software development aimed at verifying the functionality of individual units or components of a software application. It involves isolating these units and subjecting them to various test scenarios to ensure their correctness.  
Jest is a popular JavaScript testing framework widely used for unit testing. It offers a simple and efficient way to write and execute tests in JavaScript projects.

### Getting Started with Jest

To begin unit testing with Jest in your project, follow these steps:

1. **Install Jest**:  
   Use your preferred package manager to install Jest. For instance, with npm:

   ```bash
   npm install --save-dev jest

   ```

2. **Write Tests**  
   Create test files for your components or units where you define test cases to evaluate their behaviour.

3. **Run Tests**  
   Execute your tests using Jest to ensure that your components meet the expected behaviour.  
   You can run the tests by using the following command in the root of the directory:

   - **Frontend tests**

     ```bash
     npm run test:frontend
     ```

   - **Backend tests**

     ```bash
     npm run test:backend
     ```

   - **All the tests**
     ```bash
     npm run test
     ```