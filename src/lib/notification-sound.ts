// Génère un son de notification via Web Audio API
// Alternative au fichier MP3 manquant

export function playNotificationSound() {
  if (typeof window === 'undefined') return;

  try {
    const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();

    // Créer un oscillateur pour le bip
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Configuration du son - deux bips courts
    oscillator.frequency.value = 880; // La note A5
    oscillator.type = 'sine';

    // Envelope du volume
    const now = audioContext.currentTime;
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.3, now + 0.05);
    gainNode.gain.linearRampToValueAtTime(0, now + 0.15);
    gainNode.gain.linearRampToValueAtTime(0.3, now + 0.2);
    gainNode.gain.linearRampToValueAtTime(0, now + 0.3);

    oscillator.start(now);
    oscillator.stop(now + 0.35);
  } catch (error) {
    console.warn('Impossible de jouer le son de notification:', error);
  }
}
