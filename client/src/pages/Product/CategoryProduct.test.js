import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import CategoryProduct from "./CategoryProduct";
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

describe("CategoryProduct Unit Tests", () => {
  let navigateMock;

  beforeEach(() => {
    jest.clearAllMocks();
    navigateMock = jest.fn();
    useNavigate.mockReturnValue(navigateMock);
    useParams.mockReturnValue({ slug: "tests" });
  });

  it("fetches category products on mount when slug exists and renders category name + results count", async () => {
    const apiResponse = {
      category: { _id: "c1", name: "Tests" },
      products: [
        {
          _id: "pid1",
          name: "Test A",
          slug: "test-a",
          description: "A long description for test A to be cut off as a description",
          price: 100,
        },
        {
          _id: "pid2",
          name: "Test B",
          slug: "test-b",
          description: "A long description for test B to be cut off as a description",
          price: 200,
        },
      ],
    };

    axios.get.mockResolvedValue({ data: apiResponse });

    render(<CategoryProduct />);

    // Communication-based testing
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(
        "/api/v1/product/product-category/tests"
      );
    });

    // Output-based testing
    expect(await screen.findByText("Category - Tests")).toBeInTheDocument();
    expect(await screen.findByText("2 result found")).toBeInTheDocument();

    expect(await screen.findByText("Test A")).toBeInTheDocument();
    expect(await screen.findByText("Test B")).toBeInTheDocument();

    const imgs = screen.getAllByRole("img");
    expect(imgs[0]).toHaveAttribute(
      "src",
      "/api/v1/product/product-photo/pid1"
    );
    expect(imgs[1]).toHaveAttribute(
      "src",
      "/api/v1/product/product-photo/pid2"
    );
  });

  it("renders 0 results when products array is empty", async () => {
    axios.get.mockResolvedValue({
      data: {
        category: { _id: "c2", name: "EmptyCategory" },
        products: [],
      },
    });

    render(<CategoryProduct />);

    // Output-based testing
    expect(await screen.findByText("Category - EmptyCategory")).toBeInTheDocument();
    expect(await screen.findByText("0 result found")).toBeInTheDocument();
  });

  it("navigates to /product/:slug when 'More Details' is clicked", async () => {
    axios.get.mockResolvedValue({
      data: {
        category: { _id: "c1", name: "Phones" },
        products: [
          {
            _id: "p10",
            name: "Clickable Test",
            slug: "clickable-test",
            description: "This description is long enough it to get cut off as a description",
            price: 500,
          },
        ],
      },
    });

    render(<CategoryProduct />);
    const btn = await screen.findByRole("button", { name: "More Details" });
    fireEvent.click(btn);

    // Output-based testing (behaviour)
    expect(navigateMock).toHaveBeenCalledWith("/product/clickable-test");
  });

  it("does not call GET axios when params.slug is missing", async () => {
    useParams.mockReturnValue({ slug: undefined });
    render(<CategoryProduct />);

    // Communication-based testing
    expect(axios.get).not.toHaveBeenCalled();
  });

  it("handles axios failure gracefully without crashing", async () => {
    const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    axios.get.mockRejectedValue(new Error("network error"));

    render(<CategoryProduct />);

    // Output-based testing
    expect(screen.getByTestId("layout")).toBeInTheDocument();

    // Communication-based testing
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(
        "/api/v1/product/product-category/tests"
      );
      expect(logSpy).toHaveBeenCalled();
    });

    logSpy.mockRestore();
  });

  it("renders price formatted in USD currency format", async () => {
    axios.get.mockResolvedValue({
      data: {
        category: { _id: "c9", name: "FormatCategory" },
        products: [
          {
            _id: "pid9",
            name: "Dollar Item",
            slug: "dollar-item",
            description: "Long enough description for showcasing the formatting",
            price: 1234,
          },
        ],
      },
    });

    render(<CategoryProduct />);

    // Output-based testing
    expect(await screen.findByText("Dollar Item")).toBeInTheDocument();
    expect(await screen.findByText("$1,234.00")).toBeInTheDocument();
  });
});