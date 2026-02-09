import React from "react";
import { render, waitFor, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom/extend-expect";
import axios from "axios";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import ProductDetails from "./ProductDetails";


jest.mock("axios");

jest.mock("../../components/Layout", () => {
  return ({ children }) => <div data-testid="mock-layout">{children}</div>;
});

const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => {
  const actual = jest.requireActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ slug: "iphone-15" }),
  };
});
describe("ProductDetails Unit Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("rendering heading", () => {
    const { getByText } = render(
      <MemoryRouter initialEntries={["/product/iphone-15"]}>
        <Routes>
          <Route path="/product/:slug" element={<ProductDetails />} />
        </Routes>
      </MemoryRouter>
    );

    expect(getByText("Product Details")).toBeInTheDocument();
  });

  it("product and product fields, check trigger of related products API", async () => {
    const productRes = {
      data: {
        product: {
          _id: "p1",
          name: "iPhone 15",
          description: "Best phone",
          price: 1999,
          category: { _id: "c1", name: "Phones" },
        },
      },
    };

    const relatedRes = {
      data: {
        products: [
          { _id: "p2", name: "Samsung S24", slug: "s24", description: "Good", price: 1500 },
        ],
      },
    };

    axios.get
      .mockResolvedValueOnce(productRes)
      .mockResolvedValueOnce(relatedRes);

    const { getByText, findByText } = render(
      <MemoryRouter initialEntries={["/product/iphone-15"]}>
        <Routes>
          <Route path="/product/:slug" element={<ProductDetails />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => expect(axios.get).toHaveBeenCalled());

    expect(axios.get).toHaveBeenNthCalledWith(
      1,
      "/api/v1/product/get-product/iphone-15"
    );

    expect(await findByText("Name : iPhone 15")).toBeInTheDocument();
    expect(getByText("Description : Best phone")).toBeInTheDocument();
    expect(getByText("Category : Phones")).toBeInTheDocument();

    expect(axios.get).toHaveBeenNthCalledWith(
      2,
      "/api/v1/product/related-product/p1/c1"
    );

    expect(await findByText("Samsung S24")).toBeInTheDocument();
  });

  it("shows 'No Similar Products found'", async () => {
    const productRes = {
      data: {
        product: {
          _id: "p1",
          name: "iPhone 15",
          description: "Best phone",
          price: 1999,
          category: { _id: "c1", name: "Phones" },
        },
      },
    };

    const relatedRes = { data: { products: [] } };

    axios.get
      .mockResolvedValueOnce(productRes)
      .mockResolvedValueOnce(relatedRes);

    const { findByText } = render(
      <MemoryRouter initialEntries={["/product/iphone-15"]}>
        <Routes>
          <Route path="/product/:slug" element={<ProductDetails />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await findByText("No Similar Products found")).toBeInTheDocument();
  });

  it("navigating to related product details", async () => {
    const productRes = {
      data: {
        product: {
          _id: "p1",
          name: "iPhone 15",
          description: "Best phone",
          price: 1999,
          category: { _id: "c1", name: "Phones" },
        },
      },
    };

    const relatedRes = {
      data: {
        products: [{ _id: "p2", name: "Samsung S24", slug: "s24", description: "Good", price: 1500 }],
      },
    };

    axios.get
      .mockResolvedValueOnce(productRes)
      .mockResolvedValueOnce(relatedRes);

    const { findByText, getByText } = render(
      <MemoryRouter initialEntries={["/product/iphone-15"]}>
        <Routes>
          <Route path="/product/:slug" element={<ProductDetails />} />
        </Routes>
      </MemoryRouter>
    );

    await findByText("Samsung S24");

    fireEvent.click(getByText("More Details"));
    expect(mockNavigate).toHaveBeenCalledWith("/product/s24");
  });

  it("handles API error without crash", async () => {
    axios.get.mockRejectedValueOnce(new Error("Network error"));

    const { getByText } = render(
      <MemoryRouter initialEntries={["/product/iphone-15"]}>
        <Routes>
          <Route path="/product/:slug" element={<ProductDetails />} />
        </Routes>
      </MemoryRouter>
    );

    expect(getByText("Product Details")).toBeInTheDocument();

    await waitFor(() => expect(axios.get).toHaveBeenCalled());
  });
});
