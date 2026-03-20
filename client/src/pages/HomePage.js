import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Checkbox, Radio } from "antd";
import { Prices } from "../components/Prices";
import { useCart } from "../context/cart";
import axios from "axios";
import toast from "react-hot-toast";
import Layout from "./../components/Layout";
import { AiOutlineReload } from "react-icons/ai";
import "../styles/Homepages.css";

const HomePage = () => {
  const navigate = useNavigate();
  const [cart, setCart] = useCart();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [checked, setChecked] = useState([]);
  const [radio, setRadio] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  //get all cat
  const getAllCategory = async () => {
    try {
      const { data } = await axios.get("/api/v1/category/get-category");
      if (data?.success) {
        setCategories(data?.category);
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    getAllCategory();
    getTotal();
  }, []);
  //get products
  const getAllProducts = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`/api/v1/product/product-list/${page}`);
      setLoading(false);
      setProducts(data.products);
    } catch (error) {
      setLoading(false);
      console.log(error);
    }
  };

  //getTOtal COunt
  const getTotal = async () => {
    try {
      const { data } = await axios.get("/api/v1/product/product-count");
      setTotal(data?.total);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    if (page === 1) return;
    loadMore();
  }, [page]);
  //load more
  const loadMore = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`/api/v1/product/product-list/${page}`);
      setLoading(false);
      setProducts([...products, ...data?.products]);
    } catch (error) {
      console.log(error);
      setLoading(false);
    }
  };

  // filter by cat
  const handleFilter = (value, id) => {
    let all = [...checked];
    if (value) {
      all.push(id);
    } else {
      all = all.filter((c) => c !== id);
    }
    setChecked(all);
  };
  // Amanda Quek Yan Ling, A0277779Y
  useEffect(() => {
    if (checked.length || radio.length) {
      filterProduct();
    } else {
      getAllProducts();
    }
  }, [checked, radio]);

  //get filterd product
  const filterProduct = async () => {
    try {
      const { data } = await axios.post("/api/v1/product/product-filters", {
        checked,
        radio,
      });
      setProducts(data?.products);
      // Amanda Quek Yan Ling, A0277779Y
      setTotal(data?.products.length);
    } catch (error) {
      console.log(error);
    }
  };

  // Amanda Quek Yan Ling, A0277779Y
  const handleResetFilters = async () => {
    try {
      setChecked([]);
      setRadio([]);
      setPage(1);
      await getAllProducts();
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <Layout title={"ALL Products - Best offers "}>
      {/* banner image */}
      <img
        src="/images/Virtual.png"
        className="banner-img"
        alt="bannerimage"
        width={"100%"}
        data-testid="homepage-banner"
      />
      <div className="container-fluid row mt-3 home-page" data-testid="homepage">
        <div className="col-md-3 filters" data-testid="filters-panel">
          <h4 className="text-center">Filter By Category</h4>
          <div className="d-flex flex-column" data-testid="category-filters">
            {categories?.map((c) => (
              <Checkbox
                key={c._id}
                onChange={(e) => handleFilter(e.target.checked, c._id)}
                data-testid={`category-filter-${c.slug || c._id}`}
              >
                {c.name}
              </Checkbox>
            ))}
          </div>
          {/* price filter */}
          <h4 className="text-center mt-4">Filter By Price</h4>
          <div className="d-flex flex-column" data-testid="price-filters">
            <Radio.Group
              value={radio}
              onChange={(e) => setRadio(e.target.value)}
              data-testid="price-filter-group"
            >
              {Prices?.map((p) => (
                <div key={p._id}>
                  <Radio
                    value={p.array}
                    data-testid={`price-filter-${p._id}`}
                  >
                    {p.name}
                  </Radio>
                </div>
              ))}
            </Radio.Group>
          </div>
          {/* Amanda Quek Yan Ling, A0277779Y */}
          <div className="d-flex flex-column">
            <button
              className="btn btn-danger"
              data-testid="reset-filters-btn"
              onClick={handleResetFilters}
            >
              RESET FILTERS
            </button>
          </div>
        </div>

        <div className="col-md-9" data-testid="products-section">
          <h1 className="text-center">All Products</h1>
          <div className="d-flex flex-wrap" data-testid="product-grid">
            {products?.map((p) => (
              <div
                className="card m-2"
                key={p._id}
                data-testid={`product-card-${p.slug}`}
              >
                <img
                  src={`/api/v1/product/product-photo/${p._id}`}
                  className="card-img-top"
                  alt={p.name}
                  data-testid={`product-image-${p.slug}`}
                />
                <div className="card-body">
                  <div className="card-name-price">
                    <h5
                      className="card-title"
                      data-testid={`product-name-${p.slug}`}
                    >
                      {p.name}
                    </h5>
                    <h5
                      className="card-title card-price"
                      data-testid={`product-price-${p.slug}`}
                    >
                      {p.price.toLocaleString("en-US", {
                        style: "currency",
                        currency: "USD",
                      })}
                    </h5>
                  </div>
                  <p
                    className="card-text"
                    data-testid={`product-description-${p.slug}`}
                  >
                    {p.description.substring(0, 60)}...
                  </p>
                  <div className="card-name-price">
                    <button
                      className="btn btn-info ms-1"
                      data-testid={`more-details-${p.slug}`}
                      onClick={() => navigate(`/product/${p.slug}`)}
                    >
                      More Details
                    </button>
                    <button
                      className="btn btn-dark ms-1"
                      data-testid={`add-to-cart-${p.slug}`}
                      onClick={() => {
                        setCart([...cart, p]);
                        localStorage.setItem(
                          "cart",
                          JSON.stringify([...cart, p])
                        );
                        toast.success("Item Added to cart");
                      }}
                    >
                      ADD TO CART
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="m-2 p-3">
            {/* {products && products.length < total && (
              <button
                className="btn loadmore"
                data-testid="load-more-btn"
                onClick={(e) => {
                  e.preventDefault();
                  setPage(page + 1);
                }}
              >
                {loading ? (
                  "Loading ..."
                ) : (
                  <>
                    {" "}
                    Loadmore <AiOutlineReload />
                  </>
                )}
              </button>
            )} */}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default HomePage;