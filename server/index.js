const webSocket = require('ws');

const wss = new webSocket.Server({port: 8081});

// 웹소켓서버에 connection 이벤트가 일어나면 connection 함수를 실행해라
wss.on('connection', function connection(ws) {
  const colorData = colorMaker();
  // 다른 포트로 넘겨주고 하는 것들은 이미 일어났을 것이다. 따라서 관심사가 아니다.
  ws.send(JSON.stringify({
    tag: 'colorData',
    ...colorData, // 이렇게 하면 colorData 안의 것들을 풀어써주는 것과 동일
  }));
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
