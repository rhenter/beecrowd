import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import Header from '../components/Header';
import { LanguageProvider } from './LanguageContext';

describe('LanguageProvider', () => {
  it('restores a saved language and translates labels', async () => {
    localStorage.setItem('series-atlas-language', 'pt-BR');
    const user = userEvent.setup();
    render(<LanguageProvider><Header onHome={() => {}} /></LanguageProvider>);

    expect(screen.getByRole('button', { name: 'Página inicial' })).toBeInTheDocument();
    await user.selectOptions(screen.getByRole('combobox', { name: 'Idioma' }), 'en');
    expect(screen.getByRole('button', { name: 'Home page' })).toBeInTheDocument();
    expect(localStorage.getItem('series-atlas-language')).toBe('en');
  });
});
