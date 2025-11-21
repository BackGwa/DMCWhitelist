const fs = require('fs');
const path = require('path');

const BROADCAST_DIR = path.join(__dirname, '../../whitelist');
const BROADCAST_FILE = path.join(BROADCAST_DIR, 'broadcast.json');

// whitelist 폴더가 없으면 생성
if (!fs.existsSync(BROADCAST_DIR)) {
  fs.mkdirSync(BROADCAST_DIR, { recursive: true });
}

/**
 * 방송국 JSON 파일을 읽습니다.
 * @returns {Array<{name: string, nickname: string, link: string}>}
 */
function readBroadcasts() {
  try {
    if (!fs.existsSync(BROADCAST_FILE)) {
      return [];
    }
    const data = fs.readFileSync(BROADCAST_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading broadcasts:', error);
    return [];
  }
}

/**
 * 방송국 JSON 파일에 저장합니다.
 * @param {Array<{name: string, nickname: string, link: string}>} data - 저장할 데이터
 */
function writeBroadcasts(data) {
  try {
    fs.writeFileSync(BROADCAST_FILE, JSON.stringify(data, null, 4), 'utf-8');
  } catch (error) {
    console.error('Error writing broadcasts:', error);
    throw error;
  }
}

/**
 * 방송국을 추가합니다.
 * @param {string} name - 방송국 이름
 * @param {string} nickname - 마인크래프트 닉네임
 * @param {string} link - 방송국 아이디
 * @returns {Object} - {success: boolean, message: string}
 */
function addBroadcast(name, nickname, link) {
  const broadcasts = readBroadcasts();

  // 중복 확인 (닉네임 기준)
  const exists = broadcasts.some(broadcast => broadcast.nickname.toLowerCase() === nickname.toLowerCase());
  if (exists) {
    return {
      success: false,
      message: 'duplicate',
      nickname: nickname,
    };
  }

  // 추가
  broadcasts.push({ name, nickname, link });
  writeBroadcasts(broadcasts);

  return {
    success: true,
    message: 'added',
    nickname: nickname,
  };
}

/**
 * 방송국을 제거합니다.
 * @param {string} nickname - 마인크래프트 닉네임
 * @returns {Object} - {success: boolean, message: string}
 */
function removeBroadcast(nickname) {
  const broadcasts = readBroadcasts();

  // 방송국 찾기 (대소문자 상관없이)
  const index = broadcasts.findIndex(broadcast => broadcast.nickname.toLowerCase() === nickname.toLowerCase());

  if (index === -1) {
    return {
      success: false,
      message: 'not_found',
      nickname: nickname,
    };
  }

  // 제거
  broadcasts.splice(index, 1);
  writeBroadcasts(broadcasts);

  return {
    success: true,
    message: 'removed',
    nickname: nickname,
  };
}

/**
 * 방송국 아이디 검증
 * @param {string} broadcastId - 검증할 방송국 아이디
 * @returns {Object} - {valid: boolean, error?: string}
 */
function validateBroadcastId(broadcastId) {
  // 띄어쓰기 체크
  if (broadcastId.includes(' ')) {
    return {
      valid: false,
      error: 'space',
    };
  }

  // 링크 형식 체크 (http://, https://, www., / 포함 여부)
  const linkPatterns = [
    /^https?:\/\//i,  // http:// 또는 https://로 시작
    /^www\./i,         // www.로 시작
    /\//,              // / 포함 (경로 구분자)
  ];

  for (const pattern of linkPatterns) {
    if (pattern.test(broadcastId)) {
      return {
        valid: false,
        error: 'link',
      };
    }
  }

  return {
    valid: true,
  };
}

module.exports = {
  readBroadcasts,
  writeBroadcasts,
  addBroadcast,
  removeBroadcast,
  validateBroadcastId,
};
