//alert('client.js loaded....')
//브라우저 개발 도구에서 socket객체를 직접 호출하면 외부에 노출 위험이 있다.
//즉시 실행 함수로 처리함. - IIFE - 바로 정의해서 호출하는 함수
;(()=>{
  //닉네임 입력받기
  let myNickName = prompt('닉네임을 입력하세요', 'default')
  //채팅화면 타이틀 변경
  const title = document.querySelector('#title')
  if(myNickName !=null){
    title.innerHTML = `{{${myNickName}}} 님의 예약 상담`
  }
  const socket = new WebSocket(`ws://${window.location.host}/ws`)
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
  const drawChats = () => {
    //insert here
    chatsEl.innerHTML = '' //현재 대화 목록을 비운다.
    //div안에 새로운 div를 만들어서 채운다.<div><div>안쪽에 입력된다.</div></div>
    //[키위] : 안녕하세요 (12:37:50)
    //chats는 배열이다.
    chats.forEach(({nickname, message, curtime}) => {
      const div = document.createElement('div')
      div.innerText = `[${nickname}] : ${message} (${curtime})`
      //바깥쪽div에 안쪽 div추가한다. - appendChild
      chatsEl.appendChild(div)
    })
  }//end of drawChats
  //사용자가 입력한 메시지를 서버에서 보내주면 화면 출력한다.
  //파라미터 자리는 사용자가 입력한 값을 담는 자리이다.
  //누가 넣어주나요? 아래 이벤트는 소켓통신이 호출하는 콜백함수이다.
  //콜백함수는 개발자가 호출하는 함수가 아니다. 그러면 누가? 시스템에서
  //이벤트가 감지되었을 때(상태값이 변경될때마다)
  //서버에서 전송한 메시지를 모두 다 받았을 때 주입된다.
  //{data:{type:'', payload:{nickname:'키위',message:'메시지',curtime:''}}}
  socket.addEventListener('message', function(event){
    const { type, payload } = JSON.parse(event.data)
    console.log('type ==> '+ type);
    console.log('payload ==> '+ payload);//[object Object] - Dataset - 백엔드
    console.log('nickname ==> '+ payload.nickname);
    console.log('message ==> '+ payload.message);
    console.log('curtime ==> '+ payload.curtime);
    //아래 조건문에서 사용하는 type은 어디서 가져오나요?
    //
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
      chats.push(talk)
    }
    drawChats()//sync일때나 talk일때 공통이다.
    //반드시 조건문 밖에서 호출할것. -위치
    //서버에서 보낸 메시지 청취하기
    chats.push(JSON.parse(event.data))//청취한 메시지를 배열에 담는다.
    chatsEl.innerHTML = '' //화면 초기화
    chats.forEach(({nickname, message}) => {//배열에 담긴 여러 메시지를 출력한다
      const div = document.createElement('div')
      div.innerText = `${nickname}: ${message}[12:34]`
      chatsEl.appendChild(div)
    })
  })//end of event listener
})()