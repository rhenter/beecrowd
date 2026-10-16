import { createContext, useContext, useMemo, useState } from 'react';

const translations = {
  en: {
    language: 'Language',
    homePage: 'Home page',
    binge: 'YOUR NEXT BINGE STARTS HERE',
    explore: 'EXPLORE. TRACK. DISCOVER.',
    stories: 'Stories that stay',
    withYou: 'with',
    you: 'you.',
    homeDescription: 'Find your next favorite show, track every episode, and discover new perspectives with artificial intelligence.',
    searchPlaceholder: 'Search for a show, like The Office...',
    searchShows: 'Search shows',
    unknownYear: 'Unknown year',
    show: 'Show',
    popular: 'POPULAR',
    progressSaved: 'Your progress, saved',
    continueWatching: 'Always pick up where you left off.',
    seasonsInOrder: 'Every season, in order',
    episodesOrganized: 'All episodes neatly organized.',
    aiInsights: 'AI-powered insights',
    newAngles: 'New angles for your stories.',
    footer: 'MADE FOR PEOPLE WHO LOVE GREAT STORIES',
    showData: 'SHOW DATA BY TVMAZE',
    backToSearch: 'Back to search',
    summaryUnavailable: 'Summary unavailable.',
    yourProgress: 'YOUR PROGRESS',
    episodes: 'episodes',
    episodeGuide: 'EPISODE GUIDE',
    seasons: 'Seasons',
    season: 'Season',
    saving: 'Saving...',
    seasonWatched: 'Season watched',
    markSeasonWatched: 'Mark season as watched',
    markUnwatched: 'Mark as unwatched',
    markWatched: 'Mark as watched',
    dateUnavailable: 'Date unavailable',
    comment: 'Comment',
    atlasPerspective: 'ATLAS PERSPECTIVE',
    beyondScreen: 'See beyond the screen.',
    insightDescription: 'An interpretation of the story, genres, and community conversations.',
    analyzing: 'Analyzing...',
    generateInsight: '✧  Generate insight',
    aiGenerated: '✦ AI-GENERATED',
    contextAnalysis: '◌ CONTEXT ANALYSIS',
    community: 'COMMUNITY',
    shareThoughts: 'Share your thoughts',
    commentingEpisode: 'COMMENTING ON EPISODE',
    commentingShow: 'COMMENTING ON SHOW',
    linkedEpisode: 'Your comment will be linked to this episode.',
    visibleShow: 'Your comment will be visible in the show conversation.',
    yourName: 'Your name',
    commentPlaceholder: 'Share your thoughts on {name}...',
    postOnEpisode: 'Post on episode',
    postOnShow: 'Post on show',
    noComments: 'No comments yet. Start the conversation.',
    posterFor: 'Poster for {name}',
  },
  'pt-BR': {
    language: 'Idioma',
    homePage: 'Página inicial',
    binge: 'SUA PRÓXIMA MARATONA COMEÇA AQUI',
    explore: 'EXPLORE. ACOMPANHE. DESCUBRA.',
    stories: 'Histórias que ficam',
    withYou: 'com',
    you: 'você.',
    homeDescription: 'Encontre sua próxima série favorita, acompanhe cada episódio e descubra novas perspectivas com inteligência artificial.',
    searchPlaceholder: 'Busque uma série, como The Office...',
    searchShows: 'Buscar séries',
    unknownYear: 'Ano desconhecido',
    show: 'Série',
    popular: 'EM ALTA',
    progressSaved: 'Seu progresso, salvo',
    continueWatching: 'Continue de onde parou, sempre.',
    seasonsInOrder: 'Cada temporada, em ordem',
    episodesOrganized: 'Todos os episódios organizados.',
    aiInsights: 'Insights com IA',
    newAngles: 'Novos ângulos para suas histórias.',
    footer: 'FEITO PARA QUEM AMA BOAS HISTÓRIAS',
    showData: 'DADOS DE SÉRIES POR TVMAZE',
    backToSearch: 'Voltar à busca',
    summaryUnavailable: 'Sinopse indisponível.',
    yourProgress: 'SEU PROGRESSO',
    episodes: 'episódios',
    episodeGuide: 'GUIA DE EPISÓDIOS',
    seasons: 'Temporadas',
    season: 'Temporada',
    saving: 'Salvando...',
    seasonWatched: 'Temporada assistida',
    markSeasonWatched: 'Marcar temporada como assistida',
    markUnwatched: 'Marcar como não assistido',
    markWatched: 'Marcar como assistido',
    dateUnavailable: 'Data não informada',
    comment: 'Comentar',
    atlasPerspective: 'PERSPECTIVA ATLAS',
    beyondScreen: 'Veja além da tela.',
    insightDescription: 'Uma leitura da história, dos gêneros e das conversas da comunidade.',
    analyzing: 'Analisando...',
    generateInsight: '✧  Gerar insight',
    aiGenerated: '✦ GERADO COM IA',
    contextAnalysis: '◌ ANÁLISE DE CONTEXTO',
    community: 'COMUNIDADE',
    shareThoughts: 'Deixe sua opinião',
    commentingEpisode: 'COMENTANDO NO EPISÓDIO',
    commentingShow: 'COMENTANDO NA SÉRIE',
    linkedEpisode: 'Seu comentário ficará vinculado a este episódio.',
    visibleShow: 'Seu comentário ficará visível na conversa da série.',
    yourName: 'Seu nome',
    commentPlaceholder: 'Compartilhe sua opinião sobre {name}...',
    postOnEpisode: 'Publicar no episódio',
    postOnShow: 'Publicar na série',
    noComments: 'Ainda não há comentários. Comece a conversa.',
    posterFor: 'Pôster de {name}',
  },
};

const LanguageContext = createContext(null);

function getInitialLanguage() {
  const savedLanguage = window.localStorage.getItem('series-atlas-language');
  if (savedLanguage && translations[savedLanguage]) return savedLanguage;

  const browserLanguages = navigator.languages?.length ? navigator.languages : [navigator.language];
  const preferredLanguage = browserLanguages.find((language) => language?.toLowerCase().startsWith('pt'));
  return preferredLanguage ? 'pt-BR' : 'en';
}

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(getInitialLanguage);
  const value = useMemo(() => ({
    language,
    setLanguage: (nextLanguage) => {
      window.localStorage.setItem('series-atlas-language', nextLanguage);
      setLanguage(nextLanguage);
    },
    t: (key, values = {}) => Object.entries(values).reduce((text, [name, value]) => text.replace(`{${name}}`, value), translations[language][key] || key),
  }), [language]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  return useContext(LanguageContext);
}
