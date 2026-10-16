import { useLanguage } from '../i18n/LanguageContext';

export default function InsightCard({ insight, busy, onGenerate }) {
  const { t } = useLanguage();
  return (
    <section className="insight-card">
      <div className="insight-spark">✧</div><span className="eyebrow">{t('atlasPerspective')}</span><h2>{t('beyondScreen')}</h2><p>{t('insightDescription')}</p>
      <button className="primary-button" onClick={onGenerate} disabled={busy}>{busy ? <><span className="spinner" /> {t('analyzing')}</> : t('generateInsight')}</button>
      {insight && <div className="insight-result"><span className="result-badge">{insight.generated_by_ai ? t('aiGenerated') : t('contextAnalysis')}</span><p>{insight.text}</p></div>}
    </section>
  );
}
