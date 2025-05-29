//koa프레임워크가 해당 라이브러리를 찾을 수 있도록 선언함.
//왜냐면 일을 시켜야 하니까
const Koa = require('koa') //1
//const app = new Koa();//2
const path = require('path')//3
const serve = require('koa-static')//6 - 정적리소스 경로 설정하기
//15번처럼 js파일에 html태그를 작성하는 것은 너무 비효율적이다.
//그래서 우리는 XXX.html문서 단위로 렌더링 처리를 요청할 수 있는
//send라는 함수를 koa-send라이브러리로 부터 제공받는다.
const send = require('koa-send')//7 - html파일을 통째로 렌더링 요청가능
const mount = require('koa-mount') //8 - views와 public 구분
const websockify = require('koa-websocket')//9 - 웹소켓
const app = websockify(new Koa())//10 - 머지
const route = require('koa-route')//11 - 요청을 구분 해서 처리
const { initializeApp } = require("firebase/app");//로컬에서 참조함.
const { getFirestore, collection, query, addDoc, getDocs } = require("firebase/firestore");//로컬에서 참조함.

const firebaseConfig = {
  apiKey: "AIzaSyC-L1F_gW4rj75DXfvlce7y77bQlwz0yAM",
  authDomain: "kosmo250520.firebaseapp.com",
  databaseURL: "https://kosmo250520-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "kosmo250520",
  storageBucket: "kosmo250520.firebasestorage.app",
  messagingSenderId: "866099520808",
  appId: "1:866099520808:web:797d61891d717ce2f79c1d"
};
//Firebase 앱 초기화
const talkApp = initializeApp(firebaseConfig)
const db = getFirestore(talkApp)
//console.log(db);
//정적 리소스에 대한 파일 경로 설정하기
const staticPath = path.join(__dirname, './views')//4

app.use(serve(staticPath));//5

//9 - public의 경로와 views의 경로에 같은 파일이 있으면 구별이 안된다.
app.use(mount('/public', serve('src/public'))) //처리-이벤트- 말하기
//서버는 5000번 포트를 열어놓고 기다린다. -waiting
//시간정보는 서버에서 제공하다.
//타임서버를 구현한다.
let curtime = '' //전변-다른 함수나  {} 안에서도 호출할 수 있다.
const setClock = () => {
  const timeInfo = new Date()
  const hour = modifyNumber(timeInfo.getHours())
  const min = modifyNumber(timeInfo.getMinutes())
  const sec = modifyNumber(timeInfo.getSeconds())
  curtime = hour+':'+min+':'+sec
}

const modifyNumber = (num) => {
  if(parseInt(num) < 10){
    return "0"+num
  }else{
    return num
  }
}
//기본 라우터 설정하기
app.use(async(ctx) => {
  //1초마다 한 번씩 setClock호출됨
  //괄호는 없어도 괜찮아. 왜냐면 함수도 객체다
  //함수도 파라미터로 사용이 가능하다. - 일급함수
  //전변 curtime에 현재 시간이 담긴다.
  await setInterval(setClock, 1000)
  if(ctx.path === '/'){
    ctx.type = 'text/html'
    //index.html문서가 하는 일을 여기에 작성해 본다.
    ctx.body = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <title>welcome</title>
      </head>
      <body>
        <h1>Welcome to the koa server</h1>
      </body>
      </html>    
    `
  }
  //http://localhost:5000/talk
  else if(ctx.path === '/login'){
    await send(ctx, 'login.html', {root:staticPath})
  }
  else if(ctx.path === '/talk'){
    await send(ctx, 'talk.html', {root:staticPath})
  }
  else if(ctx.path === '/notice'){
    await send(ctx, 'notice.html', {root:staticPath})
  }
  else{
    ctx.status = 404
    ctx.body = 'Page Not Found'
  }
});//end of use
const chats = ''
//앞에 대화 내용을 가져오는 함수  배치하기
const getChatsCollection = async() => {
  console.log('getChatsCollection 호출');
  //firestore api
  const q = query(collection(db, 'talk250529'))
  console.log('q');
  const snapshot = await getDocs(q)
  console.log('snapshot');
  //data는 n건의 정보를 쥐고 있다.[{},{},{}], {[{},{},{}]}
  //forEach문 map문
  const data = snapshot.docs.map(doc => doc.data())
  console.log(data);
  return data
}//end of getChatsCollection


// npm i koa-route 먼저 설치한다.
// 왜나면 koa-websocket과 koa-route 서로 의존관계 있다.
// Using routes
app.ws.use(
  //ws는 websocket을 의미한다.
  //-> /test/:id로 요청이 오면 아래를 처리하라.
  route.all('/ws', async(ctx) => {
    console.log('새로 입장한 사람이라면.....여기부터 시작함.');
    //아래 함수는 firestore에서 데이터를 읽어오기 - Back-End(NodeJS, Spring Boot, python, C#)
    //DB를 연동하는 코드가 안보인다
    const talks = getChatsCollection()
    //앞에 문자열을 붙여서 출력하는 경우 아닌 경우와 출력 결과가
    //다르다 기억함. - 같은 경우도 있다.- 그래서 햇갈린다. HTMLElement...
    //console.log('talks : '+ talks);
    console.log(talks);
    /*
    ctx.websocket.send(JSON.stringify({
      //클라이언트가 입장했을 때 sync인지 talk인지를 결정한다.- 서버
      //그래서 서버가 결정해야 하므로 type에는 상수를 쓴다.
      type:'sync',//firestore에서 가져온다.
      payload: {
        talks,//변수 - talks담긴 값은 어디서 가져오나요?
      }
    }))
    */
    //Ping/Pong설정하기
    //일정시간이 지나면 연결이 끊어진다. - 아무런 움직임이 없는 상태로.....
    const interval = setInterval(()=>{
      if(ctx.websocket.readyState === ctx.websocket.OPEN){
        //서버측에서 ping 메시지 전송한다.
        ctx.websocket.ping()
      }
    },30000) //30초마다 ping전송

    ctx.websocket.on('pong',()=>{
      console.log('클라이언트로 부터 pong메시지 수신');
    })

    //클라이언트 측에서 요청이 오면 콜백 핸들러가 반응함.
  ctx.websocket.on('message', async(data) => {
    //클라이언트가 보낸 메시지를 출력한다.
    console.log(typeof data);//object이다 .{type:'',payload:{}}
    if(typeof JSON.stringify(data) !== 'string'){
      return;//if문에서 return을 만나면 탈출함- 콜백 핸들러 빠져나감.
    }
    //string이면 여기로 온다.
    const { nickname, message } = JSON.parse(data)
    console.log(`${nickname}, ${message}, ${curtime}`);

    try {
      //예외가 발생할 가능성이 있는 코드 작성한다.
      //만일 예외가 발생하지 않으면 catch문 실행기회를 가지 않는다.
      const docRef = await addDoc(collection(db, 'talk250529'),{
        type: 'talk',
        payload: {
          nickname: nickname,
          message: message,
          curtime: curtime
        }
      })//end of addDoc
      //여기까지 진행이 되었다면
      console.log('저장성공');
    } catch (error) {
      console.error('저장 실패.',error);
    }
    /******************************************************************
     * BroadCaste 섹션
     * 
     ******************************************************************/
    /*
    문제제기 - 현재는 메시지를 보낸 사람에게만 돌려주고 있는 유니케스트이다.
    만일 모든 사람에게 메시지를 보내고 싶다면 어떻게 해야 할까?
    브로드캐스트 처리를 하면 된다.
    */
    //서버에 접속한 여러 클라이언트에 대한 접점(소켓-서버에 있지만 client소켓)
    //서버에 있는 소켓이지만 클라이언트 소켓이므로 청취한 메시지를 쓸 수 있다(말할 수있다.)
    const { server } = app.ws
    //null에 대한 체크를 한다. - 안전성
    //server가 널이면 속성이나 함수를 호출할 수 없다.
    if(!server){//앞에 not이 있다.
      return //return을 만나면 use함수 전체를 탈출함.
    }
    //clients - 소켓 여러개
    //client - 한개 소켓
    //물리적으로 떨어져 있는 클라이언트 소켓 정보를 서버에서 쥐고 있다.
    //서버가 쥐고 있는 모든 클라이언트에게 메시지를 보낸다.
    server.clients.forEach(client => {
      //if(client.readyState === client.CLOSED){
      //if(client.readyState === client.OPEN){
      client.send(JSON.stringify({
        type: 'talk',
        payload: {
          nickname:nickname,
          message: message,
          curtime: curtime, //ES5
        }
      }))//end of send
      //}//end of if
    })//end of forEach
  });
}));



app.listen(5000);