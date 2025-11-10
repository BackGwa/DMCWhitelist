const fs = require('fs');
const path = require('path');

const WHITELIST_DIR = path.join(__dirname, '../../whitelist');
const WHITELIST_FILE = path.join(WHITELIST_DIR, 'whitelist.json');

// whitelist 폴더가 없으면 생성
if (!fs.existsSync(WHITELIST_DIR)) {
  fs.mkdirSync(WHITELIST_DIR, { recursive: true });
}

/**
 * 화이트리스트 JSON 파일을 읽습니다.
 * @returns {Array<{uuid: string, name: string}>}
 */
function readWhitelist() {
  try {
    if (!fs.existsSync(WHITELIST_FILE)) {
      return [];
    }
    const data = fs.readFileSync(WHITELIST_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading whitelist:', error);
    return [];
  }
}

/**
 * 화이트리스트 JSON 파일에 저장합니다.
 * @param {Array<{uuid: string, name: string}>} data - 저장할 데이터
 */
function writeWhitelist(data) {
  try {
    fs.writeFileSync(WHITELIST_FILE, JSON.stringify(data, null, 4), 'utf-8');
  } catch (error) {
    console.error('Error writing whitelist:', error);
    throw error;
  }
}

/**
 * 플레이어를 화이트리스트에 추가합니다.
 * @param {string} uuid - 플레이어 UUID
 * @param {string} name - 플레이어 닉네임
 * @returns {Object} - {success: boolean, message: string}
 */
function addPlayer(uuid, name) {
  const whitelist = readWhitelist();

  // 중복 확인 (대소문자 상관없이)
  const exists = whitelist.some(player => player.name.toLowerCase() === name.toLowerCase());
  if (exists) {
    return {
      success: false,
      message: 'duplicate',
      player: name,
    };
  }

  // 추가
  whitelist.push({ uuid, name });
  writeWhitelist(whitelist);

  return {
    success: true,
    message: 'added',
    player: name,
  };
}

/**
 * 플레이어를 화이트리스트에서 제거합니다.
 * @param {string} name - 플레이어 닉네임
 * @returns {Object} - {success: boolean, message: string}
 */
function removePlayer(name) {
  const whitelist = readWhitelist();

  // 플레이어 찾기 (대소문자 상관없이)
  const index = whitelist.findIndex(player => player.name.toLowerCase() === name.toLowerCase());

  if (index === -1) {
    return {
      success: false,
      message: 'not_found',
      player: name,
    };
  }

  // 제거
  whitelist.splice(index, 1);
  writeWhitelist(whitelist);

  return {
    success: true,
    message: 'removed',
    player: name,
  };
}

/**
 * 플레이어가 화이트리스트에 있는지 확인합니다.
 * @param {string} name - 플레이어 닉네임
 * @returns {boolean}
 */
function playerExists(name) {
  const whitelist = readWhitelist();
  return whitelist.some(player => player.name.toLowerCase() === name.toLowerCase());
}

module.exports = {
  readWhitelist,
  writeWhitelist,
  addPlayer,
  removePlayer,
  playerExists,
};
