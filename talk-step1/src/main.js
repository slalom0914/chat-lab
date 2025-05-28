const Koa = require('koa')
const app = new Koa();

// response
//router.get(req, res, next)
//ctx.request, ctx.response
app.use(async(ctx, next) => {
  ctx.body = 'Hello Koa';
  await next() //다음 미들웨어 이동된다.
  //next를 만나면 다음 미들웨어로 이동한다.
});

app.use(async(ctx) => {
  ctx.body = `<${ctx.body}>`
})

app.listen(5000);