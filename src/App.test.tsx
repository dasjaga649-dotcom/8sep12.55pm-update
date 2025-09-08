import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders welcome heading on client page', () => {
  render(<App />);
  const heading = screen.getByText(/Your AI Partner/i);
  expect(heading).toBeInTheDocument();
});
