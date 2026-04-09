// Brenna Lauren Tan Jia Ern, A0254710M

import http from 'k6/http';
import { check, sleep } from 'k6';
import { BASE_URL, createOptions } from './config.js';

export const options = createOptions();

export default function () {
  const categoryRes = http.get(`${BASE_URL}/api/v1/category/get-category`);

  let categoryBody;
  try {
    categoryBody = categoryRes.json();
  } catch (error) {
    categoryBody = null;
  }

  const categories = categoryBody?.category || [];
  const selectedCategoryId = categories.length > 0 ? categories[0]._id : null;

  const payload = JSON.stringify({
    checked: selectedCategoryId ? [selectedCategoryId] : [],
    radio: [],
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const filterRes = http.post(
    `${BASE_URL}/api/v1/product/product-filters`,
    payload,
    params
  );

  let filterBody;
  try {
    filterBody = filterRes.json();
  } catch (error) {
    filterBody = null;
  }

  check(categoryRes, {
    'category fetch status is 200': (r) => r.status === 200,
    'category response is valid JSON': () => categoryBody !== null,
    'categories array exists': () => Array.isArray(categories),
  });

  check(filterRes, {
    'filter status is 200': (r) => r.status === 200,
    'filter response is valid JSON': () => filterBody !== null,
    'filtered products array exists': () =>
      filterBody && Array.isArray(filterBody.products),
  });

  sleep(1);
}