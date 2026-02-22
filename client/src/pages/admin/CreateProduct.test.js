// Amanda Quek Yan Ling, A0277779Y
import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import CreateProduct from "./CreateProduct";
import axios from "axios";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

jest.mock("axios");
jest.mock("react-hot-toast", () => ({
  success: jest.fn(),
  error: jest.fn(),
}));
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: jest.fn(),
}));
jest.mock("./../../components/Layout", () => {
  return ({ children }) => <div data-testid="layout">{children}</div>;
});
jest.mock("./../../components/AdminMenu", () => {
  return () => <div data-testid="admin-menu" />;
});
jest.mock("antd", () => {
  const React = require("react");

  const Select = ({ children, onChange, placeholder }) => (
    <select
      aria-label={placeholder || "select"}
      onChange={(e) => onChange(e.target.value)}
    >
      {children}
    </select>
  );

  Select.Option = ({ children, value }) => (
    <option value={value}>{children}</option>
  );

  return { Select };
});

class FormDataMock {
  constructor() {
    this.append = jest.fn();
  }
}
const installFormDataMock = () => {
  global.FormData = FormDataMock;
};
const installCreateObjectURLMock = () => {
  global.URL.createObjectURL = jest.fn(() => "blob://mock-photo");
};

describe("CreateProduct Unit Tests", () => {
  let navigateMock;
  let consoleErrorSpy;
  const loadAndSelectCategory = async (id = "cat-id", name = "Cat 1") => {
    expect(await screen.findByText(name)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Select a category"), {
      target: { value: id },
    });
  };
  beforeEach(() => {
    jest.clearAllMocks();
    navigateMock = jest.fn();
    useNavigate.mockReturnValue(navigateMock);

    installFormDataMock();
    installCreateObjectURLMock();
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => { });
  });
  afterEach(() => {
    expect(consoleErrorSpy).not.toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });

  it("fetches categories on mount when axios returns success and renders options", async () => {
    const categories = [
      { _id: "c1", name: "Cat 1" },
      { _id: "c2", name: "Cat 2" },
    ];
    axios.get.mockResolvedValueOnce({
      data: { success: true, category: categories },
    });

    render(<CreateProduct />);

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category");
    });

    // Output-based testing
    expect(await screen.findByText("Cat 1")).toBeInTheDocument();
    expect(await screen.findByText("Cat 2")).toBeInTheDocument();
  });

  it("does not set categories when API fails", async () => {
    axios.get.mockResolvedValueOnce({
      data: { success: false, category: [{ _id: "c1", name: "Cat 1" }] },
    });

    render(<CreateProduct />);

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category");
    });

    // Output-based testing
    expect(screen.queryByText("Cat 1")).not.toBeInTheDocument();
  });

  it("shows toast error when category fetch fails (axios.get rejects)", async () => {
    axios.get.mockRejectedValueOnce(new Error("network"));

    render(<CreateProduct />);

    // Output-based testing
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "Something went wrong in getting catgeory"
      );
    });
  });

  it("shows toast error and does not post when category is missing", async () => {
    axios.get.mockResolvedValueOnce({
      data: { success: true, category: [{ _id: "cat-id", name: "Cat 1" }] },
    });

    render(<CreateProduct />);

    await screen.findByText("Cat 1");

    fireEvent.click(screen.getByRole("button", { name: "CREATE PRODUCT" }));
    // Output-based testing
    expect(toast.error).toHaveBeenCalledWith("Category is required");

    // Communication-based testing
    expect(axios.post).not.toHaveBeenCalled();
  });

  it("posts FormData with expected fields when creating product", async () => {
    axios.get.mockResolvedValueOnce({
      data: { success: true, category: [{ _id: "cat-id", name: "Cat 1" }] },
    });
    axios.post.mockResolvedValueOnce({ data: { success: true } });

    render(<CreateProduct />);

    await loadAndSelectCategory("cat-id", "Cat 1");
    fireEvent.change(screen.getByPlaceholderText("write a name"), {
      target: { value: "P1" },
    });
    fireEvent.change(screen.getByPlaceholderText("write a description"), {
      target: { value: "D1" },
    });
    fireEvent.change(screen.getByPlaceholderText("write a Price"), {
      target: { value: "1234" },
    });
    fireEvent.change(screen.getByPlaceholderText("write a quantity"), {
      target: { value: "5" },
    });

    const file = new File(["img"], "p.png", { type: "image/png" });
    const fileInput = screen
      .getByText("Upload Photo")
      .querySelector("input[type='file']");
    fireEvent.change(fileInput, { target: { files: [file] } });

    fireEvent.click(screen.getByRole("button", { name: "CREATE PRODUCT" }));

    // Communication-based testing
    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledTimes(1);
      expect(axios.post).toHaveBeenCalledWith(
        "/api/v1/product/create-product",
        expect.any(FormDataMock)
      );
    });

    // State-based testing
    const sentFormData = axios.post.mock.calls[0][1];
    expect(sentFormData.append).toHaveBeenCalledWith("name", "P1");
    expect(sentFormData.append).toHaveBeenCalledWith("description", "D1");
    expect(sentFormData.append).toHaveBeenCalledWith("price", "1234");
    expect(sentFormData.append).toHaveBeenCalledWith("quantity", "5");
    expect(sentFormData.append).toHaveBeenCalledWith("photo", file);
    expect(sentFormData.append).toHaveBeenCalledWith("category", "cat-id");
  });

  it("shows a preview image when a photo is selected", async () => {
    axios.get.mockResolvedValueOnce({
      data: { success: true, category: [{ _id: "cat-id", name: "Cat 1" }] },
    });
    render(<CreateProduct />);
    const file = new File(["img"], "p.png", { type: "image/png" });
    const fileInput = screen
      .getByText("Upload Photo")
      .querySelector("input[type='file']");

    fireEvent.change(fileInput, { target: { files: [file] } });

    // Output-based testing
    const img = await screen.findByAltText("product_photo");
    expect(img).toBeInTheDocument();
    expect(global.URL.createObjectURL).toHaveBeenCalledWith(file);
  });

  it("shows toast error when create API throws error", async () => {
    axios.get.mockResolvedValueOnce({
      data: { success: true, category: [{ _id: "cat-id", name: "Cat 1" }] },
    });
    axios.post.mockRejectedValueOnce(new Error("create failed"));

    render(<CreateProduct />);

    await loadAndSelectCategory("cat-id", "Cat 1");

    fireEvent.click(screen.getByRole("button", { name: "CREATE PRODUCT" }));

    // Output-based testing
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("something went wrong");
    });
  });

  it("when create succeeds, shows success toast and navigates", async () => {
    axios.get.mockResolvedValueOnce({
      data: { success: true, category: [{ _id: "cat-id", name: "Cat 1" }] },
    });
    axios.post.mockResolvedValueOnce({
      data: { success: true, message: "Created" },
    });
    render(<CreateProduct />);
    await loadAndSelectCategory("cat-id", "Cat 1");

    fireEvent.click(screen.getByRole("button", { name: "CREATE PRODUCT" }));

    // Output-based testing
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("Product Created Successfully");
      expect(navigateMock).toHaveBeenCalledWith("/dashboard/admin/products");
    });
  });

  it("when create fails, shows error toast and does not navigate", async () => {
    axios.get.mockResolvedValueOnce({
      data: { success: true, category: [{ _id: "cat-id", name: "Cat 1" }] },
    });
    axios.post.mockResolvedValueOnce({
      data: { success: false, message: "Validation error" },
    });
    render(<CreateProduct />);
    await loadAndSelectCategory("cat-id", "Cat 1");

    fireEvent.click(screen.getByRole("button", { name: "CREATE PRODUCT" }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Validation error");
      expect(navigateMock).not.toHaveBeenCalled();
    });
  });
});