import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../api.js'; // Import the centralized API instance
import './Auth.css';

const Auth = () => {
    const [isSignup, setIsSignup] = useState(true);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        const { name, email, password } = e.target.elements;

        // Prepare the user payload
        const user = {
            name: name?.value,
            email: email.value,
            password: password.value,
        };

        try {
            // Define the endpoint for signup or login
            const url = isSignup ? '/api/auth/signup' : '/api/auth/login';

            // Make the API call using the centralized axios instance
            const response = await api.post(url, user, {
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            // Store the token and navigate to the dashboard
            localStorage.setItem('token', response.data.token);
            navigate('/dashboard');
        } catch (error) {
            // Enhanced error handling
            console.error(`${isSignup ? 'Signup' : 'Login'} error`, error);
            if (error.response) {
                // Log backend response data for debugging
                console.error('Error response data:', error.response.data);
                alert(`Error: ${error.response.data.message || 'An error occurred during the process.'}`);
            } else {
                alert('Network error. Please try again.');
            }
        }
    };

    return (
        <div className="auth-main">
            {/* Toggle between Signup and Login */}
            <input
                type="checkbox"
                id="auth-chk"
                aria-hidden="true"
                checked={!isSignup}
                onChange={() => setIsSignup(!isSignup)}
            />

            {/* Signup Form */}
            <div className="auth-signup">
                <form className="auth-form" onSubmit={handleSubmit}>
                    <label className="auth-label" htmlFor="auth-chk" aria-hidden="true">Sign Up</label>
                    <input
                        className="auth-input"
                        type="text"
                        name="name"
                        placeholder="User name"
                        required={isSignup}
                    />
                    <input
                        className="auth-input"
                        type="email"
                        name="email"
                        placeholder="Email"
                        required
                    />
                    <input
                        className="auth-input"
                        type="password"
                        name="password"
                        placeholder="Password"
                        required
                    />
                    <button className="auth-button" type="submit">Sign up</button>
                </form>
            </div>

            {/* Login Form */}
            <div className="auth-login">
                <form className="auth-form" onSubmit={handleSubmit}>
                    <label className="auth-label" htmlFor="auth-chk" aria-hidden="true">Login</label>
                    <input
                        className="auth-input"
                        type="email"
                        name="email"
                        placeholder="Email"
                        required
                    />
                    <input
                        className="auth-input"
                        type="password"
                        name="password"
                        placeholder="Password"
                        required
                    />
                    <button className="auth-button" type="submit">Login</button>
                </form>
            </div>
        </div>
    );
};

export default Auth;
