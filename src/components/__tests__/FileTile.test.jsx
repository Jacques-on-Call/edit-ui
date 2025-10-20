import { render, fireEvent, act } from '@testing-library/react';
import { vi } from 'vitest';
import FileTile from '../FileTile';

describe('FileTile', () => {
  const mockFile = { name: 'test.astro', type: 'file', sha: '12345' };

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('calls onLongPress after a 500ms press (mouse)', () => {
    const onLongPress = vi.fn();
    const { getByText } = render(<FileTile file={mockFile} onLongPress={onLongPress} />);

    const tile = getByText('Test');
    fireEvent.mouseDown(tile, { clientX: 100, clientY: 200 });

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(onLongPress).toHaveBeenCalledTimes(1);
    const [fileArg, coords] = onLongPress.mock.calls[0];
    expect(fileArg).toEqual(mockFile);
    expect(coords).toMatchObject({ clientX: 100, clientY: 200 });
  });

  it('calls onLongPress after a 500ms press (touch)', () => {
    const onLongPress = vi.fn();
    const { getByText } = render(<FileTile file={mockFile} onLongPress={onLongPress} />);

    const tile = getByText('Test');
    // jsdom doesn't fully implement TouchEvent; fireEvent.touchStart passes minimal data
    fireEvent.touchStart(tile, { touches: [{ clientX: 50, clientY: 60 }] });

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(onLongPress).toHaveBeenCalledTimes(1);
    const [fileArg, coords] = onLongPress.mock.calls[0];
    expect(fileArg).toEqual(mockFile);
    expect(coords).toMatchObject({ clientX: 50, clientY: 60 });
  });

  it('cancels long press on touch move beyond threshold', () => {
    const onLongPress = vi.fn();
    const { getByText } = render(<FileTile file={mockFile} onLongPress={onLongPress} />);

    const tile = getByText('Test');
    fireEvent.touchStart(tile, { touches: [{ clientX: 10, clientY: 10 }] });
    // Move far enough to cancel
    fireEvent.touchMove(tile, { touches: [{ clientX: 40, clientY: 45 }] });

    act(() => {
      vi.advanceTimersByTime(600);
    });

    expect(onLongPress).not.toHaveBeenCalled();
  });

  it('clears timer on touchend', () => {
    const onLongPress = vi.fn();
    const { getByText } = render(<FileTile file={mockFile} onLongPress={onLongPress} />);

    const tile = getByText('Test');
    fireEvent.touchStart(tile, { touches: [{ clientX: 10, clientY: 10 }] });
    fireEvent.touchEnd(tile);

    act(() => {
      vi.advanceTimersByTime(600);
    });

    expect(onLongPress).not.toHaveBeenCalled();
  });
});
