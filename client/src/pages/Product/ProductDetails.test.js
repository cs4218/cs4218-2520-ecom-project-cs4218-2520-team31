import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import ProductDetails from "./ProductDetails";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";

jest.mock("axios");
jest.mock("../../components/Layout", () => {
  return ({ children }) => <div data-testid="layout">{children}</div>;
});
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useParams: jest.fn(),
  useNavigate: jest.fn(),
}));

describe("ProductDetails Unit Tests", () => {
  let navigateMock;
  beforeEach(() => {
    jest.clearAllMocks();
    navigateMock = jest.fn();
    useNavigate.mockReturnValue(navigateMock);
    useParams.mockReturnValue({ slug: "test-slug" });
  });
  const flushProductLoaded = async (expectedName) => {
    await screen.findByText(`Name : ${expectedName}`);
  };

  it("renders product details after successful axios response", async () => {
    const product = {
      _id: "pid1",
      name: "Test Product",
      description: "A product description",
      price: 1234,
      category: { _id: "c1", name: "Tests" },
    };

    axios.get.mockImplementation((url) => {
      if (url === "/api/v1/product/get-product/test-slug") {
        return Promise.resolve({ data: { product } });
      }
      if (url === "/api/v1/product/related-product/pid1/c1") {
        return Promise.resolve({ data: { products: [] } });
      }
      return Promise.reject(new Error("Unexpected URL: " + url));
    });

    render(<ProductDetails />);
    await flushProductLoaded("Test Product");
    await screen.findByText("No Similar Products found");

    // Output-based testing
    expect(await screen.findByText("Product Details")).toBeInTheDocument();
    expect(await screen.findByText("Name : Test Product")).toBeInTheDocument();
    expect(
      await screen.findByText("Description : A product description")
    ).toBeInTheDocument();
    expect(await screen.findByText("Category : Tests")).toBeInTheDocument();

    // Communication-based testing
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(
        "/api/v1/product/get-product/test-slug"
      );
      expect(axios.get).toHaveBeenCalledWith(
        "/api/v1/product/related-product/pid1/c1"
      );
    });
  });

  it("renders 'No Similar Products found' when related products is empty", async () => {
    const product = {
      _id: "pid2",
      name: "Solo Product",
      description: "No related products",
      price: 10,
      category: { _id: "c2", name: "Others" },
    };

    axios.get.mockImplementation((url) => {
      if (url === "/api/v1/product/get-product/test-slug") {
        return Promise.resolve({ data: { product } });
      }
      if (url === "/api/v1/product/related-product/pid2/c2") {
        return Promise.resolve({ data: { products: [] } });
      }
      return Promise.reject(new Error("Unexpected URL: " + url));
    });

    render(<ProductDetails />);
    await flushProductLoaded("Solo Product");

    // Output-based testing
    expect(
      await screen.findByText("No Similar Products found")
    ).toBeInTheDocument();

    // Communication-based testing
    expect(axios.get).toHaveBeenCalledWith(
      "/api/v1/product/get-product/test-slug"
    );
    expect(axios.get).toHaveBeenCalledWith(
      "/api/v1/product/related-product/pid2/c2"
    );
  });

  it("renders similar products cards when related products exist", async () => {
    const product = {
      _id: "pid3",
      name: "Test Product",
      description: "Test description",
      price: 199,
      category: { _id: "c3", name: "Category3" },
    };

    const relatedProducts = [
      {
        _id: "rpid1",
        name: "Related Product One",
        description: "Related desc one that is long enough to show as a description",
        price: 200,
        slug: "related-one",
      },
      {
        _id: "rpid2",
        name: "Related Product Two",
        description: "Related desc two that is long enough to show as a description",
        price: 300,
        slug: "related-two",
      },
    ];

    axios.get.mockImplementation((url) => {
      if (url === "/api/v1/product/get-product/test-slug") {
        return Promise.resolve({ data: { product } });
      }
      if (url === "/api/v1/product/related-product/pid3/c3") {
        return Promise.resolve({ data: { products: relatedProducts } });
      }
      return Promise.reject(new Error("Unexpected URL: " + url));
    });

    render(<ProductDetails />);
    await flushProductLoaded("Test Product");

    // Output-based testing
    expect(await screen.findByText("Similar Products ➡️")).toBeInTheDocument();
    expect(await screen.findByText("Related Product One")).toBeInTheDocument();
    expect(await screen.findByText("Related Product Two")).toBeInTheDocument();

    // Communication-based testing
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(
        "/api/v1/product/get-product/test-slug"
      );
      expect(axios.get).toHaveBeenCalledWith(
        "/api/v1/product/related-product/pid3/c3"
      );
    });
  });

  it("navigates to /product/:slug when 'More Details' is clicked", async () => {
    const product = {
      _id: "pid4",
      name: "Test Product 4",
      description: "Basic description of product",
      price: 99,
      category: { _id: "c4", name: "Cat4" },
    };

    const relatedProducts = [
      {
        _id: "rpid3",
        name: "Clickable Related Product 3",
        description: "Long enough description to to show as a cut description",
        price: 500,
        slug: "clickable-related",
      },
    ];

    axios.get.mockImplementation((url) => {
      if (url === "/api/v1/product/get-product/test-slug") {
        return Promise.resolve({ data: { product } });
      }
      if (url === "/api/v1/product/related-product/pid4/c4") {
        return Promise.resolve({ data: { products: relatedProducts } });
      }
      return Promise.reject(new Error("Unexpected URL: " + url));
    });

    render(<ProductDetails />);
    await flushProductLoaded("Test Product 4");
    await screen.findByText("Similar Products ➡️");

    const btn = await screen.findByRole("button", { name: "More Details" });
    fireEvent.click(btn);

    // Output-based testing (behaviour)
    expect(navigateMock).toHaveBeenCalledWith("/product/clickable-related");
  });

  it("does not call axios.get when params.slug is missing", async () => {
    useParams.mockReturnValue({ slug: undefined });
    render(<ProductDetails />);

    // Communication-based testing
    expect(axios.get).not.toHaveBeenCalled();
  });

  it("handles product axios failure gracefully without crashing", async () => {
    const logSpy = jest.spyOn(console, "log").mockImplementation(() => { });
    axios.get.mockRejectedValue(new Error("network error"));

    render(<ProductDetails />);

    // Output-based testing
    expect(screen.getByTestId("layout")).toBeInTheDocument();

    // Communication-based testing
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(
        "/api/v1/product/get-product/test-slug"
      );
      expect(logSpy).toHaveBeenCalled();
    });

    logSpy.mockRestore();
  });

  it("should not render product photo URL with undefined product id", async () => {
    axios.get.mockImplementation(() => new Promise(() => { }));

    render(<ProductDetails />);

    // Output-based testing
    const img = screen.getByRole("img");
    expect(img.getAttribute("src")).not.toContain("undefined");
  });

  it("should handle missing category safely", async () => {
    const logSpy = jest.spyOn(console, "log").mockImplementation(() => { });
    const productMissingCategory = {
      _id: "pidNoCat",
      name: "NoCat Product",
      description: "Desc",
      price: 10,
      category: null,
    };
    axios.get.mockResolvedValueOnce({ data: { product: productMissingCategory } });

    render(<ProductDetails />);

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(
        "/api/v1/product/get-product/test-slug"
      );
    });

    expect(logSpy).not.toHaveBeenCalled();

    logSpy.mockRestore();
  });
});