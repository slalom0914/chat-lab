//문제제기
//네트워크 문제,  서버 의도적인 종료, 클라이언트 의도적인 종료, 프록시, 방화벽
//인증실패(400,401,403), 
//운영 기준, 연결 종료
//끊김 감지는 하는 코드 작성
//자동으로 재연결
//안정적으로 서비스 지원 코드를 작성하기
//함수활용 능력
;(()=>{
  let socket = null;//WebSocket
  let reconnectAttempts = 0
  const MAX_RECONNECT_ATTEMPTS = 5
  const RECONNECT_INTERVAL = 3000
  //소켓이 끊긴 경우 새로운 소켓객체를 생성하기
  const reconnectWebSocket =()=>{
    if(reconnectAttempts >= MAX_RECONNECT_ATTEMPTS){
      console.log('최대 재연결 시도 횟수를 초과했습니다.');
      alert('서버와의 연결이 불안정합니다. 페이지를 새로고침해보세요.')
      return //if문을 감싸고 있는 함수를 빠져나간다.
    }
    console.log('재연결 하고 있습니다. 잠시만 기다려 주세요...');
    reconnectAttempts++
    try {
      socket = new WebSocket(`ws://${window.location.host}/ws`)
    } catch (error) {
      console.error('웹소켓 재연결 실패', error);
      //setInterval과 다른 점은 3초 후에 딱 한번만 호출함.
      //내 안에서 나를 다시 호출하기 - 재귀
      setTimeout(reconnectWebSocket, RECONNECT_INTERVAL)
    }
  }//end of reconnectWebSocket

  const setupWebSocketHandlers = () => {
    console.log('setupWebSocketHandlers');
    socket.onopen = () => {
      console.log('WebSocket 연결됨');
      //연결이 되면 재시도 변수는 초기화 - 잘하는 사람
      reconnectAttempts = 0
    }
    socket.onclose = () => {
      console.log('WebSocket 연결종료됨');
      setTimeout(reconnectWebSocket, RECONNECT_INTERVAL)
    }
    //함수에서 파라미터 자리
    //특히 콜백함수에서 외부 에서 주입해주는 객체 또는 값 
    socket.onerror = (error) => {
      console.log('WebSocket 에러발생함');
    }
    //만일 여기까지 문제없이 진행되었다면 메시지 처리 해줄께
    //onmessage이벤트 핸들러는 웹소켓이 제공하는 이벤트 핸들러 이다.
    socket.addEventListener('message', handleMessage)
  }//end of setupWebSocketHandlers
  //{type:'talk|sync', payload:{nickname,message, curtime}}
  const handleMessage = (event) => {
    console.log('handleMessage');
    const { type, payload } = JSON.parse(event.data) //[object Obejct] ''
    console.log(type);
    console.log(payload);
    //너 이전 대화 내용 원해
    if('sync' === type){
      console.log('sync');
      //insert here - 서버에서 청취한 object를 chats배열에 push한다.
      const { talks: syncedChats } =  payload
      Object.keys(syncedChats).map(key => {
        chats.push(syncedChats[key].payload)
      })
    }
    else if('talk' === type){
      console.log('talk');
      //insert here - 서버에서 청취한 object를 chats배열에 push한다.
      const talk = payload
      console.log(talk);
      //console.log(JSON.stringify(talk));
      chats.push(talk)
      console.log(chats);
    }
    //화면에 반영하기
    //if문이나 else if문 안에 적지 않습니다.- 위치
    //공통이니까 - 이전 대화내용도 렌더링대상이고 새 대화내용도 렌더링해야 되니까...
    drawChats()//sync일때나 talk일때 공통이다.
  }//end of handleMessage


  //닉네임 입력받기
  let myNickName = prompt('닉네임을 입력하세요', 'default')
  //채팅화면 타이틀 변경
  const title = document.querySelector('#title')
  if(myNickName !=null){
    title.innerHTML = `{{${myNickName}}} 님의 예약 상담`
  }


  socket = new WebSocket(`ws://${window.location.host}/ws`)
  setupWebSocketHandlers()
  
  //사용자가 입력한 메시지를 서버로 전송해 본다.
  const formEl = document.querySelector('#form')
  const inputEl = document.querySelector('#input')
  const chatsEl = document.querySelector('#chats')
  //사용자가 입력한 값에 대한 유효성 체크 - 바닐라스크립트
  //& 이거나 && 결과는 같다 - 교집합
  //차이는 두 개이면 첫조건이 false일 때 뒤 조건은 따지지 않음
  if(!formEl || !inputEl || !chatsEl){
    throw new Error('formEl or inputEl or chatsEl is null')
  }
  //아래 배열은 서버에서 보내준 정보를 담는 배열이다. - 청취한 정보가 담긴다.
  //청취하기는 onmessage이벤트 핸들러 처리한다.
  const chats = [] //선언만 했다. onmessage채운다.-> push
  //사용자가 입력한 메시지를 보내는 것은 submit에서 한다.
  formEl.addEventListener('submit',(e)=>{
    //페이지가 refresh되지 않고 다음 액션을 정상적으로 
    //처리하도록 이벤트 전이를 막음
    e.preventDefault()
    //데이터를 직렬화 하는 방법은 여러가지가 있는데 가장 쉬운 방법이 JSON.stringify()사용하는 것임.
    //아래 send함수는 string이나 버퍼류, blob 등만 전달할 수 있다.
    //그래서 문자열로 변환하여 전달해야 한다. JSON.stringify(), JSON.parse()
    //데이터를 object로 직접 보낼 수가 없다.
    //데이터를 소켓통신으로 전송하기 전에 JSON.stringify로 감싸주는것 이것도 전처리인 것이다.
    socket.send(JSON.stringify({
      nickname: myNickName,
      message: inputEl.value}))
    inputEl.value = '' //후처리 //서버측 출력
  })
  //화면과 로직은 분리한다.
  //화면에 표시할 때 마다 배열 전체를 다시 그린다.
  const drawChats = () => {
    chatsEl.innerHTML = '' //현재 대화 목록을 비운다.
    chats.forEach(({nickname, message, curtime}) => {
      const div = document.createElement('div')
      div.innerText = `[${nickname}] : ${message} (${curtime})`
      //바깥쪽div에 안쪽 div추가한다. - appendChild
      chatsEl.appendChild(div)
    })
    //새로운 메시지가 추가되면 자동으로 스크롤을 맨 아래로 이동하기
    chatsEl.scrollTo = chatsEl.scrollHeight
  }//end of drawChats
  //종료 버튼을 눌렀을 때 이벤트 처리는 사전에 사용자가 선 진행 후에 
  //호출되는 함수 이므로 위치 문제에 대해서는 관대한 편이다.
  //단 다른 기능을 처리하는 함수 안에서 사용하는 것은 아니다.
  //이벤트 소스를 먼저 선언하기
  //exit는 <button id='exit'>
  //버튼은 사용자 누른다. - 감지는 브라우저가 한다.
  //인터셉트 할께 -> 클릭했을 때 채팅 창을 나가기 하려구 그래
  const exit = document.querySelector('#exit')
  exit.addEventListener('click', (event)=>{
    alert('채팅창이 종료됩니다.')
    window.location.href = '/'
  })//end of exit

})()