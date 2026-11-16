import { Navigate, useParams } from 'react-router-dom';
import { getProtocol } from '../data/protocols';
import { Layout } from '../components/Layout';
import { ComingSoon } from './ComingSoon';
import { ProtocolOverview } from './ProtocolOverview';
import { Player } from './Player';
import { NotFound } from './NotFound';

export function ProtocolPage() {
  const { slug } = useParams();
  const p = getProtocol(slug);
  if (!p) return <Layout><NotFound /></Layout>;
  return <Layout>{p.status === 'available' ? <ProtocolOverview protocol={p} /> : <ComingSoon protocol={p} />}</Layout>;
}

export function SessionPage() {
  const { slug } = useParams();
  const p = getProtocol(slug);
  if (!p || p.status !== 'available') return <Navigate to={`/protocols/${slug ?? ''}`} replace />;
  return <Player key={p.id} protocol={p} mode="guided" />;
}

export function StepPage() {
  const { slug, n } = useParams();
  const p = getProtocol(slug);
  const num = Number(n);
  if (!p || p.status !== 'available') return <Navigate to={`/protocols/${slug ?? ''}`} replace />;
  if (!Number.isInteger(num) || num < 1 || num > p.steps.length) return <Navigate to={`/protocols/${p.slug}/step/1`} replace />;
  return <Player protocol={p} mode="learn" stepNumber={num} />;
}
