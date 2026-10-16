import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import CommentsCard from './CommentsCard';
import Header from './Header';
import InsightCard from './InsightCard';
import SearchResults from './SearchResults';
import SeasonList from './SeasonList';
import { LanguageProvider } from '../i18n/LanguageContext';

function renderWithLanguage(component) {
  return render(<LanguageProvider>{component}</LanguageProvider>);
}

const episode = { id: 101, name: 'Pilot', number: 1, season: 1, airdate: '2020-01-01' };

describe('Header', () => {
  it('changes language and calls the home action', async () => {
    const user = userEvent.setup();
    const onHome = vi.fn();
    renderWithLanguage(<Header onHome={onHome} />);

    await user.click(screen.getByRole('button', { name: 'Home page' }));
    await user.selectOptions(screen.getByRole('combobox', { name: 'Language' }), 'pt-BR');

    expect(onHome).toHaveBeenCalledOnce();
    expect(screen.getByRole('combobox')).toHaveValue('pt-BR');
    expect(localStorage.getItem('series-atlas-language')).toBe('pt-BR');
  });
});

describe('SearchResults', () => {
  it('renders image and placeholder results and selects a show', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    renderWithLanguage(<SearchResults results={[
      { id: 1, name: 'Example', slug: 'example', premiered: '2020-01-01', genres: ['Drama'], image: '/poster.jpg' },
      { id: 2, name: 'Unknown', slug: 'unknown', genres: [], image: null },
    ]} onSelect={onSelect} />);

    expect(screen.getByAltText('')).toHaveAttribute('src', '/poster.jpg');
    expect(screen.getByText('2020 · Drama')).toBeInTheDocument();
    expect(screen.getByText('Unknown year · Show')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Unknown/ }));
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: 2 }));
  });

  it('renders nothing for an empty result list', () => {
    const { container } = renderWithLanguage(<SearchResults results={[]} onSelect={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe('SeasonList', () => {
  it('supports selecting, commenting, toggling and completing a season', async () => {
    const user = userEvent.setup();
    const handlers = {
      onMarkSeasonWatched: vi.fn(),
      onToggleWatched: vi.fn(),
      onSelectEpisode: vi.fn(),
      onCommentEpisode: vi.fn(),
    };
    renderWithLanguage(<SeasonList
      seasons={[{ number: 1, episodes: [episode] }]}
      watchedEpisodeIds={[]}
      selectedEpisodeId={null}
      busySeason={null}
      {...handlers}
    />);

    await user.click(screen.getByRole('button', { name: 'Mark season as watched' }));
    await user.click(screen.getByRole('button', { name: 'Mark as watched' }));
    await user.click(screen.getByRole('button', { name: /01 Pilot/ }));
    await user.click(screen.getByRole('button', { name: 'Comment Pilot' }));

    expect(handlers.onMarkSeasonWatched).toHaveBeenCalledOnce();
    expect(handlers.onToggleWatched).toHaveBeenCalledWith(episode);
    expect(handlers.onSelectEpisode).toHaveBeenCalledWith(episode);
    expect(handlers.onCommentEpisode).toHaveBeenCalledWith(episode);
  });

  it('disables the action for a completed or busy season', () => {
    const { rerender } = renderWithLanguage(<SeasonList
      seasons={[{ number: 1, episodes: [episode] }]}
      watchedEpisodeIds={[101]}
      selectedEpisodeId={101}
      busySeason={null}
      onMarkSeasonWatched={vi.fn()}
      onToggleWatched={vi.fn()}
      onSelectEpisode={vi.fn()}
      onCommentEpisode={vi.fn()}
    />);
    expect(screen.getByRole('button', { name: 'Season watched' })).toBeDisabled();

    rerender(<LanguageProvider><SeasonList
      seasons={[{ number: 1, episodes: [episode] }]}
      watchedEpisodeIds={[]}
      selectedEpisodeId={null}
      busySeason={1}
      onMarkSeasonWatched={vi.fn()}
      onToggleWatched={vi.fn()}
      onSelectEpisode={vi.fn()}
      onCommentEpisode={vi.fn()}
    /></LanguageProvider>);
    expect(screen.getByRole('button', { name: 'Saving...' })).toBeDisabled();
  });
});

describe('CommentsCard and InsightCard', () => {
  it('submits comments, displays an episode context and clears it', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn((event) => event.preventDefault());
    const onClearEpisode = vi.fn();
    renderWithLanguage(<CommentsCard
      showName="Example"
      selectedEpisode={episode}
      comments={[{ id: 1, display_name: 'Rafa', body: 'Great', created_at: '2025-01-01T00:00:00Z' }]}
      name="Rafa"
      comment="My thought"
      onNameChange={vi.fn()}
      onCommentChange={vi.fn()}
      onSubmit={onSubmit}
      onClearEpisode={onClearEpisode}
    />);

    expect(screen.getByText('01 · Pilot')).toBeInTheDocument();
    expect(screen.getByText('Great')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Show' }));
    await user.click(screen.getByRole('button', { name: 'Post on episode ↗' }));
    expect(onClearEpisode).toHaveBeenCalledOnce();
    expect(onSubmit).toHaveBeenCalledOnce();
  });

  it('shows empty comments and insight states', async () => {
    const user = userEvent.setup();
    const onGenerate = vi.fn();
    renderWithLanguage(<InsightCard insight={null} busy={false} onGenerate={onGenerate} />);
    expect(screen.getByRole('button', { name: /Generate insight/ })).toBeEnabled();
    await user.click(screen.getByRole('button', { name: /Generate insight/ }));
    expect(onGenerate).toHaveBeenCalledOnce();
    expect(screen.queryByText('No comments yet. Start the conversation.')).not.toBeInTheDocument();
  });
});
