Brenna Lauren Tan Jia Ern, A0254710M

### Instructions for Load Testing

To run k6 tests and write output to the baseline text files, change load to "mediumStages" in the respective script file and run the following:

PRODUCT LIST LOAD TESTING:
- k6 run load-testing/scripts/product-list-load.test.js | Tee-Object -FilePath "load-testing/results/baseline/product-list-baseline.txt"

PRODUCT SEARCH LOAD TESTING:
- k6 run load-testing/scripts/product-search-load.test.js | Tee-Object -FilePath "load-testing/results/baseline/product-search-baseline.txt"

PRODUCT DETAILS LOAD TESTING:
- k6 run load-testing/scripts/product-details-load.test.js | Tee-Object -FilePath "load-testing/results/baseline/product-details-baseline.txt"

To run k6 tests and write output to the heavy (load) text files, change load to "heavyStages" in the respective script file and run the following:

PRODUCT LIST LOAD TESTING:
- k6 run load-testing/scripts/product-list-load.test.js | Tee-Object -FilePath "load-testing/results/high-load/product-list-heavy.txt"

PRODUCT SEARCH LOAD TESTING:
- k6 run load-testing/scripts/product-search-load.test.js | Tee-Object -FilePath "load-testing/results/high-load/product-search-heavy.txt"

PRODUCT DETAILS LOAD TESTING:
- k6 run load-testing/scripts/product-details-load.test.js | Tee-Object -FilePath "load-testing/results/high-load/product-details-heavy.txt"

After running each of the load tests, manually update summary.md with
- Avg response time (http_req_duration avg)
- p95 response time (http_req_duration p(95))
- Failure rate (http_req_failed)
- Requests (http_reqs)
- Throughput (http_reqs rate)