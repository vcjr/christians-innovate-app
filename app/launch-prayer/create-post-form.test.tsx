import { render, screen, fireEvent } from '@testing-library/react';
import { CreatePostForm } from './create-post-form';

jest.mock('./actions', () => ({
  createPost: jest.fn().mockResolvedValue({}),
}));

describe('CreatePostForm', () => {
  it('renders a unique CTA button for each post type', () => {
    render(<CreatePostForm />);

    expect(screen.getByRole('button', { name: /post launch alert/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /post prayer request/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /share a win/i })).toBeInTheDocument();
    expect(screen.queryByText(/share your update/i)).not.toBeInTheDocument();
  });

  it.each([
    ['Post Launch Alert', 'launch'],
    ['Post Prayer Request', 'prayer'],
    ['Share a Win', 'win'],
  ])('opens the form with the matching type when "%s" is clicked', (label, type) => {
    const { container } = render(<CreatePostForm />);

    fireEvent.click(screen.getByRole('button', { name: label }));

    const typeInput = container.querySelector('input[name="type"]') as HTMLInputElement;
    expect(typeInput.value).toBe(type);
    expect(screen.getByRole('button', { name: label })).toHaveAttribute('type', 'submit');
  });
});
