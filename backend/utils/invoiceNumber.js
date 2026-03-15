/**
 * Generate invoice number with property name initials
 * @param {Object} property - Property object with propertyName
 * @returns {String} Invoice number in format: PROP-YYYYMMDD-XXXX
 */
function generateInvoiceNumber(property) {
  // Extract initials from property name
  let prefix = 'INV';
  if (property && property.propertyName) {
    const words = property.propertyName.trim().split(/\s+/);
    // Take first 2-3 letters from first word(s), up to 4 characters total
    if (words.length >= 2) {
      // If multiple words, use first letter of first two words
      prefix = words.slice(0, 2).map(w => w.charAt(0).toUpperCase()).join('');
    } else if (words[0]) {
      // If single word, use first 2-3 letters
      const word = words[0];
      prefix = word.length >= 3 ? word.substring(0, 3).toUpperCase() : word.toUpperCase();
    }
    // Limit prefix to 4 characters
    prefix = prefix.substring(0, 4).toUpperCase();
  }

  // Generate date component (YYYYMMDD)
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const dateStr = `${year}${month}${day}`;

  // Generate random component (4 digits)
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');

  return `${prefix}-${dateStr}-${random}`;
}

module.exports = { generateInvoiceNumber };
