const chai = require('chai');
const {userState, getUserState, setUserState} = require('../userState');
const bluebird = require('bluebird');
const redis = require('redis-mock');
bluebird.promisifyAll(redis);

describe('User state', () => {
  it('should return not commuted when data is not found', async () => {
    const redisClient = redis.createClient();
    const dateObject = new Date();
    chai.should().equal(
        await getUserState(redisClient, 'some_id', dateObject),
        userState.notCommuted,
    );
  });

  it('should return commuted when data is found and data.date is valid', 
      async () => {
        const redisClient = redis.createClient();
        const dateObject = new Date();

        await setUserState(redisClient, 'some_id', userState.commuted, dateObject);

        chai.should().equal(
            await getUserState(redisClient, 'some_id', dateObject),
            userState.commuted,
        );
      });
  it('should return not commuted when data is found and data.date is unvalid', 
      async () => {
        const redisClient = redis.createClient();
        const dateObject = addDays(new Date(), 3);
          
        await setUserState(redisClient, 'some_id', userState.gotHome, new Date());
    
        chai.should().equal(
            await getUserState(redisClient, 'some_id', dateObject),
            userState.notCommuted
        );
      });
});

/**
 * 주어진 날짜로부터 dayAfter 일 후의 Date 객체를 반환합니다.
 * @param {Date} date
 * @param {number} dayAfter
 * @return {Date}
 */
function addDays(date, dayAfter) {
  const dayToSec = 1000 * 60 * 60 * 24;
  return new Date(date.getTime() + (dayToSec * dayAfter));
}