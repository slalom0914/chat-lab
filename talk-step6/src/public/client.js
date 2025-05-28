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
  const chats = []
  
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
  //서버에서 보낸 정보를 받아서 출력하기
  socket.addEventListener('message', (event)=>{
    //서버에서 보낸 메시지 청취하기
    chats.push(JSON.parse(event.data))
    chatsEl.innerHTML = '' //화면 초기화
    chats.forEach(({nickname, message}) => {
      const div = document.createElement('div')
      div.innerText = `${nickname}: ${message}[12:34]`
      chatsEl.appendChild(div)
    })
  })//end of event listener
})()