import { render, fireEvent, act } from '@testing-library/react';
import { vi } from 'vitest';
import FileTile from '../FileTile'; // Adjust the import path as needed

describe('FileTile', () => {
  const mockFile = {
    name: 'test.astro',
    type: 'file',
    sha: '12345',
  };

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('calls onLongPress after a 500ms press', () => {
    const onLongPress = vi.fn();
    const { getByText } = render(<FileTile file={mockFile} onLongPress={onLongPress} />);

    const tile = getByText('Test');
    fireEvent.mouseDown(tile, { clientX: 100, clientY: 200 });

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(onLongPress).toHaveBeenCalledTimes(1);
    expect(onLongPress).toHaveBeenCalledWith(mockFile, { clientX: 100, clientY: 200 });
  });

  it('does not call onLongPress if the press is shorter than 500ms', () => {
    const onLongPress = vi.fn();
    const { getByText } = render(<FileTile file={mockFile} onLongPress={onLongPress} />);

    const tile = getByText('Test');
    fireEvent.mouseDown(tile);

    act(() => {
      vi.advanceTimersByTime(499);
    });

    fireEvent.mouseUp(tile);

    expect(onLongPress).not.toHaveBeenCalled();
  });
});
