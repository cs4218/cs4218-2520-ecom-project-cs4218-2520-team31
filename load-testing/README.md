Brenna Lauren Tan Jia Ern, A0254710M

### Instructions for Load Testing

#### Light Load Testing

To run k6 tests and write output to the light (load) text files, change load to "lightStages" in the respective script file and run the following:

PRODUCT LIST LOAD TESTING:
- k6 run load-testing/scripts/product-list-load.test.js | Tee-Object -FilePath "load-testing/results/low-load/product-list-light.txt"

PRODUCT SEARCH LOAD TESTING:
- k6 run load-testing/scripts/product-search-load.test.js | Tee-Object -FilePath "load-testing/results/low-load/product-search-light.txt"

PRODUCT DETAILS LOAD TESTING:
- k6 run load-testing/scripts/product-details-load.test.js | Tee-Object -FilePath "load-testing/results/low-load/product-details-light.txt"

PRODUCT COUNT LOAD TESTING:
- k6 run load-testing/scripts/product-count-load.test.js | Tee-Object -FilePath "load-testing/results/low-load/product-count-light.txt"

CATEGORY LOAD TESTING:
- k6 run load-testing/scripts/category-load.test.js | Tee-Object -FilePath "load-testing/results/low-load/category-light.txt"

#### Baseline Load Testing

To run k6 tests and write output to the baseline text files, change load to "mediumStages" in the respective script file and run the following:

PRODUCT LIST LOAD TESTING:
- k6 run load-testing/scripts/product-list-load.test.js | Tee-Object -FilePath "load-testing/results/baseline/product-list-baseline.txt"

PRODUCT SEARCH LOAD TESTING:
- k6 run load-testing/scripts/product-search-load.test.js | Tee-Object -FilePath "load-testing/results/baseline/product-search-baseline.txt"

PRODUCT DETAILS LOAD TESTING:
- k6 run load-testing/scripts/product-details-load.test.js | Tee-Object -FilePath "load-testing/results/baseline/product-details-baseline.txt"

PRODUCT COUNT LOAD TESTING:
- k6 run load-testing/scripts/product-count-load.test.js | Tee-Object -FilePath "load-testing/results/baseline/product-count-baseline.txt"

CATEGORY LOAD TESTING:
- k6 run load-testing/scripts/category-load.test.js | Tee-Object -FilePath "load-testing/results/baseline/category-baseline.txt"

#### Heavy Load Testing

To run k6 tests and write output to the heavy (load) text files, change load to "heavyStages" in the respective script file and run the following:

PRODUCT LIST LOAD TESTING:
- k6 run load-testing/scripts/product-list-load.test.js | Tee-Object -FilePath "load-testing/results/high-load/product-list-heavy.txt"

PRODUCT SEARCH LOAD TESTING:
- k6 run load-testing/scripts/product-search-load.test.js | Tee-Object -FilePath "load-testing/results/high-load/product-search-heavy.txt"

PRODUCT DETAILS LOAD TESTING:
- k6 run load-testing/scripts/product-details-load.test.js | Tee-Object -FilePath "load-testing/results/high-load/product-details-heavy.txt"

PRODUCT COUNT LOAD TESTING:
- k6 run load-testing/scripts/product-count-load.test.js | Tee-Object -FilePath "load-testing/results/high-load/product-count-heavy.txt"

CATEGORY LOAD TESTING:
- k6 run load-testing/scripts/category-load.test.js | Tee-Object -FilePath "load-testing/results/high-load/category-heavy.txt"

---

After running each of the load tests, manually update summary.md with
- Avg response time (http_req_duration avg)
- p95 response time (http_req_duration p(95))
- Failure rate (http_req_failed)
- Requests (http_reqs)
- Throughput (http_reqs rate)