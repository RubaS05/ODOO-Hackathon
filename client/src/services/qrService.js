import QRCode from 'qrcode';

/**
 * Generate a Data URL representing a QR code image.
 * @param {string} text - The text/URL to encode in the QR code.
 * @returns {Promise<string>} - Promise resolving to a data URL (PNG) of the QR code.
 */
export const generateQrDataUrl = async (text) => {
  // Use small, high‑contrast QR for easy scanning.
  return QRCode.toDataURL(text, {
    width: 150,
    margin: 1,
    color: {
      dark: '#000000',
      light: '#FFFFFF',
    },
  });
};
