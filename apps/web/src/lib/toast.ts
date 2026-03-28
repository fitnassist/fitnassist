import { toast as sonnerToast } from 'sonner';

const DING_FREQUENCY = 880;
const DING_DURATION = 0.12;

const playDing = () => {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.value = DING_FREQUENCY;
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + DING_DURATION);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + DING_DURATION);

    // Cleanup after sound finishes
    osc.onended = () => ctx.close();
  } catch {
    // Audio not available — silent fallback
  }
};

export const toast = {
  success: (message: string) => {
    playDing();
    return sonnerToast.success(message);
  },
  error: (message: string) => {
    return sonnerToast.error(message);
  },
  info: (message: string) => {
    return sonnerToast.info(message);
  },
  warning: (message: string) => {
    return sonnerToast.warning(message);
  },
};
