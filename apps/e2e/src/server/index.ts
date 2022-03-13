// import express from 'express'
//
// const app = express()
//
// app.use(express.json())
// app.use(express.urlencoded({ extended: true }))
//
// app.post('/webhooks/runtime1/push-github', function (req, res) {
//     res.send('ok (runtime1 push-github)')
// })
//
// app.post('/webhooks/runtime2/push-github', function (req, res) {
//     res.send('ok (runtime2 push-github)')
// })
//
// app.post('/webhooks/runtime2/push-bitbucket', function (req, res) {
//     res.send('ok (runtime2 push-bitbucket)')
// })
//
// app.use('*', (req,res) => {
//     res.send('wtf')
// })
//
// const port = 3001
// app.listen(port, () => {
//     console.log(`Test server is listening on ${port}`)
// })
