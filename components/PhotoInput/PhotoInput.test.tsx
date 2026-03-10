import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import PhotoInput from './PhotoInput';
import * as persistence from '@/utils/storage/filePersistence';

// Mock URL.createObjectURL and revokeObjectURL for image previews
const mockCreateObjectURL = jest.fn();
const mockRevokeObjectURL = jest.fn();
global.URL.createObjectURL = mockCreateObjectURL;
global.URL.revokeObjectURL = mockRevokeObjectURL;

// Pillar: Maintenance - Mock the persistence utility to isolate component logic
jest.mock('@/utils/storage/filePersistence', () => ({
  setPersistedFile: jest.fn(),
  getPersistedFile: jest.fn(),
  clearPersistedFile: jest.fn(),
}));

describe('PhotoInput Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateObjectURL.mockReturnValue('mock-url');
    (persistence.getPersistedFile as jest.Mock).mockResolvedValue(null);
  });

  it('renders the file input with the correct label', () => {
    render(<PhotoInput label="Profile Photo" name="photo" onChange={() => {}} />);
    expect(screen.getByLabelText('Profile Photo')).toBeInTheDocument();
    expect(screen.getByLabelText('Profile Photo')).toHaveAttribute('type', 'file');
  });

  it('calls onChange with the selected file', async () => {
    const handleChange = jest.fn();
    render(<PhotoInput label="Photo" name="photo" onChange={handleChange} />);
    
    const file = new File(['hello'], 'hello.png', { type: 'image/png' });
    const input = screen.getByLabelText('Photo');

    fireEvent.change(input, { target: { files: [file] } });

    expect(handleChange).toHaveBeenCalledWith(file);
    // Pillar: Scalability - Ensure selection is mirrored to IndexedDB
    expect(persistence.setPersistedFile).toHaveBeenCalledWith('photo', file);
  });

  it('restores a persisted file from IndexedDB on mount', async () => {
    const persistedFile = new File(['restored'], 'old.png', { type: 'image/png' });
    (persistence.getPersistedFile as jest.Mock).mockResolvedValue(persistedFile);
    const handleChange = jest.fn();

    render(<PhotoInput label="Photo" name="photo" onChange={handleChange} />);

    await waitFor(() => {
      expect(persistence.getPersistedFile).toHaveBeenCalledWith('photo');
    });

    // Pillar: A11y - Visual confirmation that data was restored
    const preview = await screen.findByAltText('Preview');
    expect(preview).toHaveAttribute('src', 'mock-url');
    expect(handleChange).toHaveBeenCalledWith(persistedFile);
  });

  it('displays an image preview when a file is selected', async () => {
    render(<PhotoInput label="Photo" name="photo" onChange={() => {}} />);
    
    const file = new File(['hello'], 'hello.png', { type: 'image/png' });
    const input = screen.getByLabelText('Photo');

    fireEvent.change(input, { target: { files: [file] } });

    const preview = await screen.findByAltText('Preview');
    expect(preview).toHaveAttribute('src', 'mock-url');
  });

  it('displays an error message via FieldLayout', () => {
    render(
      <PhotoInput 
        label="Photo" 
        name="photo" 
        onChange={() => {}} 
        error="File too large" 
      />
    );
    expect(screen.getByText('File too large')).toBeInTheDocument();
  });
});