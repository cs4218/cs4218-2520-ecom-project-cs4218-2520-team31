// Brenna Lauren Tan Jia Ern, A0254710M

import { render, waitFor, screen} from "@testing-library/react";
import React from "react";
import Orders from "../user/Orders";
import axios from "axios";

jest.mock('axios');

const mockUseAuth = jest.fn();

jest.mock('../../context/auth', () => ({
  useAuth: () => mockUseAuth(),
}));

jest.mock('moment', () => () => ({ fromNow: () => 'some time ago' }));
jest.mock('../../components/UserMenu', () => () => <div />);
jest.mock('../../components/Layout', () => ({ children }) => <div>{children}</div>);

describe('Orders Component: Data Fetching & Side Effects', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    axios.get.mockReset();
    mockUseAuth.mockReset();
  });

  it('should call orders API when auth token exists', async () => {
    // Arrange
    mockUseAuth.mockReturnValue([{ token: "abc" }, jest.fn()]);
    axios.get.mockResolvedValueOnce({ data: [] });

    // Act
    render(<Orders />);

    // Assert
    await waitFor(() => expect(axios.get).toHaveBeenCalled());
    expect(axios.get).toHaveBeenCalledWith('/api/v1/auth/orders');
  });

  it('should not call orders API when auth token is absent', async () => {
    // Arrange
    mockUseAuth.mockReturnValue([{ token: null }, jest.fn()]);

    // Act
    render(<Orders />);

    // Assert
    await waitFor(() => {
      expect(axios.get).not.toHaveBeenCalled();
    });
  });

  it('should handle API errors without crashing component', async () => {
    // Arrange
    mockUseAuth.mockReturnValue([{ token: "abc" }, jest.fn()]);
    axios.get.mockRejectedValueOnce(new Error("Network error"));

    const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});

    // Act
    render(<Orders />);

    // Assert
    expect(screen.getByText("All Orders")).toBeInTheDocument();

    await waitFor(() => {
      expect(logSpy).toHaveBeenCalled();
    });

    logSpy.mockRestore();
  });
});

describe("Orders component: UI Rendering", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    axios.get.mockReset();
    mockUseAuth.mockReset();
  })

  it(('renders order information'), async () => {
    // Arrange
    mockUseAuth.mockReturnValue([{ token: "abc" }, jest.fn()]);
    axios.get.mockResolvedValueOnce({
      data: [
        {
          _id: "order1",
          status: "Processing",
          buyer: { name: "Alice" },
          payment: { success: true },
          products: [
            {
              _id: "product1",
              name: 'Test Product 1',
              description: "product1 description",
              price: 10
            },
            {
              _id: "product2",
              name: 'Test Product 2',
              description: "product2 description",
              price: 20
            }
          ],
          createAt: new Date().toISOString(),
        },
      ],
    });

    // Act
    render(<Orders />);

    // Assert
    expect(await screen.findByText("1")).toBeInTheDocument(); // order index
    expect(await screen.findByText("Processing")).toBeInTheDocument(); // order status
    expect(await screen.findByText("Alice")).toBeInTheDocument(); // buyer name
    expect(await screen.findByText("Success")).toBeInTheDocument(); // payment status
    expect(await screen.findByText("2")).toBeInTheDocument(); // product quantity
  });

  it(('renders product information'), async () => {
    // Arrange
    mockUseAuth.mockReturnValue([{ token: "abc" }, jest.fn()]);
    axios.get.mockResolvedValueOnce({
      data: [
        {
          _id: "order1",
          status: "Processing",
          buyer: { name: "Alice" },
          payment: { success: true },
          products: [
            {
              _id: "product1",
              name: 'Test Product 1',
              description: "product1 description",
              price: 10
            },
          ],
          createAt: new Date().toISOString(),
        },
      ],
    });

    // Act
    render(<Orders />);

    // Assert
    expect(await screen.findByText("Test Product 1")).toBeInTheDocument(); // product name
    expect(await screen.getByText(/product1 description/i)).toBeInTheDocument(); // product description
    expect(await screen.getByText("Price : 10")).toBeInTheDocument(); // product price
    const img = screen.getByRole("img"); 
    expect(img).toHaveAttribute("src", expect.stringContaining("/api/v1/product/product-photo/product1")); // product image URL
  });

  it(('renders when order is empty'), async () => {
    // Arrange
    mockUseAuth.mockReturnValue([{ token: "abc" }, jest.fn()]);
    axios.get.mockResolvedValueOnce({data: [ ]});

    // Act
    render(<Orders />);

    // Assert
    expect(await screen.findByText("All Orders")).toBeInTheDocument();
    expect(screen.queryByText("Processing")).not.toBeInTheDocument();
  });

  it(('renders when product list is empty'), async () => {
    // Arrange
    mockUseAuth.mockReturnValue([{ token: "abc" }, jest.fn()]);
    axios.get.mockResolvedValueOnce({
      data: [
        {
          _id: "order1",
          status: "Processing",
          buyer: { name: "Alice" },
          payment: { success: false },
          products: [],
          createAt: new Date().toISOString(),
        },
      ],
    });

    // Act
    render(<Orders />);

    // Assert
    expect(await screen.findByText("Status")).toBeInTheDocument(); // wait for table to appear
    expect(screen.getByText("Processing")).toBeInTheDocument(); // status
    expect(screen.getByText("Alice")).toBeInTheDocument(); // buyer name
    expect(screen.getByText("Failed")).toBeInTheDocument(); // payment status
    expect(screen.getByText("0")).toBeInTheDocument(); // quantity
  });
})