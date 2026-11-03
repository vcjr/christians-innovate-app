import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { CreateGroupForm } from './create-group-form';
import { createGroup } from '../actions';

jest.mock('../actions', () => ({
  createGroup: jest.fn(),
}));

const mockedCreateGroup = createGroup as jest.MockedFunction<typeof createGroup>;

function fillForm() {
  fireEvent.change(screen.getByLabelText(/Group Name/), { target: { value: 'Morning Warriors' } });
  fireEvent.change(screen.getByLabelText(/Target Objective/), { target: { value: 'Build habits' } });
}

describe('CreateGroupForm', () => {
  it('only creates one group when the submit button is tapped multiple times', async () => {
    // Simulate a slow network: the action never resolves until we let it.
    let resolveAction: () => void = () => {};
    mockedCreateGroup.mockImplementation(
      () => new Promise((resolve) => { resolveAction = () => resolve(undefined as never); })
    );

    render(<CreateGroupForm />);
    fillForm();

    const button = screen.getByRole('button', { name: 'Create Group' });
    const form = button.closest('form')!;

    await act(async () => {
      fireEvent.submit(form);
      fireEvent.submit(form);
      fireEvent.submit(form);
    });

    await waitFor(() => expect(screen.getByRole('button', { name: 'Creating...' })).toBeDisabled());

    // Successful action (redirect) resolves; form must remain locked.
    await act(async () => {
      resolveAction();
    });

    await act(async () => {
      fireEvent.submit(form);
    });

    expect(mockedCreateGroup).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: 'Creating...' })).toBeDisabled();
  });

  it('re-enables the form and shows the error when creation fails', async () => {
    mockedCreateGroup.mockResolvedValueOnce({ error: 'Group name and target objective are required' });

    render(<CreateGroupForm />);
    fillForm();

    const form = screen.getByRole('button', { name: 'Create Group' }).closest('form')!;

    await act(async () => {
      fireEvent.submit(form);
    });

    expect(await screen.findByText('Group name and target objective are required')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create Group' })).not.toBeDisabled();

    mockedCreateGroup.mockRejectedValueOnce(new Error('Network error'));
    await act(async () => {
      fireEvent.submit(form);
    });

    expect(await screen.findByText('Network error')).toBeInTheDocument();
    expect(mockedCreateGroup).toHaveBeenCalledTimes(2);
    expect(screen.getByRole('button', { name: 'Create Group' })).not.toBeDisabled();
  });
});
