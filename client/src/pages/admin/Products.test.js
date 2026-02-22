// Amanda Quek Yan Ling, A0277779Y
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import Products from "./Products";
import axios from "axios";
import toast from "react-hot-toast";

jest.mock("axios");
jest.mock("react-hot-toast", () => ({
  success: jest.fn(),
  error: jest.fn(),
}));
jest.mock("./../../components/Layout", () => {
  return ({ children }) => <div data-testid="layout">{children}</div>;
});
jest.mock("../../components/AdminMenu", () => {
  return () => <div data-testid="admin-menu" />;
});
jest.mock("react-router-dom", () => ({
  Link: ({ to, children, ...rest }) => (
    <a href={to} {...rest}>
      {children}
    </a>
  ),
}));

describe("Products Unit Tests", () => {
  let consoleErrorSpy;
  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });
  afterEach(() => {
    expect(consoleErrorSpy).not.toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });

  it("fetches all products on mount and renders product cards with links with images", async () => {
    const products = [
      {
        _id: "p1",
        name: "Product One",
        description: "Description One",
        slug: "product-one",
      },
      {
        _id: "p2",
        name: "Product Two",
        description: "Description Two",
        slug: "product-two",
      },
    ];
    axios.get.mockResolvedValueOnce({ data: { products } });

    render(<Products />);

    // Communication-based testing
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith("/api/v1/product/get-product");
    });

    // Output-based testing
    expect(await screen.findByText("All Products List")).toBeInTheDocument();
    expect(await screen.findByText("Product One")).toBeInTheDocument();
    expect(screen.getByText("Description One")).toBeInTheDocument();
    expect(screen.getByText("Product Two")).toBeInTheDocument();
    expect(screen.getByText("Description Two")).toBeInTheDocument();

    const link1 = screen.getByRole("link", { name: /Product One/i });
    expect(link1).toHaveAttribute("href", "/dashboard/admin/product/product-one");
    const link2 = screen.getByRole("link", { name: /Product Two/i });
    expect(link2).toHaveAttribute("href", "/dashboard/admin/product/product-two");

    const img1 = screen.getByAltText("Product One");
    expect(img1).toHaveAttribute("src", "/api/v1/product/product-photo/p1");
    const img2 = screen.getByAltText("Product Two");
    expect(img2).toHaveAttribute("src", "/api/v1/product/product-photo/p2");
  });

  it("renders no product links when API returns empty products array", async () => {
    axios.get.mockResolvedValueOnce({ data: { products: [] } });

    render(<Products />);

    // Communication-based testing
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith("/api/v1/product/get-product");
    });

    // Output-based testing
    expect(screen.queryAllByRole("link")).toHaveLength(0);
  });

  it("shows toast error when getAllProducts throws error", async () => {
    axios.get.mockRejectedValueOnce(new Error("network fail"));
    const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});

    render(<Products />);

    // Output-based testing
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Someething Went Wrong");
    });

    // Communication-based testing
    expect(axios.get).toHaveBeenCalledWith("/api/v1/product/get-product");

    logSpy.mockRestore();
  });

  it("does not crash when a product has missing description", async () => {
    const products = [
      { _id: "p1", name: "NoDesc Product", slug: "no-desc", description: undefined },
    ];
    axios.get.mockResolvedValueOnce({ data: { products } });

    expect(() => render(<Products />)).not.toThrow();
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith("/api/v1/product/get-product");
    });

    // Output-based testing
    expect(await screen.findByText("NoDesc Product")).toBeInTheDocument();
  });
});