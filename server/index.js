const webSocket = require('ws');
const http = require('http');
const express = require('express');
const OAuth = require('oauth');
const session = require('express-session');
const config = require('config');
const redis = require('redis-mock');
const bluebird = require('bluebird');

// 콜백 지옥을 보기 싫으니 프로미스를 씁시다.
bluebird.promisifyAll(redis);
const client = redis.createClient();

const app = express();
app.use(session({
  secret: config.get('secret'),
  resave: false,
  saveUninitialized: true,
  cookie: {secure: true},
}));

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
    } else {
      // store the tokens in the session
      req.session.oa = oa;
      req.session.oauth_token = oauthToken;
      req.session.oauth_token_secret = oauthTokenSecret;
      // redirect the user to authorize the token
      res.redirect('https://api.twitter.com/oauth/authenticate?oauth_token=' + oauthToken);
    }
  });
});

app.get('/callback', function(request, response) {
  const getOAuthRequestTokenCallback = function(error, oAuthAccessToken,
      oAuthAccessTokenSecret, results) {
    if (error) {
      console.error(error);
      return;
    }

    oa.get('https://api.twitter.com/1.1/account/verify_credentials.json',
        oAuthAccessToken,
        oAuthAccessTokenSecret,
        function(error, twitterResponseData, result) {
          if (error) {
            console.log(error);
            return;
          }
          req.session.oauth_access_token = oAuthAccessToken;
          req.session.oauth_access_token_secret = oAuthAccessTokenSecret;
          console.log(twitterResponseData);
        });
    // res.redirect('https://zombie.perlmint.app'); 이게 없어서 자동으로 리다이렉트 된다. 흠...
  };

  oa.getOAuthAccessToken(req.session.oauth_token,
      req.session.oauth_token_secret,
      req.param('oauth_verifier'),
      getOAuthRequestTokenCallback);
});

// 웹소켓서버에 connection 이벤트가 일어나면 connection 함수를 실행해라
wss.on('connection', async function connection(ws, req) {
  const userId = req.headers['zombie-id'];
  const userState = await getUserState(userId);
  const colorData = colorMaker();
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


const userState = {notCommuted: 'NOT', commuted: 'ZOMBIE', gotHome: 'SLEEPING'};

// 클라이언트에서 요청이 오면 (좀비서버 메인페이지) 상태를 돌려주는 함수
// 일단 클라이언트가 자기 id를 알고 있다고 가정 (클라 아이디 받을거임)

/**
 * @param {string} id id
 */
async function getUserState(id) {
  // bluebird를 써서 async await을 사용할 수 있게 되었고, get을 원하던 방식으로 사용할 수 있게 되었다.
  // (get으로 바로 데이터를 받아오고 싶었음)
  const data = await client.hgetallAsync(id);
  if (data === null) {
    return userState.notCommuted;
  } else {
    if (data.date == '오늘날짜문자열') {
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
async function setUserState(id, state) {
  await client.multi()
      .hset(id, 'commuted', state)
      .hset(id, 'date', '오늘날짜문자열')
      .execAsync();
}

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