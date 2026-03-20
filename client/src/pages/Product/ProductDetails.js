import React, { useState, useEffect } from "react";
import Layout from "../../components/Layout";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import "../../styles/ProductDetailsStyles.css";

const ProductDetails = () => {
  const params = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [notFound, setNotFound] = useState(false);

  //initalp details
  useEffect(() => {
    if (params?.slug) getProduct();
  }, [params?.slug]);

  //getProduct
  const getProduct = async () => {
    try {
      const { data } = await axios.get(
        `/api/v1/product/get-product/${params.slug}`
      );
      const fetchedProduct = data?.product ?? null;
      setProduct(fetchedProduct);

      if (!fetchedProduct) {
        setNotFound(true);
        setRelatedProducts([]);
        return;
      }

      setNotFound(false);

      // Amanda Quek Yan Ling, A0277779Y
      const pid = fetchedProduct?._id;
      const cid = fetchedProduct?.category?._id;

      if (pid && cid) {
        getSimilarProduct(pid, cid);
      } else {
        setRelatedProducts([]);
      }

    } catch (error) {
      console.log(error);
      setProduct(null);
      setNotFound(true);
      setRelatedProducts([]);
    }
  };

  //get similar product
  const getSimilarProduct = async (pid, cid) => {
    try {
      const { data } = await axios.get(
        `/api/v1/product/related-product/${pid}/${cid}`
      );
      setRelatedProducts(data?.products);
    } catch (error) {
      console.log(error);
      setRelatedProducts([]);
    }
  };

  // Amanda Quek Yan Ling, A0277779Y
  const productPhotoSrc = product?._id
    ? `/api/v1/product/product-photo/${product._id}`
    : "/images/a1.png";

  // Amanda Quek Yan Ling, A0277779Y
  if (notFound) {
    return (
      <Layout>
        <div
          className="container mt-5 text-center"
          data-testid="product-not-found-page"
        >
          <h1 data-testid="product-not-found-heading">Product Not Found</h1>
          <p data-testid="product-not-found-message">
            The product you are looking for does not exist.
          </p>
          <button
            className="btn btn-primary"
            data-testid="back-home-btn"
            onClick={() => navigate("/")}
          >
            Back to Home
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div
        className="row container product-details"
        data-testid="product-details-page"
      >
        <div className="col-md-6">
          {/* Amanda Quek Yan Ling, A0277779Y */}
          <img
            src={productPhotoSrc}
            className="card-img-top"
            alt={product?.name || "product"}
            height="300"
            width={"350px"}
            data-testid="product-details-image"
          />
        </div>
        <div className="col-md-6 product-details-info">
          <h1 className="text-center" data-testid="product-details-heading">
            Product Details
          </h1>
          <hr />
          {/* Amanda Quek Yan Ling, A0277779Y */}
          <h6 data-testid="product-details-name">
            Name : {product?.name}
          </h6>
          <h6 data-testid="product-details-description">
            Description : {product?.description}
          </h6>
          <h6 data-testid="product-details-price">
            Price :
            {product?.price?.toLocaleString("en-US", {
              style: "currency",
              currency: "USD",
            })}
          </h6>
          {/* Amanda Quek Yan Ling, A0277779Y */}
          <h6 data-testid="product-details-category">
            Category : {product?.category?.name}
          </h6>
          <button
            className="btn btn-secondary ms-1"
            data-testid="product-details-add-to-cart"
          >
            ADD TO CART
          </button>

        </div>
      </div>
      <hr />
      <div
        className="row container similar-products"
        data-testid="related-products-section"
      >
        <h4 data-testid="related-products-heading">Similar Products ➡️</h4>
        {relatedProducts.length < 1 && (
          <p className="text-center" data-testid="no-related-products">
            No Similar Products found
          </p>
        )}
        <div className="d-flex flex-wrap" data-testid="related-products-grid">
          {relatedProducts?.map((p) => (
            <div
              className="card m-2"
              key={p._id}
              data-testid={`related-product-card-${p.slug}`}
            >
              <img
                src={`/api/v1/product/product-photo/${p._id}`}
                className="card-img-top"
                alt={p.name}
                data-testid={`related-product-image-${p.slug}`}
              />
              <div className="card-body">
                <div className="card-name-price">
                  <h5
                    className="card-title"
                    data-testid={`related-product-name-${p.slug}`}
                  >
                    {p.name}
                  </h5>
                  <h5
                    className="card-title card-price"
                    data-testid={`related-product-price-${p.slug}`}
                  >
                    {p.price.toLocaleString("en-US", {
                      style: "currency",
                      currency: "USD",
                    })}
                  </h5>
                </div>
                <p
                  className="card-text"
                  data-testid={`related-product-description-${p.slug}`}
                >
                  {p.description.substring(0, 60)}...
                </p>
                <div className="card-name-price">
                  <button
                    className="btn btn-info ms-1"
                    data-testid={`related-more-details-${p.slug}`}
                    onClick={() => navigate(`/product/${p.slug}`)}
                  >
                    More Details
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default ProductDetails;