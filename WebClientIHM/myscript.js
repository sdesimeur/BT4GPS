var myDevice = undefined;
var characteristicW = undefined;

var deviceConnected = false;
var wakeUpIntervalId = undefined;

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


async function connectToDeviceHandle() {
  myDevice.ongattserverdisconnected = handleDisconnected;
  log('Connecting to GATT Server...');
  var server = undefined;
  try {
    server = await myDevice.gatt.connect();
    deviceConnected = true;
  } catch (e) { console.log(e)}

  if (!deviceConnected) return;

  try {
    setCookie("registeredDevice", myDevice.name, 365);

    log('Getting Battery Service...');
    var service = await server.getPrimaryService('00001819-0000-1000-8000-00805f9b34fb');
    log('Getting Location and Speed Characteristic Characteristic...');
    var characteristic = await service.getCharacteristic('00002a67-0000-1000-8000-00805f9b34fb');
    log('Reading Battery Level...');
    characteristic.oncharacteristicvaluechanged =  handleNotifications;
    await characteristic.startNotifications();
  } catch (e) {
    console.error(e)
    myDevice.handleDisconnected();
    return;
  }

  try {
    characteristicW = await service.getCharacteristic('00002aff-0000-1000-8000-00805f9b34fb');
    if (wakeUpIntervalId !== undefined) {
      clearInterval(wakeUpIntervalId);
    }
    wakeUpIntervalId = setInterval(
      async () => {
        try {
          const a = new DataView(new Uint8Array(1).fill(0x00).buffer);
          await characteristicW.writeValue(a);
        } catch (e) {
          console.log(e)
        }
      }, 30000
    );
  } catch (e) {
    console.error(e)
  }
  
}

function handleDisconnected (r) {
  if (wakeUpIntervalId !== undefined) {
    clearInterval(wakeUpIntervalId);
    wakeUpIntervalId = undefined;
  }
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