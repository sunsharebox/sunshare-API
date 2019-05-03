exports.config = {
  port: 3005,
  history: 576, // each 5min 12*48h = 576
  uptime: 5000 // each 5min
}

exports.SnSrSimul = {
  starttime : new Date().getTime(),
  soutiridx: 0,
  injectidx: 0,
  prodidx: 0,
  autoconsoidx: 0,
  prodmoyidx: 0,
  prodmaxidx: 0
}