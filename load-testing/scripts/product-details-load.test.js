// Brenna Lauren Tan Jia Ern, A0254710M

import http from 'k6/http';
import { check, sleep } from 'k6';
import { BASE_URL, createOptions, lightStages, mediumStages, heavyStages } from './config.js';

export const options = createOptions(lightStages);
// export const options = createOptions(mediumStages);
// export const options = createOptions(heavyStages);

export default function () {
  const listRes = http.get(`${BASE_URL}/api/v1/product/product-list/1`);

  let listBody;
  try {
    listBody = listRes.json();
  } catch (error) {
    listBody = null;
  }

  const products = listBody?.products || [];
  const selectedSlug = products.length > 0 ? products[0].slug : null;

  let detailsRes = null;
  let detailsBody = null;

  if (selectedSlug) {
    detailsRes = http.get(`${BASE_URL}/api/v1/product/get-product/${selectedSlug}`);

    try {
      detailsBody = detailsRes.json();
    } catch (error) {
      detailsBody = null;
    }
  }

  check(listRes, {
    'product list status is 200': (r) => r.status === 200,
    'product list is valid JSON': () => listBody !== null,
    'product list contains products': () => Array.isArray(products) && products.length > 0,
    'selected product has slug': () => !!selectedSlug,
  });

  check(detailsRes || { status: 0 }, {
    'product details status is 200': (r) => r.status === 200,
    'product details response is valid JSON': () => detailsBody !== null,
    'product details contains product object': () =>
      detailsBody && typeof detailsBody.product === 'object' && detailsBody.product !== null,
  });

  sleep(1);
}