// Fajar Ibnu Fatihan, A0314606L

import React from 'react';
import { render, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import axios from 'axios';
import { AuthProvider, useAuth } from './auth';

global.React = React;

const TestComponent = () => {
    const [auth, setAuth] = useAuth();
    return (
        <div>
            <span data-testid="user">{JSON.stringify(auth.user)}</span>
            <span data-testid="token">{auth.token}</span>
        </div>
    );
};

describe('AuthContext', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, 'log').mockImplementation(() => { });
    });

    it('should provide default auth state with null user and empty token', () => {
        const { getByTestId } = render(
            <AuthProvider>
                <TestComponent />
            </AuthProvider>
        );

        expect(getByTestId('user').textContent).toBe('null');
        expect(getByTestId('token').textContent).toBe('');
    });

    it('should set axios default authorization header', () => {
        render(
            <AuthProvider>
                <TestComponent />
            </AuthProvider>
        );

        expect(axios.defaults.headers.common['Authorization']).toBe('');
    });

    it('should load auth data from localStorage on mount', async () => {
        const mockAuthData = {
            user: { id: 1, name: 'Ben Ten', email: 'ben10@nus.com' },
            token: 'this-is-the-fake-tokeeenn????',
        };

        jest.spyOn(Storage.prototype, 'getItem').mockReturnValue(
            JSON.stringify(mockAuthData)
        );

        const { getByTestId } = render(
            <AuthProvider>
                <TestComponent />
            </AuthProvider>
        );

        await waitFor(() => {
            expect(getByTestId('user').textContent).toBe(
                JSON.stringify(mockAuthData.user)
            );
            expect(getByTestId('token').textContent).toBe('this-is-the-fake-tokeeenn????');
        });

        expect(localStorage.getItem).toHaveBeenCalledWith('auth');
    });

    it('should keep default state when localStorage is empty', () => {
        jest.spyOn(Storage.prototype, 'getItem').mockReturnValue(null);

        const { getByTestId } = render(
            <AuthProvider>
                <TestComponent />
            </AuthProvider>
        );

        expect(getByTestId('user').textContent).toBe('null');
        expect(getByTestId('token').textContent).toBe('');
        expect(localStorage.getItem).toHaveBeenCalledWith('auth');
    });

    it('should provide auth and setAuth via useAuth hook', () => {
        let hookResult;

        const HookTestComponent = () => {
            hookResult = useAuth();
            return null;
        };

        render(
            <AuthProvider>
                <HookTestComponent />
            </AuthProvider>
        );

        expect(hookResult).toHaveLength(2);
        expect(hookResult[0]).toEqual({ user: null, token: '' });
        expect(typeof hookResult[1]).toBe('function');
    });
});