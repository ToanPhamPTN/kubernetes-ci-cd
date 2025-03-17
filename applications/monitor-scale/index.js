const express = require('express');
const { Etcd3 } = require('etcd3');
const app = express();
const http = require('http').Server(app);
const request = require('request');
const async = require('async');
const io = require('socket.io')(http);
const path = require("path");
const cors = require('cors');
const bodyParser = require("body-parser");
const fs = require('fs');

app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());

const etcd = new Etcd3({
  hosts: [
    "http://192.168.49.2:32379"
  ]
});

async function initializeEtcd() {
  
  try {
    await etcd.delete().prefix('pod-list/');

    const url = "https://kubernetes.default.svc/api/v1/namespaces/default/pods";

    const token = fs.readFileSync('/var/run/secrets/kubernetes.io/serviceaccount/token', 'utf8');
    const ca = fs.readFileSync('/var/run/secrets/kubernetes.io/serviceaccount/ca.crt');

    request({
      url,
      method: 'GET',
      json: true,
      headers: {
        Authorization: `Bearer ${token}`
      },
      ca: ca  
    }, async (error, response, body) => {
      if (error) {
        console.error("❌ Error fetching pods from Kubernetes:", error);
        return;
      }

      if (response.statusCode !== 200) {
        console.error("❌ Failed to get pods, status:", response.statusCode);
        return;
      }

      const pods = (body.items || [])
        .filter(pod => pod.metadata.name.startsWith("puzzle-"))
        .map(pod => pod.metadata.name);

      for (const pod of pods) {
        await etcd.put(`pod-list/${pod}`).value(pod);
      }

      console.log("✅ Initialized pod list:", pods);
    });
  } catch (error) {
    console.error("❌ Failed to initialize pod-list:", error);
  }
}

initializeEtcd();

async function watchPods() {
  const watcher = await etcd.watch().prefix('pod-list/').create();
  
  watcher.on('put', (res) => {
    console.log("Pod added:", res.key.toString());
    io.emit('pods', { pods: res.key.toString(), action: 'added' });
  });

  watcher.on('delete', (res) => {
    console.log("Pod removed:", res.key.toString());
    io.emit('pods', { pods: res.key.toString(), action: 'deleted' });
  });
}

watchPods();

app.post('/scale', function (req, res, next) {
  const scale = req.body.count;
  console.log('Count requested is: %s', scale);
  const url = "http://127.0.0.1:2345/apis/apps/v1/namespaces/default/deployments/puzzle/scale";

  var putBody = {
    metadata: { 
      name:"puzzle",
      namespace:"default"
    },
    spec: {
      replicas:1
    },
    status:{}
  };
  putBody.spec.replicas = scale;

  request({ url, method: 'PUT', json: putBody }, function (err, httpResponse, body) {
    if (err) {
      console.error('Failed to scale:', err);
      return next(err);
    }
    console.log('Response:', JSON.stringify(httpResponse));
    res.status(httpResponse.statusCode).json(body);
  });
});

app.post('/loadtest/concurrent', function (req, res) {
  const count = req.body.count;
  console.log('Count requested is: %s', count);
  const url = "http://puzzle:3000/puzzle/v1/crossword";
  const myUrls = Array(count).fill(url);

  async.map(myUrls, function (url, callback) {
    request(url, function (error, response) {
      if (response?.statusCode) {
        console.log(response.statusCode);
      } else {
        console.error("Error:", error);
      }
    });
  }, function (err, results) {
    console.log(results);
  });

  res.send('concurrent done');
});

app.post('/loadtest/consecutive', function (req, res) {
  const count = req.body.count;
  const url = "http://puzzle:3000/puzzle/v1/crossword";
  const callArray = [];

  for (let i = 0; i < count; i++) {
    callArray.push(function (cb) {
      setTimeout(() => {
        request(url, function (error, response) {
          cb(null, response?.statusCode);
        });
      }, 100);
    });
  }
  async.series(callArray, function (err, results) {
    console.log(`${results?.length || 0} requests sent.`);
  });
  res.send('consecutive done');
});

app.get('/up/:podId', async function (req, res) {
  const podId = req.params.podId;
  console.log('Server UP:', podId);
  await etcd.put(`pod-list/${podId}`).value(podId);
  res.send('up done');
});

app.get('/down/:podId', async function (req, res) {
  const podId = req.params.podId;
  console.log('Server DOWN:', podId);
  await etcd.delete().key(`pod-list/${podId}`);
  res.send('down done');
});

app.get('/hit/:podId', function (req, res) {
  const timestamp = Date.now();
  console.log("Emitting hit from", req.params.podId);
  io.emit('hit', { podId: req.params.podId, time: timestamp });
  res.send('hit done');
});

app.get('/pods', async function (req, res) {
  try {
    const pods = await etcd.getAll().prefix('pod-list/').keys();
    res.json({ pods });
  } catch (error) {
    console.error("Error fetching pods:", error);
    res.status(500).send("Error retrieving pods");
  }
});

app.delete('/pods', async function (req, res) {
  try {
    await etcd.delete().prefix('pod-list/');
    res.send('pods deleted');
  } catch (error) {
    console.error("Error deleting pods:", error);
    res.status(500).send("Error deleting pods");
  }
});

io.on('connection', function (socket) {
  console.log("WebSocket connection established.");
  socket.on('disconnect', function () {
    console.log("WebSocket disconnected.");
  });
});

app.get('/', function (req, res) {
  res.send('basic GET successful');
});

http.listen(3001, function () {
  console.log('Listening on port 3001!');
});
