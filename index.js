$(document).ready(function() {
  $('#searchWeatherForm').on('submit', function(e) {
    e.preventDefault()
    const searchInput = $('#searchInput').val()
    searchWeather(searchInput)
  })
})

/**
 * This function checks the user's input.
 * 
 * @param {string} city the city name
 * @returns nothing if the city is not found or class the fetchWeatherFromApi
 */
function searchWeather(city) {
  if (!city) {
    return
  }
  onBeforeSend()
  fetchWeatherFromApi(city)
}

/**
 * This function hides all the previous components and
 * errors if they are displayed
 */
function onBeforeSend() {
  hideComponent('#weatherData')
  hideComponent('#dayDescription')
  // removes the city not found error msg
  $('#mainDiv').find('#cityNotFound').remove()
  // removes the api error msg
  $('#mainDiv').find('#apiError').remove()
  // removes the wind direction icon
  $('#windDeg').find('i').remove()
}

/**
 * This function requests the resource from the API about weather data using AJAX calls.
 * 
 * @param {string} city the city for searching the weather
 */
function fetchWeatherFromApi(city) {
  $.ajax({
    type: "GET",
    url: `https://api.openweathermap.org/data/2.5/weather?q=${city},GR&limit=1&appid=${API_KEY}`,
    timeout: 5000,
    success: function(data, textStatus, xhr) {
        handleResults(data)
    },
    error: function(jqXHR, textStatus) { 
      //textStatus: "timeout", "error", "abort", and "parsererror"
      if (textStatus === "error") {
        $('#cityNotFound').clone().removeClass('hidden').appendTo($('#mainDiv'))
      } else {
        $('#apiError').clone().removeClass('hidden').appendTo($('#mainDiv'))
      } 
    }
  });
}

/**
 * This function handles the JavaScript object that is returned from the API. It is return in JSON
 * but automatically the AJAX with JQuery transformed the JSON to JS object.
 * 
 * @param {object} weatherData 
 */
function handleResults(weatherData) {
  let transformed = transformResponse(weatherData)

  buildWeatherObject(transformed)
}

/**
 * This function sets the weather icon and calls the {@link #buildWeatherMetadata()}
 * to handle and output the weather data.
 * 
 * @param {object} weatherData 
 */
function buildWeatherObject(weatherData) {
  // set the icon
  if (weatherData.weather[0].icon) {
    $('#weatherIcon').attr('src', `https://openweathermap.org/img/wn/${weatherData.weather[0].icon}@2x.png`).on('error', function() {
      $('#weatherIcon').addClass('hidden')
    })
  }

  buildWeatherMetadata(weatherData)
}

/**
 * This function handles the data from the object and shows the components (makes them visible).
 * 
 * @param {object} weatherData 
 */
function buildWeatherMetadata(weatherData) {
  handleLiterals(weatherData)

  showComponent('#weatherData')
  showComponent('#windDetails')
  showComponent('#dayDescription')
}

/**
 * This function adds the data to the right elements in HTML.
 * 
 * @param {object} weatherData the API's weather data.
 */
function handleLiterals(weatherData) {
  let message = "";
  message = `<em>Weather data at ${weatherData.dt} for the city ${weatherData.name}</em>`
  writeToChildrenSpan('#cityDescription', message)

  message = weatherData.weather[0].main + ', ' + weatherData.weather[0].description
  writeToChildrenSpan('#weatherDescription', message)

  writeDetails(weatherData)
  
  message = weatherData.visibility / 1000 + ' km'
  writeToChildrenSpan('#visibility', message)

  writeToChildrenSpan('#sunrise', weatherData.sys.sunrise)
  writeToChildrenSpan('#sunset', weatherData.sys.sunset)

  message = windDirection(weatherData.wind.deg) + ` (${weatherData.wind.deg}&deg;)`
  writeToChildrenSpan('#windDeg', message)
  writeToChildrenSpan('#windSpeed', weatherData.wind.speed + ' m/s')
  writeToChildrenSpan('#windGust', weatherData.wind.gust + ' m/s')
}

/**
 * This function handles a group of element where the Api key is the same with
 * the id of the element.
 * 
 * @param {object} weatherData the API's weather data.
 */
function writeDetails(weatherData) {
  $('#weatherDetails').find('[id]').each((index, item) => {
    let valueElement = $(item).children('span')
    let metadataValue = (weatherData.main[item.id]) ? weatherData.main[item.id] : '-'
    valueElement.length ? valueElement.html(metadataValue) : $(item).html(metadataValue) 
  })
}

/**
 * This is a helper function to write the data to a certain element.
 * 
 * @param {string} elementId the given element's id.
 * @param {string} message the text to be displayed.
 */
function writeToChildrenSpan(elementId, message) {
  let targetElement = $(elementId).children('span')
  targetElement.html(message)
}

/**
 * This function takes the wind direction in degrees, as measured clockwise from North.
 * It computes the cardinal direction for the given degrees. Cardinal directions
 * has 22.5 degrees range.
 * 
 * @param {Number} degrees the wind direction
 * @returns a string with the cardinal position
 */
function windDirection(degrees) {
  let cardinalDirection = [
    'N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'
  ]
  let position = Math.floor(degrees/ 22.5) % cardinalDirection.length  // the range between each cardinal direction

  let cardinalDir = cardinalDirection[position]
  // finds the respective symbol for the given cardinal direction
  setArrowIcon(cardinalDir)

  return cardinalDir
}

/**
 * This function maps the direction of the wind with the respective
 * bootstrap class for the bootstrap icon.
 *  
 * @param {string} cardinalDir 
 */
function setArrowIcon(cardinalDir) {
  let arrowsObj = {
    'bi-arrow-down': ['N'],
    'bi-arrow-down-left': ['NNE', 'NE', 'ENE'],
    'bi-arrow-left': ['E'],
    'bi-arrow-up-left': ['ESE', 'SE', 'SSE'],
    'bi-arrow-up': ['S'],
    'bi-arrow-up-right': ['SSW', 'SW', 'WSW'],
    'bi-arrow-right': ['W'],
    'bi-arrow-down-right': ['WNW', 'NW', 'NNW']
  }

 Object.keys(arrowsObj).forEach(key => {
  if (arrowsObj[key].includes(cardinalDir)) {
    $('#windDeg').append(`<i class="bi ${key}"></i>`)
  }
 })
}

/**
 * This function transforms the keys feels_like -> "feelsLike", grnd_level -> "grndLevel"
 * sea_level -> "seaLevel", temp_max -> "tempMax" ->  temp_min -> "tempMin",
 * converts the temperature from Kelvin to Celsius and
 * converts the unix time for sunrise, sunset and dt (current time) to the time in
 * Eastern European Summer Time (E.E.S.T.).
 * 
 * @param {object} weatherData
 * @returns (object) a transformed JS object with the weather data
 */
function transformResponse(weatherData) {

  // transform keys
  weatherData = replaceKeys(weatherData)
  // convert temperatures from Kelvin to Celsius
  weatherData = transformTemperature(weatherData)
  // convert time from unix time to time in the given timezone.
  weatherData = transformUnixTime(weatherData)

  // transform pressure and humidity in strings with units and symbol
  let pressure = _.get(weatherData, 'main.pressure')
  let humidity = _.get(weatherData, 'main.humidity')
  weatherData = _.set(weatherData, 'main.pressure', pressure + 'hPa')
  weatherData = _.set(weatherData, 'main.humidity', humidity + '%')

  return weatherData
}

/**
 * This method transforms the old to new ones. It uses iteration for an embedded object in order to find the keys.
 * 
 * @param {object} weatherData 
 * @returns (object): a new JavaScript object with the old key replaced by the new.
 */
function replaceKeys(weatherData) {
  const keysMap = {
    feels_like: "feelsLike",
    grnd_level: "grndLevel",
    sea_level: "seaLevel",
    temp_max: "tempMax",
    temp_min: "tempMin"
  }
  // transform to a new object
  return _.transform(weatherData, function(result, value, key) { 
    // if the key is in keysMap use the replacement, if not use the original key
    let currentKey = keysMap[key] || key;

    // if the key is an object run it through the inner function - replaceKeys
    result[currentKey] = _.isObject(value) ? replaceKeys(value, keysMap) : value; 
  });
}

/**
 * This function iteratively finds the keys for the temperature even if they are located in an embedded object and transform 
 * the values from Kelvin to Celsius.
 * 
 * @param {string} weatherData 
 * @returns (object): returns the new mapped object.
 */
function transformTemperature(weatherData) {
  let temperatureKeys = ['temp', 'feelsLike', 'tempMax', 'tempMin']

  let transformedWeatherData = _.mapValues(weatherData, (value, key) => {
    if (_.isObject(value)) {
      return transformTemperature(value)
    }
    return temperatureKeys.includes(key) ? (value - 272.15).toPrecision(3) + ' ' + '&#8451;' : value
  })
  return transformedWeatherData
}

/**
 * This function iteratively finds the keys where represent the sunrise and sunset of the day and
 * transform their value to Eastern European Summer Time (E.E.S.T.).
 * 
 * @param {object} weatherData 
 * @returns a JavaScript object
 */
function transformUnixTime(weatherData) {

  let unixKeys = ['sunrise', 'sunset', 'dt']

  return _.mapValues(weatherData, (value, key) => {
    if (_.isObject(value)) {
      return transformUnixTime(value)
    }

    return unixKeys.includes(key) ? unixToDatetime(value) : value
  });
}

/**
 * This function formats the unix timestamp in 
 * in timestamp for Eastern European Summer Time zone.
 * 
 * @param {Number} unixTimestamp 
 * @returns (string): the formatted timestamp (hh:mm:ss)
 */
function unixToDatetime(unixTimestamp) {
  let date = new Date(unixTimestamp * 1000)
  let hours = date.getHours()
  let minutes = date.getMinutes()
  let seconds = date.getSeconds()

  if (hours < 10) {
    hours = '0' + hours.toString()    // .toString is not necessary
  }
  if (minutes < 10) {
    minutes = '0' + minutes
  }
  if (seconds < 10) {
    seconds = '0' + seconds
  }

  return hours + ':' + minutes + ':' + seconds
}

/**
 * This class removes the hidden class from the element.
 * 
 * @param {string} jquerySelector 
 * @returns a jQuery object
 */
function showComponent(jquerySelector) {
  return $(jquerySelector).removeClass('hidden')
}

/**
 * This function hide the component that displays the data.
 * 
 * @param {string} jquerySelector 
 * @returns a jQuery object
 */
function hideComponent(jquerySelector) {
  return $(jquerySelector).addClass('hidden')
}
