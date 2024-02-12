var myCharacteristic;
var myDevice = undefined;
var myServer;
var myService;

var deviceConnected = false;

const log = console.log;

function setCookie(cname, cvalue, exdays) {
  const d = new Date();
  d.setTime(d.getTime() + (exdays*24*60*60*1000));
  let expires = "expires="+ d.toUTCString();
  //const tmp = cname + "=" + cvalue + "; SameSite=None; " + expires + ";path=/";
  //const tmp = cname + "=" + cvalue + "; SameSite=None; path=/";
  const tmp = cname + "=" + cvalue + "; path=/";
  document.cookie = tmp;
  console.log(document.cookie);
  console.log(document);
}

function getCookie(cname) {
  let name = cname + "=";
  let ca = document.cookie.split(';');
  for(let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) == ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
      return c.substring(name.length, c.length);
    }
  }
  return "";
}

async function connectToDevice (t) {
  myDevice = await navigator.bluetooth.requestDevice({ filters: [{ services: ['00001819-0000-1000-8000-00805f9b34fb'] }] });
  connectToDeviceHandle();
}


function connectToDeviceHandle() {
  myDevice.ongattserverdisconnected = handleDisconnected;
  log('Connecting to GATT Server...');
  myDevice.gatt.connect().then(server => {
    deviceConnected = true;
    setCookie("registeredDevice", myDevice.name, 365);
    myServer = server;
    log('Getting Battery Service...');
    return myServer.getPrimaryService('00001819-0000-1000-8000-00805f9b34fb');
  })
  .then(service => {
    myService = service;
    log('Getting Location and Speed Characteristic Characteristic...');
    return myService.getCharacteristic('00002a67-0000-1000-8000-00805f9b34fb');
  })
  .then(async characteristic => {
    log('Reading Battery Level...');
    myCharacteristic = characteristic;
    myCharacteristic.oncharacteristicvaluechanged =  handleNotifications;
    try {
      let data = await myCharacteristic.startNotifications();
    } catch (e) {
      console.error(e)
      myDevice.handleDisconnected();
    }
    //myCharacteristic.startNotifications().then(_ => {
    //  log('> Notifications started');
    //})
    //.catch(error => { console.error(error); });
  })
  .catch(error => {
    deviceConnected = false;
    console.error(error);
  });
}

function handleDisconnected (r) {
  deviceConnected = false;
  console.log(r);
}

function handleNotifications(event) {
  const value = event.target.value;
	console.log(value);
  var mygps = new gpsbtle(value);
  console.log("Speed: " + mygps.getXXX('SPEED'));
  console.log("Altitude: " + mygps.getXXX('ELEVATION'));
  console.log("Latitude: " + mygps.getXXX('LATITUDE'));
  console.log("Longitude: " + mygps.getXXX('LONGITUDE'));
  console.log("Heading: " + mygps.getXXX('HEADING'));
  console.log("Time: " + mygps.getXXX('UTC_TIME'));
}


async function connectToPreviousDevice () {
  var tmp = getCookie("registeredDevice");
    if (tmp) {
      myDevice = await navigator.bluetooth.requestLEScan({ filters: [{ services: ['00001819-0000-1000-8000-00805f9b34fb'], name: tmp}] });
      this.connectToDeviceHandle();
    }
}

document.addEventListener("DOMContentLoaded", async () => {
  /*setInterval(() => {
    if (deviceConnected) return;
    var tmp = getCookie("registeredDevice");
    if (tmp) {
      myDevice = JSON.parse(tmp);
      connectToDeviceHandle();
    }
  }, 5000);*/
});