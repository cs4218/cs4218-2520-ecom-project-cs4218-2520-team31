import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import UpdateProduct from "./UpdateProduct";
import axios from "axios";
import toast from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";

jest.mock("axios");
jest.mock("react-hot-toast", () => ({
  success: jest.fn(),
  error: jest.fn(),
}));
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: jest.fn(),
  useParams: jest.fn(),
}));

jest.mock("./../../components/Layout", () => {
  return ({ children }) => <div data-testid="layout">{children}</div>;
});
jest.mock("./../../components/AdminMenu", () => {
  return () => <div data-testid="admin-menu" />;
});
jest.mock("antd", () => {
  const React = require("react");
  const Select = ({ children, onChange, placeholder, value }) => (
    <select
      aria-label={placeholder || "select"}
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
    >
      {/* empty */}
      <option value="" />
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

const buildProduct = (overrides = {}) => ({
  _id: "pid-1",
  name: "Old Name",
  description: "Old Description",
  price: 100,
  quantity: 3,
  shipping: true,
  category: { _id: "cat-1", name: "Cat 1" },
  ...overrides,
});

describe("UpdateProduct Unit Tests", () => {
  let navigateMock;
  let consoleErrorSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    navigateMock = jest.fn();
    useNavigate.mockReturnValue(navigateMock);
    useParams.mockReturnValue({ slug: "test-slug" });

    installFormDataMock();
    installCreateObjectURLMock();
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => { });
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it("fetches single product and categories on mount and populates form fields", async () => {
    const product = buildProduct();
    const categories = [
      { _id: "cat-1", name: "Cat 1" },
      { _id: "cat-2", name: "Cat 2" },
    ];
    axios.get.mockImplementation((url) => {
      if (url === "/api/v1/product/get-product/test-slug") {
        return Promise.resolve({ data: { product } });
      }
      if (url === "/api/v1/category/get-category") {
        return Promise.resolve({ data: { success: true, category: categories } });
      }
      return Promise.reject(new Error("Unexpected URL: " + url));
    });

    render(<UpdateProduct />);

    // Communication-based testing
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith("/api/v1/product/get-product/test-slug");
      expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category");
    });

    // Output-based testing
    expect(await screen.findByDisplayValue("Old Name")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Old Description")).toBeInTheDocument();
    expect(screen.getByDisplayValue("100")).toBeInTheDocument();
    expect(screen.getByDisplayValue("3")).toBeInTheDocument();
    expect(await screen.findByText("Cat 1")).toBeInTheDocument();
    expect(await screen.findByText("Cat 2")).toBeInTheDocument();
    const img = screen.getByAltText("product_photo");
    expect(img.getAttribute("src")).toBe("/api/v1/product/product-photo/pid-1");
  });

  it("does not set categories when category API fails", async () => {
    const product = buildProduct();
    axios.get.mockImplementation((url) => {
      if (url === "/api/v1/product/get-product/test-slug") {
        return Promise.resolve({ data: { product } });
      }
      if (url === "/api/v1/category/get-category") {
        return Promise.resolve({
          data: { success: false, category: [{ _id: "cat-x", name: "ShouldNotShow" }] },
        });
      }
      return Promise.reject(new Error("Unexpected URL: " + url));
    });

    render(<UpdateProduct />);

    await screen.findByDisplayValue("Old Name");
    expect(screen.queryByText("ShouldNotShow")).not.toBeInTheDocument();
  });

  it("shows a preview image when a new photo is selected", async () => {
    const product = buildProduct();
    axios.get.mockImplementation((url) => {
      if (url === "/api/v1/product/get-product/test-slug") {
        return Promise.resolve({ data: { product } });
      }
      if (url === "/api/v1/category/get-category") {
        return Promise.resolve({ data: { success: true, category: [] } });
      }
      return Promise.reject(new Error("Unexpected URL: " + url));
    });

    render(<UpdateProduct />);

    await screen.findByDisplayValue("Old Name");
    const file = new File(["img"], "p.png", { type: "image/png" });
    const fileInput = screen
      .getByText("Upload Photo")
      .querySelector("input[type='file']");
    fireEvent.change(fileInput, { target: { files: [file] } });
    // Output-based testing
    const img = screen.getByAltText("product_photo");
    expect(global.URL.createObjectURL).toHaveBeenCalledWith(file);
    expect(img.getAttribute("src")).toBe("blob://mock-photo");
  });

  it("clicking UPDATE PRODUCT calls PUT axios with FormData", async () => {
    const product = buildProduct({
      _id: "pid-777",
      category: { _id: "cat-1", name: "Cat 1" },
    });
    axios.get.mockImplementation((url) => {
      if (url === "/api/v1/product/get-product/test-slug") {
        return Promise.resolve({ data: { product } });
      }
      if (url === "/api/v1/category/get-category") {
        return Promise.resolve({
          data: {
            success: true,
            category: [
              { _id: "cat-1", name: "Cat 1" },
              { _id: "cat-2", name: "Cat 2" },
            ],
          },
        });
      }
      return Promise.reject(new Error("Unexpected URL: " + url));
    });
    axios.put.mockResolvedValueOnce({ data: { success: true, message: "Updated" } });

    render(<UpdateProduct />);

    await screen.findByDisplayValue("Old Name");
    await screen.findByText("Cat 1");
    await screen.findByText("Cat 2");

    fireEvent.change(screen.getByPlaceholderText("write a name"), {
      target: { value: "New Name" },
    });
    fireEvent.change(screen.getByPlaceholderText("write a description"), {
      target: { value: "New Desc" },
    });
    fireEvent.change(screen.getByPlaceholderText("write a Price"), {
      target: { value: "999" },
    });
    fireEvent.change(screen.getByPlaceholderText("write a quantity"), {
      target: { value: "10" },
    });
    fireEvent.change(screen.getByLabelText("Select a category"), {
      target: { value: "cat-2" },
    });

    fireEvent.click(screen.getByRole("button", { name: "UPDATE PRODUCT" }));

    // Communication-based testing
    await waitFor(() => {
      expect(axios.put).toHaveBeenCalledTimes(1);
      expect(axios.put).toHaveBeenCalledWith(
        "/api/v1/product/update-product/pid-777",
        expect.any(FormDataMock)
      );
    });

    // State-based testing
    const sentFormData = axios.put.mock.calls[0][1];
    expect(sentFormData.append).toHaveBeenCalledWith("name", "New Name");
    expect(sentFormData.append).toHaveBeenCalledWith("description", "New Desc");
    expect(sentFormData.append).toHaveBeenCalledWith("price", "999");
    expect(sentFormData.append).toHaveBeenCalledWith("quantity", "10");
    expect(sentFormData.append).toHaveBeenCalledWith("category", "cat-2");
  });

  it("does NOT append photo when no new photo is selected", async () => {
    const product = buildProduct({ _id: "pid-no-photo" });
    axios.get.mockImplementation((url) => {
      if (url === "/api/v1/product/get-product/test-slug") {
        return Promise.resolve({ data: { product } });
      }
      if (url === "/api/v1/category/get-category") {
        return Promise.resolve({ data: { success: true, category: [] } });
      }
      return Promise.reject(new Error("Unexpected URL: " + url));
    });
    axios.put.mockResolvedValueOnce({ data: { success: true } });
    render(<UpdateProduct />);
    await screen.findByDisplayValue("Old Name");

    fireEvent.click(screen.getByRole("button", { name: "UPDATE PRODUCT" }));

    await waitFor(() => expect(axios.put).toHaveBeenCalled());
    const sentFormData = axios.put.mock.calls[0][1];
    const calls = sentFormData.append.mock.calls;
    const hasPhotoAppend = calls.some(([k]) => k === "photo");
    expect(hasPhotoAppend).toBe(false);
  });

  it("appends photo when new photo is selected", async () => {
    const product = buildProduct({ _id: "pid-with-photo" });
    axios.get.mockImplementation((url) => {
      if (url === "/api/v1/product/get-product/test-slug") {
        return Promise.resolve({ data: { product } });
      }
      if (url === "/api/v1/category/get-category") {
        return Promise.resolve({ data: { success: true, category: [] } });
      }
      return Promise.reject(new Error("Unexpected URL: " + url));
    });
    axios.put.mockResolvedValueOnce({ data: { success: true } });
    render(<UpdateProduct />);
    await screen.findByDisplayValue("Old Name");

    const file = new File(["img"], "p.png", { type: "image/png" });
    const fileInput = screen
      .getByText("Upload Photo")
      .querySelector("input[type='file']");
    fireEvent.change(fileInput, { target: { files: [file] } });

    fireEvent.click(screen.getByRole("button", { name: "UPDATE PRODUCT" }));

    await waitFor(() => expect(axios.put).toHaveBeenCalled());
    const sentFormData = axios.put.mock.calls[0][1];
    expect(sentFormData.append).toHaveBeenCalledWith("photo", file);
  });

  it("shows success toast and navigates when update succeeds", async () => {
    const product = buildProduct({ _id: "pid-ok" });
    axios.get.mockImplementation((url) => {
      if (url === "/api/v1/product/get-product/test-slug") {
        return Promise.resolve({ data: { product } });
      }
      if (url === "/api/v1/category/get-category") {
        return Promise.resolve({ data: { success: true, category: [] } });
      }
      return Promise.reject(new Error("Unexpected URL: " + url));
    });
    axios.put.mockResolvedValueOnce({ data: { success: true, message: "Updated" } });
    render(<UpdateProduct />);
    await screen.findByDisplayValue("Old Name");

    fireEvent.click(screen.getByRole("button", { name: "UPDATE PRODUCT" }));

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("Product Updated Successfully");
      expect(navigateMock).toHaveBeenCalledWith("/dashboard/admin/products");
    });
  });

  it("shows toast error when update API throws error", async () => {
    const product = buildProduct({ _id: "pid-err" });
    axios.get.mockImplementation((url) => {
      if (url === "/api/v1/product/get-product/test-slug") {
        return Promise.resolve({ data: { product } });
      }
      if (url === "/api/v1/category/get-category") {
        return Promise.resolve({ data: { success: true, category: [] } });
      }
      return Promise.reject(new Error("Unexpected URL: " + url));
    });

    axios.put.mockRejectedValueOnce(new Error("update failed"));
    render(<UpdateProduct />);
    await screen.findByDisplayValue("Old Name");

    fireEvent.click(screen.getByRole("button", { name: "UPDATE PRODUCT" }));

    // Output-based testing
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("something went wrong");
    });
  });

  it("shows toast error and does not navigate when update API fails", async () => {
    const product = buildProduct({ _id: "pid-fail" });
    axios.get.mockImplementation((url) => {
      if (url === "/api/v1/product/get-product/test-slug") {
        return Promise.resolve({ data: { product } });
      }
      if (url === "/api/v1/category/get-category") {
        return Promise.resolve({ data: { success: true, category: [] } });
      }
      return Promise.reject(new Error("Unexpected URL: " + url));
    });

    axios.put.mockResolvedValueOnce({
      data: { success: false, message: "Validation error" },
    });
    render(<UpdateProduct />);
    await screen.findByDisplayValue("Old Name");

    fireEvent.click(screen.getByRole("button", { name: "UPDATE PRODUCT" }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Validation error");
      expect(navigateMock).not.toHaveBeenCalled();
    });
  });

  it("does not call DELETE axios when cancelling DELETE PRODUCT prompts", async () => {
    const product = buildProduct({ _id: "pid-del" });
    axios.get.mockImplementation((url) => {
      if (url === "/api/v1/product/get-product/test-slug") {
        return Promise.resolve({ data: { product } });
      }
      if (url === "/api/v1/category/get-category") {
        return Promise.resolve({ data: { success: true, category: [] } });
      }
      return Promise.reject(new Error("Unexpected URL: " + url));
    });
    jest.spyOn(window, "prompt").mockReturnValueOnce("");
    render(<UpdateProduct />);
    await screen.findByDisplayValue("Old Name");

    fireEvent.click(screen.getByRole("button", { name: "DELETE PRODUCT" }));

    expect(window.prompt).toHaveBeenCalled();
    expect(axios.delete).not.toHaveBeenCalled();
    window.prompt.mockRestore();
  });

  it("calls DELETE axios when DELETE PRODUCT is confirmed and navigates", async () => {
    const product = buildProduct({ _id: "pid-del-ok" });
    axios.get.mockImplementation((url) => {
      if (url === "/api/v1/product/get-product/test-slug") {
        return Promise.resolve({ data: { product } });
      }
      if (url === "/api/v1/category/get-category") {
        return Promise.resolve({ data: { success: true, category: [] } });
      }
      return Promise.reject(new Error("Unexpected URL: " + url));
    });
    jest.spyOn(window, "prompt").mockReturnValueOnce("yes");
    axios.delete.mockResolvedValueOnce({ data: { success: true } });

    render(<UpdateProduct />);
    await screen.findByDisplayValue("Old Name");

    fireEvent.click(screen.getByRole("button", { name: "DELETE PRODUCT" }));

    // Communication-based testing
    await waitFor(() => {
      expect(axios.delete).toHaveBeenCalledWith("/api/v1/product/delete-product/pid-del-ok");
    });

    // Output-based testing
    expect(toast.success).toHaveBeenCalledWith("Product Deleted Successfully");
    expect(navigateMock).toHaveBeenCalledWith("/dashboard/admin/products");
    window.prompt.mockRestore();
  });

  it("shows delete confirmation prompt message", async () => {
    const product = {
      _id: "pid-prompt",
      name: "Test",
      description: "Desc",
      price: 10,
      quantity: 1,
      shipping: true,
      category: { _id: "cat-1", name: "Cat 1" },
    };
    axios.get.mockImplementation((url) => {
      if (url === "/api/v1/product/get-product/test-slug") {
        return Promise.resolve({ data: { product } });
      }
      if (url === "/api/v1/category/get-category") {
        return Promise.resolve({ data: { success: true, category: [] } });
      }
      return Promise.reject(new Error("Unexpected URL: " + url));
    });
    const promptSpy = jest.spyOn(window, "prompt").mockReturnValueOnce("");
    render(<UpdateProduct />);
    await screen.findByDisplayValue("Test");

    fireEvent.click(screen.getByRole("button", { name: "DELETE PRODUCT" }));

    expect(promptSpy).toHaveBeenCalledWith(
      "Are you sure you want to delete this product?"
    );

    promptSpy.mockRestore();
  });

  it("shows toast error when delete API throws error", async () => {
    const product = buildProduct({ _id: "pid-del-err" });
    axios.get.mockImplementation((url) => {
      if (url === "/api/v1/product/get-product/test-slug") {
        return Promise.resolve({ data: { product } });
      }
      if (url === "/api/v1/category/get-category") {
        return Promise.resolve({ data: { success: true, category: [] } });
      }
      return Promise.reject(new Error("Unexpected URL: " + url));
    });
    jest.spyOn(window, "prompt").mockReturnValueOnce("yes");
    axios.delete.mockRejectedValueOnce(new Error("delete failed"));

    render(<UpdateProduct />);
    await screen.findByDisplayValue("Old Name");

    fireEvent.click(screen.getByRole("button", { name: "DELETE PRODUCT" }));

    // Output-based testing
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Something went wrong");
    });

    window.prompt.mockRestore();
  });

  it("shows toast error when category GET axios throws error", async () => {
    const product = buildProduct();
    axios.get.mockImplementation((url) => {
      if (url === "/api/v1/product/get-product/test-slug") {
        return Promise.resolve({ data: { product } });
      }
      if (url === "/api/v1/category/get-category") {
        return Promise.reject(new Error("cat fetch failed"));
      }
      return Promise.reject(new Error("Unexpected URL: " + url));
    });

    render(<UpdateProduct />);

    // Output-based testing
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "Something went wrong in getting catgeory"
      );
    });
  });
});