const { keys } = require('./config/config.js');
const { 
  simulationLinkyModule, 
  previsionParabol, 
  simulationSeasonCoef,
  location } = require('./utils/utils.js');
let { config, SnSrSimul } = require('./config/config.js');

const express = require('express');
const colors = require('colors');
const axios = require('axios');

const app = express();

const productionPV = 300;
let historyLinkyData = [];

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*"); // keep this if your api accepts cross-origin requests
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.get('/realtime', (req, res) => {
  res.send(historyLinkyData);
});

app.get('/prevision', (req, res) => {
  let sunRise = 0;
  let sunSet = 0;
  let j = 0;

  axios.get('https://ipapi.co/json')
    .then((postion) => {
      axios.get(`https://dataservice.accuweather.com/locations/v1/cities/geoposition/search?apikey=${keys.actuWeather}&q=${postion.data.latitude}%2C%20${postion.data.longitude}`)
        .then((city) => {
          axios.get(`https://dataservice.accuweather.com/forecasts/v1/daily/5day/${city.data.Key}?apikey=${keys.actuWeather}&language=fr-FR&metric=true&details=true`)
            .then((weather) => {
              sunRise = weather.data.DailyForecasts[1].Sun.EpochRise; // SUN RISE OF NEXT DAY
              sunSet = weather.data.DailyForecasts[1].Sun.EpochSet; // SUN SET OF NEXT DAY

              let prevision = previsionParabol(sunSet, sunRise);
              let seasonCoef = simulationSeasonCoef(sunSet);
              axios.get(`https://api.openweathermap.org/data/2.5/forecast/hourly?lat=47.21725&lon=-1.55336&appid=${keys.openWeatherMap}`)
                .then(result => {
                  for (i = 0; i < 48; i += 2) {
                    prevision[i] *= (1 - (result.data.list[j++].clouds.all / 200) + 0.5) * productionPV * seasonCoef;
                  }
                  for (i = 1; i < 48; i += 2) {
                    if(i+1 < 48) {
                      prevision[i] = (prevision[i - 1] + prevision[i + 1]) / 2;
                    } else {
                      prevision[i] = 0;
                    }
                  }
                })
                .then(() => {
                  res.send(prevision);
                })
            })
        })
    })
});

app.get('/localisation', (req, res) => {
  axios.get('https://ipapi.co/json')
    .then((result) => {
      res.send({"lat": result.data.latitude, "lng": result.data.longitude});
    })
});

app.listen(config.port, () => {
  console.log(colors.bgGreen(colors.black(`Server is up on ${config.port}`)));
});

setInterval(() => {
  let newLinkyData = simulationLinkyModule(SnSrSimul);
  if(historyLinkyData.length >= config.history) { 
    historyLinkyData.splice(0,1);
  }
  historyLinkyData.push(newLinkyData);
  SnSrSimul = Object.assign({}, newLinkyData);
}, config.uptime);