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

