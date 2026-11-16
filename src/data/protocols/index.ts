import type { Protocol } from '../types';
import { eyeProtocol } from './eye';
import { sleepProtocol, emotionalProtocol, energyProtocol } from './comingSoon';

export const PROTOCOLS: Protocol[] = [eyeProtocol, sleepProtocol, emotionalProtocol, energyProtocol];

export const getProtocol = (slug: string | undefined) => PROTOCOLS.find((p) => p.slug === slug);

export { eyeProtocol };
