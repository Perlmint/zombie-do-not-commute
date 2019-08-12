const userState = {
  notCommuted: 'NOT',
  commuted: 'ZOMBIE',
  gotHome: 'SLEEPING',
};

// 클라이언트에서 요청이 오면 (좀비서버 메인페이지) 상태를 돌려주는 함수
// 일단 클라이언트가 자기 id를 알고 있다고 가정 (클라 아이디 받을거임)

/**
 * @param {string} id id
 * @param {date} dateObject
 */
async function getUserState(redis, id, dateObject) {
  // bluebird를 써서 async await을 사용할 수 있게 되었고, get을 원하던 방식으로 사용할 수 있게 되었다.
  // (get으로 바로 데이터를 받아오고 싶었음)
  const data = await redis.hgetallAsync(id);
  if (data === null) {
    return userState.notCommuted;
  } else {
    if (data.date == dateToString(dateObject)) {
      return data.commuted;
    } else {
      return userState.notCommuted;
    }
  }
}

/**
 * @param {string} id id
 * @param {string} state desired state
 */
async function setUserState(redis, id, state, dateObject) {
  await redis.multi()
      .hset(id, 'commuted', state)
      .hset(id, 'date', dateToString(dateObject))
      .execAsync();
}

module.exports = {
  userState,
  getUserState,
  setUserState,
};

/**
 * 8자리 연월일 스트링을 반환합니다.(yyyyMMdd)
 * @param {Date} date
 * @return {string}
 */
function dateToString(date) {
  const year = date.getFullYear().toString(10);
  const month = addZero(date.getMonth() + 1); // 지옥에서 올라온 제로베이스
  const day = addZero(date.getDate());
  const dateString = year + month + day;
  return dateString;
}

/**
 * 숫자를 2-width 문자열로 만들어 반환합니다.
 * @param {number} num
 * @return {string}
 */
function addZero(num) {
  if (num < 10) {
    return ('0'.concat(num.toString(10)));
  }
  return num.toString(10);
}
