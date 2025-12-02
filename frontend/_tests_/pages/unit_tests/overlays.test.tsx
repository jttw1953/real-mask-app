import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import OverlaysPage from '../../../src/pages/Overlays';

// -------- Shared mocks / state --------

let mockOverlays: any[] = [];
const mockUploadOverlay = jest.fn();
const mockDeleteOverlay = jest.fn();

// -------- Module mocks --------

jest.mock('../../../src/components/useAppData', () => ({
  useAppData: () => ({
    overlays: mockOverlays,
    uploadOverlay: mockUploadOverlay,
    deleteOverlay: mockDeleteOverlay,
  }),
}));

jest.mock('../../../src/components/PageBackground', () => {
  return function MockPageBackground(props: any) {
    return <div>{props.children}</div>;
  };
});

jest.mock('../../../src/components/Navbar', () => {
  return function MockNavbar() {
    return <div>Navbar</div>;
  };
});

// -------- Reset before each test --------

beforeEach(() => {
  mockOverlays = [
    { id: 1, ownerId: 1, title: 'Cat Ears', url: '/cat.png' },
    { id: 2, ownerId: 1, title: 'Dog Nose', url: '/dog.png' },
    { id: 3, ownerId: 2, title: 'Party Hat', url: '' },
  ];

  mockUploadOverlay.mockReset();
  mockUploadOverlay.mockResolvedValue({ success: true });

  mockDeleteOverlay.mockReset();
  mockDeleteOverlay.mockResolvedValue({ success: true });
});

// -------- Tests --------

describe('OverlaysPage', () => {
  test('renders overlays list plus an "Add new" card', () => {
    render(<OverlaysPage />);

    // Page title
    const heading = screen.getByText(/Overlays/i);
    expect(heading).toBeTruthy();

    // Search box
    const searchBox = screen.getByPlaceholderText(/Search overlays/i);
    expect(searchBox).toBeTruthy();

    // Add new card
    const addNewCard = screen.getByText(/Add new/i);
    expect(addNewCard).toBeTruthy();

    // Overlay titles
    expect(screen.getByText('Cat Ears')).toBeTruthy();
    expect(screen.getByText('Dog Nose')).toBeTruthy();
    expect(screen.getByText('Party Hat')).toBeTruthy();
  });

  test('filters overlays based on search query (case-insensitive)', () => {
    render(<OverlaysPage />);

    const searchBox = screen.getByPlaceholderText(/Search overlays/i);

    // Type "cat" → only "Cat Ears" should remain visible
    fireEvent.change(searchBox, { target: { value: 'cat' } });

    expect(screen.getByText('Cat Ears')).toBeTruthy();

    const dog = screen.queryByText('Dog Nose');
    const party = screen.queryByText('Party Hat');
    expect(dog).toBeNull();
    expect(party).toBeNull();
  });

  test('selecting a file calls uploadOverlay and resets file input value', async () => {
    const { container } = render(<OverlaysPage />);

    // Hidden file input (not accessible via getByRole)
    const fileInput = container.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;

    // Simulate selecting a file
    const file = new File(['dummy'], 'overlay.png', { type: 'image/png' });

    // jsdom doesn't let us set files directly via property assignment, but we can fake the event target
    const event = {
      target: { files: [file] },
    } as unknown as React.ChangeEvent<HTMLInputElement>;

    await (fileInput.onchange as any)?.(event);

    await waitFor(() => {
      expect(mockUploadOverlay).toHaveBeenCalledWith(file);
    });

    // Our component manually resets the input's value to an empty string
    expect(fileInput.value).toBe('');
  });

  test('does not call uploadOverlay if no file is selected', async () => {
    const { container } = render(<OverlaysPage />);

    const fileInput = container.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;

    const event = {
      target: { files: [] },
    } as unknown as React.ChangeEvent<HTMLInputElement>;

    await (fileInput.onchange as any)?.(event);

    expect(mockUploadOverlay).not.toHaveBeenCalled();
  });

  test('clicking delete shows confirm; cancel prevents deleteOverlay call', async () => {
    // Spy on window.confirm
    const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(false);

    render(<OverlaysPage />);

    // There is one delete button per overlay card
    const deleteButtons = screen.getAllByRole('button', { name: '×' });
    expect(deleteButtons.length).toBe(3);

    // Click delete on first overlay
    fireEvent.click(deleteButtons[0]);

    expect(confirmSpy).toHaveBeenCalled();
    expect(mockDeleteOverlay).not.toHaveBeenCalled();

    confirmSpy.mockRestore();
  });

  test('clicking delete and confirming calls deleteOverlay with correct id', async () => {
    const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true);

    render(<OverlaysPage />);

    const deleteButtons = screen.getAllByRole('button', { name: '×' });
    // First button corresponds to overlay with id 1
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(mockDeleteOverlay).toHaveBeenCalledWith(1);
    });

    confirmSpy.mockRestore();
  });
});
