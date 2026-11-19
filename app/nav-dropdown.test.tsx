import { fireEvent, render, screen } from '@testing-library/react'
import { NavDropdown } from './nav-dropdown'

it('uses disclosure semantics and returns focus to the open trigger on Escape', () => {
  render(<><NavDropdown label="Discover" icon={null}
    items={[{ href: '/resources', label: 'Resources', icon: null }]} />
    <NavDropdown label="Community" icon={null} items={[]} /></>)
  const trigger = screen.getByRole('button', { name: 'Discover' })
  expect(trigger).not.toHaveAttribute('aria-haspopup')
  fireEvent.click(trigger)
  const link = screen.getByRole('link', { name: 'Resources' })
  expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  link.focus()
  fireEvent.keyDown(link, { key: 'Escape' })
  expect(trigger).toHaveFocus()
  expect(trigger).toHaveAttribute('aria-expanded', 'false')
  expect(screen.queryByRole('link', { name: 'Resources' })).not.toBeInTheDocument()
})
