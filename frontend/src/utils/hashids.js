import Hashids from 'hashids';

const SALT = 'KurbanLink2024!xZ9q';
const MIN_LENGTH = 7;

const hashids = new Hashids(SALT, MIN_LENGTH);

/**
 * Encode a numeric ID to an obfuscated hash string.
 * @param {number} id
 * @returns {string}
 */
export const encodeId = (id) => {
  if (!id && id !== 0) return null;
  return hashids.encode(id);
};

/**
 * Decode an obfuscated hash string back to a numeric ID.
 * @param {string} hash
 * @returns {number|null}
 */
export const decodeId = (hash) => {
  if (!hash) return null;
  const decoded = hashids.decode(hash);
  return decoded.length > 0 ? decoded[0] : null;
};
