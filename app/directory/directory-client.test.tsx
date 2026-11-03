import { render, screen, fireEvent, act } from '@testing-library/react';
import { DirectoryClient, filterProfiles } from './directory-client';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: jest.fn() }),
}));

jest.mock('@/app/accountability/actions', () => ({
  sendGroupInvitation: jest.fn(),
}));

const baseProfile = {
  avatar_url: null,
  looking_for_business_partner: false,
  looking_for_accountability_partner: false,
  linkedin_url: null,
  facebook_url: null,
  twitter_url: null,
  website_url: null,
};

const profiles = [
  {
    ...baseProfile,
    id: 'p1',
    user_id: 'u1',
    full_name: 'Alice Johnson',
    bio: 'Product designer',
    skills: ['Architecture', 'Figma'],
    interests: ['Missions'],
  },
  {
    ...baseProfile,
    id: 'p2',
    user_id: 'u2',
    full_name: 'Bob Smith',
    bio: 'Backend developer',
    skills: ['Software Engineering'],
    interests: ['Automation'],
  },
  {
    ...baseProfile,
    id: 'p3',
    user_id: 'u3',
    full_name: null,
    bio: null,
    skills: [],
    interests: [],
  },
];

const renderDirectory = () =>
  render(
    <DirectoryClient
      profiles={profiles}
      currentUserId="u1"
      ownedGroups={[]}
      membershipByGroup={{}}
      pendingByGroup={{}}
    />
  );

const typeSearch = (value: string) => {
  fireEvent.change(screen.getByLabelText(/search members/i), { target: { value } });
  act(() => {
    jest.advanceTimersByTime(300);
  });
};

describe('filterProfiles', () => {
  it('returns all profiles for an empty or whitespace query', () => {
    expect(filterProfiles(profiles, '')).toHaveLength(3);
    expect(filterProfiles(profiles, '   ')).toHaveLength(3);
  });

  it('matches name, bio, skills and interests case-insensitively', () => {
    expect(filterProfiles(profiles, 'alice').map(p => p.id)).toEqual(['p1']);
    expect(filterProfiles(profiles, 'BACKEND').map(p => p.id)).toEqual(['p2']);
    expect(filterProfiles(profiles, 'architecture').map(p => p.id)).toEqual(['p1']);
    expect(filterProfiles(profiles, 'automation').map(p => p.id)).toEqual(['p2']);
  });

  it('requires every term to match', () => {
    expect(filterProfiles(profiles, 'bob automation').map(p => p.id)).toEqual(['p2']);
    expect(filterProfiles(profiles, 'bob figma')).toHaveLength(0);
  });
});

describe('DirectoryClient search', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders an accessible search input with placeholder', () => {
    renderDirectory();
    const input = screen.getByLabelText(/search members/i);
    expect(input).toHaveAttribute('placeholder', 'Search by name, skills, or interests...');
  });

  it('filters member cards after the debounce delay', () => {
    renderDirectory();
    fireEvent.change(screen.getByLabelText(/search members/i), { target: { value: 'automation' } });

    // Not yet filtered before debounce elapses
    expect(screen.getByText('Alice Johnson')).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(300);
    });

    expect(screen.queryByText('Alice Johnson')).not.toBeInTheDocument();
    expect(screen.getByText('Bob Smith')).toBeInTheDocument();
    expect(screen.queryByText('Anonymous User')).not.toBeInTheDocument();
  });

  it('clears the search with the X button', () => {
    renderDirectory();
    typeSearch('alice');
    expect(screen.queryByText('Bob Smith')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /clear search/i }));

    expect(screen.getByLabelText(/search members/i)).toHaveValue('');
    expect(screen.getByText('Bob Smith')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /clear search/i })).not.toBeInTheDocument();
  });

  it('shows an empty state with a reset button when nothing matches', () => {
    renderDirectory();
    typeSearch('nonexistent');

    expect(screen.getByText('No members found matching your search')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /reset filters/i }));

    expect(screen.queryByText('No members found matching your search')).not.toBeInTheDocument();
    expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
  });
});
