import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import HomePage from './HomePage';
import ShowPage from './ShowPage';
import { LanguageProvider } from '../i18n/LanguageContext';

function renderWithLanguage(component) {
  return render(<LanguageProvider>{component}</LanguageProvider>);
}

const show = {
  id: 1,
  name: 'Example',
  slug: 'example',
  status: 'Ended',
  premiered: '2020-01-01',
  genres: ['Drama'],
  rating: 8.2,
  summary: 'A character-driven story.',
  image: null,
  watched_episode_ids: [101],
  seasons: [{ number: 1, episodes: [
    { id: 101, name: 'Pilot', number: 1, season: 1, airdate: '2020-01-01' },
    { id: 102, name: 'Finale', number: 2, season: 1, airdate: '2020-01-08' },
  ] }],
};

describe('HomePage', () => {
  it('updates the search query and selects popular shows', () => {
    const onQueryChange = vi.fn();
    const onSelectShow = vi.fn();
    renderWithLanguage(<HomePage query="" results={[]} onQueryChange={onQueryChange} onSelectShow={onSelectShow} />);

    fireEvent.change(screen.getByRole('textbox', { name: 'Search shows' }), { target: { value: 'Dark' } });
    fireEvent.click(screen.getByRole('button', { name: 'Succession' }));

    expect(onQueryChange).toHaveBeenNthCalledWith(1, 'Dark');
    expect(onQueryChange).toHaveBeenNthCalledWith(2, 'Succession');
    expect(onSelectShow).not.toHaveBeenCalled();
  });
});

describe('ShowPage', () => {
  it('renders progress and delegates episode actions', () => {
    const handlers = {
      onBack: vi.fn(),
      onSelectEpisode: vi.fn(),
      onCommentEpisode: vi.fn(),
      onToggleWatched: vi.fn(),
      onMarkSeasonWatched: vi.fn(),
      onGenerateInsight: vi.fn(),
      onNameChange: vi.fn(),
      onCommentChange: vi.fn(),
      onSubmitComment: vi.fn(),
      onClearEpisode: vi.fn(),
    };
    renderWithLanguage(<ShowPage
      show={show}
      selectedEpisode={null}
      comments={[]}
      insight={null}
      busy={false}
      busySeason={null}
      name="Visitor"
      comment=""
      {...handlers}
    />);

    expect(screen.getByRole('heading', { name: 'Example' })).toBeInTheDocument();
    expect(screen.getByText(/\/ 2 episodes/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Back to search/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Mark as watched' }));
    fireEvent.click(screen.getByRole('button', { name: /Generate insight/ }));
    expect(handlers.onBack).toHaveBeenCalledOnce();
    expect(handlers.onToggleWatched).toHaveBeenCalledWith(show.seasons[0].episodes[1]);
    expect(handlers.onGenerateInsight).toHaveBeenCalledOnce();
  });

  it('renders an AI insight and allows posting a comment', () => {
    const onSubmitComment = vi.fn((event) => event.preventDefault());
    renderWithLanguage(<ShowPage
      show={{ ...show, image: '/poster.jpg', summary: null }}
      selectedEpisode={show.seasons[0].episodes[0]}
      comments={[]}
      insight={{ text: 'A generated perspective.', generated_by_ai: true }}
      busy={false}
      busySeason={null}
      name="Visitor"
      comment="A thought"
      onBack={vi.fn()}
      onSelectEpisode={vi.fn()}
      onCommentEpisode={vi.fn()}
      onToggleWatched={vi.fn()}
      onMarkSeasonWatched={vi.fn()}
      onGenerateInsight={vi.fn()}
      onNameChange={vi.fn()}
      onCommentChange={vi.fn()}
      onSubmitComment={onSubmitComment}
      onClearEpisode={vi.fn()}
    />);

    expect(screen.getByAltText('Poster for Example')).toHaveAttribute('src', '/poster.jpg');
    expect(screen.getByText('Summary unavailable.')).toBeInTheDocument();
    expect(screen.getByText('A generated perspective.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Post on episode ↗' }));
    expect(onSubmitComment).toHaveBeenCalledOnce();
  });
});
