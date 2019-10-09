const webSocket = require('ws');
const http = require('http');
const express = require('express');
const OAuth = require('oauth');
const session = require('express-session');
const config = require('config');
const redis = require('redis-mock');
const bluebird = require('bluebird');
const {getUserState} = require('./userState');
const {setUserTextColor} = require('./userState');
const {getUserTextColor} = require('./userState');

// 콜백 지옥을 보기 싫으니 프로미스를 씁시다.
bluebird.promisifyAll(redis);
const redisClient = redis.createClient();

const sessionStore = new session.MemoryStore();
const sessionHandler = session({
  secret: config.get('secret'),
  store: sessionStore,
});
const app = express();
app.use(sessionHandler);

const server = http.createServer(app);
const wss = new webSocket.Server({server});

server.listen(config.get('port'), function() {
  console.log(`listening on port ${config.get('port')}`);
});
const oa = new OAuth.OAuth(
    'https://api.twitter.com/oauth/request_token',
    'https://api.twitter.com/oauth/access_token',
    config.get('consumer.key'),
    config.get('consumer.secret'),
    '1.0A',
    null,
    'HMAC-SHA1'
);

app.get('/twitter_login', function(req, res) {
  oa.getOAuthRequestToken(function(error,
      oauthToken,
      oauthTokenSecret,
      results) {
    if (error) {
      console.log('error');
      console.log(error);
      res.status(500);
    } else {
      // redirect the user to authorize the token
      res.redirect('https://api.twitter.com/oauth/authenticate?oauth_token=' + oauthToken);
    }
    res.end();
  });
});

app.get('/callback', function(req, res, next) {
  oa.getOAuthRequestToken(function(err, oAuthToken, oAuthTokenSecret, results) {
    const getOAuthRequestTokenCallback = function(err, oAuthAccessToken,
      oAuthAccessTokenSecret, results) {
      if (err) {
        console.log(err);
        res.end(JSON.stringify({
          message: 'Error occured while getting access token',
          error: err,
        }));
      return;
    }

      req.session.oa = oa;
      req.session.oauth_token = oAuthAccessToken;
      req.session.oauth_token_secret = oAuthAccessTokenSecret;

      oa.get('https://api.twitter.com/1.1/account/verify_credentials.json',
          oAuthAccessToken,
          oAuthAccessTokenSecret,
          function(error, twitterResponseData, result) {
            if (error) {
              console.log(error);
              res.end(JSON.stringify(error));
              return;
            }
            req.session.userId = JSON.parse(twitterResponseData).id_str;
          });


      // '/' is for development.
      // TODO: it should have a proper url later.
      res.redirect('/');
      next();
  };

    oa.getOAuthAccessToken(req.query.oauth_token, oAuthTokenSecret,
        req.query.oauth_verifier,
      getOAuthRequestTokenCallback);
});
});


// 웹소켓서버에 connection 이벤트가 일어나면 connection 함수를 실행해라
wss.on('connection', async function connection(ws, req) {
  sessionHandler(req, {}, async (e) => {
    // 트위터 로그인을 하지 않으면 일단 접속 종료.
    if (req.session.oauth_token == null) {
      // TODO: 트위터 로그인 페이지로 리다이렉션 해줘야 함.
      ws.close();
    }
    const userId = req.session.userId;
    const userState = await getUserState(redisClient, userId, new Date());
    let colorData = await getUserTextColor(redisClient, userId);
    if (colorData == null) {
      colorData = colorMaker();
      setUserTextColor(redisClient, userId, colorData);
    }
  ws.send(JSON.stringify({
    tag: 'userData',
    userState,
    colorData,
  }));
  // 다른 포트로 넘겨주고 하는 것들은 이미 일어났을 것이다. 따라서 관심사가 아니다.
  // 소켓으로 메세지가 오면 incoming 함수를 실행해라.
  // ws.send(message); 이건 메세지를 보내온 클라이언트에게 다시 보내주는 것
  ws.on('message', function incoming(message) {
    // 메세지를 보내온 클라이언트를 제외한 다른 클라이언트에게 보여야 하므로
    wss.clients.forEach(function each(client) {
      // 보내온 클라이언트 제외 and 받을 수 있는 상태라면
      if (client !== ws && client.readyState === webSocket.OPEN) {
        client.send(JSON.stringify({
          tag: 'message',
          message,
          ...colorData,
        }));
      }
    });
  });
});


/**
 * @return {string}
 */
function colorMaker() {
  const hue = Math.ceil(Math.random() * 360);
  const saturation = Math.ceil(Math.random() * 100);
  const lightness = Math.ceil(Math.random() * 45);
  const balloon = hsl(hue, saturation, lightness);
  const text = hsl(hue, saturation, 90);
  return {textColor: text, balloonColor: balloon};
}

/**
 * @param {number} hue
 * @param {number} saturation
 * @param {number} lightness
 * @return {string}
 */
function hsl(hue, saturation, lightness) {
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}
