const currentTime = new Date()
currentTime.getTime() // getXXXX():리턴값이 있다.
const x = currentTime.getTime()
console.log(x);

const hour = currentTime.getHours()
console.log(hour);
const min = currentTime.getMinutes()
console.log(min);
const sec = currentTime.getSeconds()
console.log(sec);


const modifyNumber2 = (num) => {
  if(parseInt(num) < 10){
    return "0"+num
  }else{
    return num
  }
}

console.log(modifyNumber2(3))
console.log(modifyNumber2(13))