import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import axios from 'axios';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import '@testing-library/jest-dom/extend-expect';
import toast from 'react-hot-toast';
import Register from './Register';

// Mocking axios.post
jest.mock('axios');
jest.mock('react-hot-toast');

jest.mock('../../context/auth', () => ({
  useAuth: jest.fn(() => [null, jest.fn()]) // Mock useAuth hook to return null state and a mock function for setAuth
}));

jest.mock('../../context/cart', () => ({
  useCart: jest.fn(() => [null, jest.fn()]) // Mock useCart hook to return null state and a mock function
}));

jest.mock('../../context/search', () => ({
  useSearch: jest.fn(() => [{ keyword: '' }, jest.fn()]) // Mock useSearch hook to return null state and a mock function
}));

jest.mock('../../hooks/useCategory', () => jest.fn(() => []));

Object.defineProperty(window, 'localStorage', {
  value: {
    setItem: jest.fn(),
    getItem: jest.fn(),
    removeItem: jest.fn(),
  },
  writable: true,
});

window.matchMedia = window.matchMedia || function () {
  return {
    matches: false,
    addListener: function () { },
    removeListener: function () { }
  };
};


describe('Register Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => { });
  });

  it('should register the user successfully', async () => {
    axios.post.mockResolvedValueOnce({ data: { success: true } });
    //axios.get.mockResolvedValueOnce({ data: { category: [] } });

    const { getByText, getByPlaceholderText } = render(
      <MemoryRouter initialEntries={['/register']}>
        <Routes>
          <Route path="/register" element={<Register />} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.change(getByPlaceholderText('Enter Your Name'), { target: { value: 'John Doe' } });
    fireEvent.change(getByPlaceholderText('Enter Your Email'), { target: { value: 'test@example.com' } });
    fireEvent.change(getByPlaceholderText('Enter Your Password'), { target: { value: 'password123' } });
    fireEvent.change(getByPlaceholderText('Enter Your Phone'), { target: { value: '1234567890' } });
    fireEvent.change(getByPlaceholderText('Enter Your Address'), { target: { value: '123 Street' } });
    fireEvent.change(getByPlaceholderText('Enter Your DOB'), { target: { value: '2000-01-01' } });
    fireEvent.change(getByPlaceholderText('What is Your Favorite sports'), { target: { value: 'Football' } });

    fireEvent.click(getByText('REGISTER'));

    await waitFor(() => expect(axios.post).toHaveBeenCalled());
    expect(toast.success).toHaveBeenCalledWith('Register Successfully, please login');
  });

  it('should display error message on failed registration', async () => {
    axios.post.mockRejectedValueOnce({ message: 'User already exists' });
    //axios.get.mockResolvedValueOnce({ data: { category: [] } });

    const { getByText, getByPlaceholderText } = render(
      <MemoryRouter initialEntries={['/register']}>
        <Routes>
          <Route path="/register" element={<Register />} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.change(getByPlaceholderText('Enter Your Name'), { target: { value: 'John Doe' } });
    fireEvent.change(getByPlaceholderText('Enter Your Email'), { target: { value: 'test@example.com' } });
    fireEvent.change(getByPlaceholderText('Enter Your Password'), { target: { value: 'password123' } });
    fireEvent.change(getByPlaceholderText('Enter Your Phone'), { target: { value: '1234567890' } });
    fireEvent.change(getByPlaceholderText('Enter Your Address'), { target: { value: '123 Street' } });
    fireEvent.change(getByPlaceholderText('Enter Your DOB'), { target: { value: '2000-01-01' } });
    fireEvent.change(getByPlaceholderText('What is Your Favorite sports'), { target: { value: 'Football' } });

    fireEvent.click(getByText('REGISTER'));

    await waitFor(() => expect(axios.post).toHaveBeenCalled());
    expect(toast.error).toHaveBeenCalledWith('Something went wrong');
  });

  it('renders register form', () => {
    const { getByText, getByPlaceholderText } = render(
      <MemoryRouter initialEntries={['/register']}>
        <Routes>
          <Route path="/register" element={<Register />} />
        </Routes>
      </MemoryRouter>
    );

    expect(getByText('REGISTER FORM')).toBeInTheDocument();
    expect(getByPlaceholderText('Enter Your Name')).toBeInTheDocument();
    expect(getByPlaceholderText('Enter Your Email')).toBeInTheDocument();
    expect(getByPlaceholderText('Enter Your Password')).toBeInTheDocument();
    expect(getByPlaceholderText('Enter Your Phone')).toBeInTheDocument();
    expect(getByPlaceholderText('Enter Your Address')).toBeInTheDocument();
    expect(getByPlaceholderText('Enter Your DOB')).toBeInTheDocument();
    expect(getByPlaceholderText('What is Your Favorite sports')).toBeInTheDocument();
  });

  it('register inputs form should be initially empty', () => {
    const { getByText, getByPlaceholderText } = render(
      <MemoryRouter initialEntries={['/register']}>
        <Routes>
          <Route path="/register" element={<Register />} />
        </Routes>
      </MemoryRouter>
    );

    expect(getByText('REGISTER FORM')).toBeInTheDocument();
    expect(getByPlaceholderText('Enter Your Name').value).toBe('');
    expect(getByPlaceholderText('Enter Your Email').value).toBe('');
    expect(getByPlaceholderText('Enter Your Password').value).toBe('');
    expect(getByPlaceholderText('Enter Your Phone').value).toBe('');
    expect(getByPlaceholderText('Enter Your Address').value).toBe('');
    expect(getByPlaceholderText('Enter Your DOB').value).toBe('');
    expect(getByPlaceholderText('What is Your Favorite sports').value).toBe('');
  });

  it('should allow typing info into the register form', () => {
    const { getByText, getByPlaceholderText } = render(
      <MemoryRouter initialEntries={['/register']}>
        <Routes>
          <Route path="/register" element={<Register />} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.change(getByPlaceholderText('Enter Your Name'), { target: { value: 'Ben Ten' } });
    fireEvent.change(getByPlaceholderText('Enter Your Email'), { target: { value: 'ben10@nus.com' } });
    fireEvent.change(getByPlaceholderText('Enter Your Password'), { target: { value: 'myRealPassword123!' } });
    fireEvent.change(getByPlaceholderText('Enter Your Phone'), { target: { value: '07517053816' } });
    fireEvent.change(getByPlaceholderText('Enter Your Address'), { target: { value: 'Computing Drive 991' } });
    fireEvent.change(getByPlaceholderText('Enter Your DOB'), { target: { value: '1977-01-01' } });
    fireEvent.change(getByPlaceholderText('What is Your Favorite sports'), { target: { value: 'Pingpong' } });
    expect(getByPlaceholderText('Enter Your Name').value).toBe('Ben Ten');
    expect(getByPlaceholderText('Enter Your Email').value).toBe('ben10@nus.com');
    expect(getByPlaceholderText('Enter Your Password').value).toBe('myRealPassword123!');
    expect(getByPlaceholderText('Enter Your Phone').value).toBe('07517053816');
    expect(getByPlaceholderText('Enter Your Address').value).toBe('Computing Drive 991');
    expect(getByPlaceholderText('Enter Your DOB').value).toBe('1977-01-01');
    expect(getByPlaceholderText('What is Your Favorite sports').value).toBe('Pingpong');
  });

  it('should show toast notification error with error message from the server', async () => {
    axios.post.mockResolvedValueOnce({
      data: {
        success: false,
        message: "Sorry, we are maintenis"
      }
    });

    const { getByText, getByPlaceholderText } = render(
      <MemoryRouter initialEntries={['/register']}>
        <Routes>
          <Route path="/register" element={<Register />} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.change(getByPlaceholderText('Enter Your Name'), { target: { value: 'Ben Ten' } });
    fireEvent.change(getByPlaceholderText('Enter Your Email'), { target: { value: 'ben10@nus.com' } });
    fireEvent.change(getByPlaceholderText('Enter Your Password'), { target: { value: 'myRealPassword123!' } });
    fireEvent.change(getByPlaceholderText('Enter Your Phone'), { target: { value: '07517053816' } });
    fireEvent.change(getByPlaceholderText('Enter Your Address'), { target: { value: 'Computing Drive 991' } });
    fireEvent.change(getByPlaceholderText('Enter Your DOB'), { target: { value: '1977-01-01' } });
    fireEvent.change(getByPlaceholderText('What is Your Favorite sports'), { target: { value: 'Pingpong' } });
    fireEvent.click(getByText('REGISTER'));

    await waitFor(() => expect(axios.post).toHaveBeenCalled());
    expect(toast.error).toHaveBeenCalledWith("Sorry, we are maintenis");
  });
});
