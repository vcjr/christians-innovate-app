import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MessageThread } from './MessageThread'
import { sendMessage } from '@/app/messages/actions'

jest.mock('next/navigation', () => ({ useRouter: () => mockRouter }))
jest.mock('@/app/messages/actions', () => ({ sendMessage: jest.fn(), loadEarlierMessages: jest.fn() }))
jest.mock('@/utils/supabase/client', () => ({ createClient: () => ({
  channel: () => mockChannel, removeChannel: jest.fn(),
}) }))
const mockRouter = { refresh: jest.fn(), replace: jest.fn() }
let mockInsert: (payload: { new: typeof savedMessage }) => void
interface MockChannel { on: jest.Mock; subscribe: jest.Mock }
const mockChannel: MockChannel = {
  on: jest.fn((_type, filter, callback) => {
    if (filter.event === 'INSERT') mockInsert = callback
    return mockChannel
  }),
  subscribe: jest.fn(() => mockChannel),
}
const savedMessage = {
  id: 'saved-1', sender_id: 'me', content: 'Hello', is_read: false,
  created_at: '2026-01-01T12:00:00Z',
}

it.each(['absent', 'before', 'after'])('reconciles a send when realtime is %s', async (timing) => {
  let resolveSend!: (value: Awaited<ReturnType<typeof sendMessage>>) => void
  jest.mocked(sendMessage).mockReturnValue(new Promise(resolve => { resolveSend = resolve }))
  render(<MessageThread conversationId="conversation" currentUserId="me"
    otherUser={{ user_id: 'other', full_name: 'Other', avatar_url: null }}
    initialMessages={[]} hasMore={false} conversationStatus="accepted" requestedBy={null} />)
  fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Hello' } })
  fireEvent.click(screen.getByRole('button', { name: 'Send message' }))
  expect(screen.getAllByText('Hello')).toHaveLength(1)
  if (timing === 'before') act(() => mockInsert({ new: savedMessage }))
  await act(async () => { resolveSend({ success: true, message: savedMessage }) })
  if (timing === 'after') act(() => mockInsert({ new: savedMessage }))
  await waitFor(() => expect(screen.getByText('Sent')).toBeInTheDocument())
  expect(screen.getAllByText('Hello')).toHaveLength(1)
})
