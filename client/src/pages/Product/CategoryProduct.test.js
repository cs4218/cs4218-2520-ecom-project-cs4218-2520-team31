import React from "react";
import { render, waitFor, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import axios from "axios";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import CategoryProduct from "./CategoryProduct";

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
    useParams: () => ({ slug: "phones" }),
  };
});

describe("CategoryProduct Unit Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("rendering Category page UI", () => {
    const { getByText } = render(
      <MemoryRouter initialEntries={["/category/phones"]}>
        <Routes>
          <Route path="/category/:slug" element={<CategoryProduct />} />
        </Routes>
      </MemoryRouter>
    );

    expect(getByText(/Category -/i)).toBeInTheDocument();
  });

  it("fetches category products and shows name + result count + products", async () => {
    const apiRes = {
      data: {
        category: { name: "Phones" },
        products: [
          {
            _id: "p1",
            name: "iPhone 15",
            slug: "iphone-15",
            description: "Best phone ever",
            price: 1999,
          },
          {
            _id: "p2",
            name: "Samsung S24",
            slug: "s24",
            description: "Good phone too",
            price: 1500,
          },
        ],
      },
    };

    axios.get.mockResolvedValueOnce(apiRes);
    const { findByText, getByText } = render(
      <MemoryRouter initialEntries={["/category/phones"]}>
        <Routes>
          <Route path="/category/:slug" element={<CategoryProduct />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await findByText("Category - Phones")).toBeInTheDocument();
    await waitFor(() =>
      expect(axios.get).toHaveBeenCalledWith(
        "/api/v1/product/product-category/phones"
      )
    );
    expect(getByText("2 result found")).toBeInTheDocument();

    expect(getByText("iPhone 15")).toBeInTheDocument();
    expect(getByText("Samsung S24")).toBeInTheDocument();
  });

  it("navigate to product details", async () => {
    const apiRes = {
      data: {
        category: { name: "Phones" },
        products: [
          {
            _id: "p1",
            name: "iPhone 15",
            slug: "iphone-15",
            description: "Best phone ever",
            price: 1999,
          },
        ],
      },
    };

    axios.get.mockResolvedValueOnce(apiRes);
    const { findByText, getByText } = render(
      <MemoryRouter initialEntries={["/category/phones"]}>
        <Routes>
          <Route path="/category/:slug" element={<CategoryProduct />} />
        </Routes>
      </MemoryRouter>
    );

    await findByText("Category - Phones");
    await findByText("iPhone 15");
    fireEvent.click(getByText("More Details"));
    expect(mockNavigate).toHaveBeenCalledWith("/product/iphone-15");
  });

  it("handle API error gracefully (negative test)", async () => {
    axios.get.mockRejectedValueOnce(new Error("Network error"));

    const { getByText } = render(
      <MemoryRouter initialEntries={["/category/phones"]}>
        <Routes>
          <Route path="/category/:slug" element={<CategoryProduct />} />
        </Routes>
      </MemoryRouter>
    );
    expect(getByText(/Category -/i)).toBeInTheDocument();
    await waitFor(() => expect(axios.get).toHaveBeenCalled());
  });
});
