let socket = new WebSocket(`ws://${location.hostname }:8081`)
const refreshRate = 200
let start_time = Date.now()

socket.onopen = function() {
  loop();
};

message_div = document.querySelector('.message')

socket.onmessage = function(event) {
  let str_data = event.data
  let JSON_data = JSON.parse(str_data)
  newData(JSON_data)
  message_div.innerHTML = JSON.stringify(JSON_data, null, 4);
}

async function loop() {
  while (true) {
    let message = {
      'message': 'data'
    }
    if (socket.readyState == socket.OPEN)
      socket.send(JSON.stringify(message))
      
    await sleep(1000/refreshRate)
  }
}

/* Chart */
var labels = [];

var data = {
  labels: labels,
  datasets: [
    {
      label: 'Gyroscope roll',
      backgroundColor: 'rgb(0, 255, 255)',
      borderColor: 'rgb(0, 255, 255)',
      data: [],
      borderWidth: 1
    },
    {
      label: 'Accelerometer roll',
      backgroundColor: 'rgb(255, 255, 0)',
      borderColor: 'rgb(255, 255, 0)',
      data: [],
      borderWidth: 1
    },
    {
      label: 'Complementary filter',
      backgroundColor: 'rgb(255, 255, 255)',
      borderColor: 'rgb(255, 255, 255)',
      data: [],
      borderWidth: 4
    },
    {
      label: 'Error',
      backgroundColor: 'rgb(255, 0, 0)',
      borderColor: 'rgb(255, 0, 0)',
      data: [],
      borderWidth: 4
    }
]
};

var config = {
  type: 'line',
  data: data,
  options: {
    elements: {
      point:{
          radius: 0
      }
    },
    animation: {
      duration: 0
    }
  }
};
const myChart = new Chart(
  document.getElementById('chart'),
  config
);

let len = 0
const max_len = 1000

function newData(data) {
  let now = Date.now();
  let lab = myChart.data.labels;
  lab.push(now - start_time)

  // Gyroscope
  let gyro = myChart.data.datasets[0].data
  gyro.push(data['currentGyro']['roll'])
  // Accelerometer
  let accel = myChart.data.datasets[1].data
  accel.push(data['currentAccel']['roll'])
  // Complementary filter
  let compl = myChart.data.datasets[2].data
  compl.push(data['orientation']['roll'])
  // Error
  let err = myChart.data.datasets[3].data
  err.push(data['error']['roll'])
  if (max_len <= len) {
    lab.shift()
    gyro.shift()
    accel.shift()
    compl.shift()
    err.shift()
  } else {
    len++;
  }
  myChart.update();
}

// Sleeps thread
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}