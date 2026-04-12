// Fajar Ibnu Fatihan, A0314606L

export const BASE_URL = __ENV.BASE_URL || "http://localhost:6060";

export const ENDPOINTS = {
  // Auth
  register: `${BASE_URL}/api/v1/auth/register`,
  login: `${BASE_URL}/api/v1/auth/login`,
  forgotPassword: `${BASE_URL}/api/v1/auth/forgot-password`,
  userAuth: `${BASE_URL}/api/v1/auth/user-auth`,
  adminAuth: `${BASE_URL}/api/v1/auth/admin-auth`,
  profile: `${BASE_URL}/api/v1/auth/profile`,
  orders: `${BASE_URL}/api/v1/auth/orders`,
  allOrders: `${BASE_URL}/api/v1/auth/all-orders`,

  // Category (admin)
  createCategory: `${BASE_URL}/api/v1/category/create-category`,
  getCategory: `${BASE_URL}/api/v1/category/get-category`,
  updateCategory: (id) => `${BASE_URL}/api/v1/category/update-category/${id}`,
  deleteCategory: (id) => `${BASE_URL}/api/v1/category/delete-category/${id}`,

  // Product (admin)
  createProduct: `${BASE_URL}/api/v1/product/create-product`,
  getProduct: `${BASE_URL}/api/v1/product/get-product`,
  updateProduct: (pid) => `${BASE_URL}/api/v1/product/update-product/${pid}`,
  deleteProduct: (pid) => `${BASE_URL}/api/v1/product/delete-product/${pid}`,
};

export const HEADERS = {
  json: { "Content-Type": "application/json" },
};

export function authHeader(token) {
  return {
    "Content-Type": "application/json",
    Authorization: token,
  };
}
