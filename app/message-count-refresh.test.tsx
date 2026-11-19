import { act, render } from '@testing-library/react'
import { MessageCountRefresh } from './message-count-refresh'

const mockRouter = { refresh: jest.fn() }
let mockChange: () => void
const mockRemoveChannel = jest.fn()
interface MockChannel { on: jest.Mock; subscribe: jest.Mock }
const mockChannel: MockChannel = {
  on: jest.fn((_type, _filter, callback) => { mockChange = callback; return mockChannel }),
  subscribe: jest.fn(() => mockChannel),
}
jest.mock('next/navigation', () => ({ useRouter: () => mockRouter }))
jest.mock('@/utils/supabase/client', () => ({ createClient: () => ({
  channel: () => mockChannel, removeChannel: mockRemoveChannel,
}) }))

it('refreshes mounted navigation on messages and fallback polling, then cleans up', () => {
  jest.useFakeTimers()
  const { unmount } = render(<MessageCountRefresh userId="me" />)
  act(() => { mockChange(); mockChange(); jest.advanceTimersByTime(200) })
  expect(mockRouter.refresh).toHaveBeenCalledTimes(1)
  act(() => { jest.advanceTimersByTime(30_000) })
  expect(mockRouter.refresh).toHaveBeenCalledTimes(2)
  unmount()
  act(() => { jest.advanceTimersByTime(60_000); window.dispatchEvent(new Event('focus')) })
  expect(mockRouter.refresh).toHaveBeenCalledTimes(2)
  expect(mockRemoveChannel).toHaveBeenCalledWith(mockChannel)
  jest.useRealTimers()
})
