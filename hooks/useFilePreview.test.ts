import { renderHook, act } from '@testing-library/react';
import { useFilePreview } from './useFilePreview';

describe('useFilePreview', () => {
  const mockFile = new File([''], 'test.png', { type: 'image/png' });
  const mockUrl = 'blob:http://localhost/mock';

  beforeEach(() => {
    global.URL.createObjectURL = jest.fn().mockReturnValue(mockUrl);
    global.URL.revokeObjectURL = jest.fn();
  });

  it('should generate a preview URL for a file', () => {
    const { result } = renderHook(() => useFilePreview());
    
    let preview: string | null = null;
    act(() => {
      preview = result.current.getPreview('avatar', mockFile);
    });

    expect(preview).toBe(mockUrl);
    expect(global.URL.createObjectURL).toHaveBeenCalledWith(mockFile);
  });

  it('should revoke the old URL when a file is replaced', () => {
    const { result } = renderHook(() => useFilePreview());
    
    act(() => {
      result.current.getPreview('avatar', mockFile);
    });
    
    act(() => {
      result.current.getPreview('avatar', new File([''], 'new.png'));
    });

    expect(global.URL.revokeObjectURL).toHaveBeenCalledWith(mockUrl);
  });

  it('should revoke all URLs on unmount (Memory Management)', () => {
    const { result, unmount } = renderHook(() => useFilePreview());
    
    act(() => {
      result.current.getPreview('avatar', mockFile);
      result.current.getPreview('cover', mockFile);
    });

    unmount();

    expect(global.URL.revokeObjectURL).toHaveBeenCalledTimes(2);
    expect(global.URL.revokeObjectURL).toHaveBeenCalledWith(mockUrl);
  });
});