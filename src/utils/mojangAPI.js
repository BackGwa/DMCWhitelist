const https = require('https');

/**
 * Mojang API에서 플레이어 정보를 조회합니다.
 * @param {string} nickname - Minecraft 플레이어 닉네임
 * @returns {Promise<{uuid: string, name: string} | null>}
 */
function getPlayerProfile(nickname) {
  return new Promise((resolve, reject) => {
    const url = `https://api.mojang.com/users/profiles/minecraft/${encodeURIComponent(nickname)}`;

    https.get(url, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);

          // 오류 응답 확인
          if (parsed.errorMessage) {
            resolve(null);
            return;
          }

          // UUID를 Full UUID 포맷으로 변환
          const fullUUID = formatUUID(parsed.id);

          resolve({
            uuid: fullUUID,
            name: parsed.name,
          });
        } catch (error) {
          reject(error);
        }
      });
    }).on('error', (error) => {
      reject(error);
    });
  });
}

/**
 * Short UUID를 Full UUID 포맷으로 변환합니다.
 * 예: 68a50203935b4613b3f589f1f470c777 → 68a50203-935b-4613-b3f5-89f1f470c777
 * @param {string} shortUUID - Short UUID (대시 없음)
 * @returns {string} - Full UUID (대시 포함)
 */
function formatUUID(shortUUID) {
  if (!shortUUID || shortUUID.length !== 32) {
    throw new Error('Invalid UUID format');
  }

  return `${shortUUID.slice(0, 8)}-${shortUUID.slice(8, 12)}-${shortUUID.slice(12, 16)}-${shortUUID.slice(16, 20)}-${shortUUID.slice(20)}`;
}

module.exports = {
  getPlayerProfile,
  formatUUID,
};
