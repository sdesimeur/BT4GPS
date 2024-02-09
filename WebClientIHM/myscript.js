var myCharacteristic;
var myDevice;
var myServer;
var myService;

const log = console.log;

function connectToDevice () {
  navigator.bluetooth.requestDevice({ filters: [{ services: ['00001819-0000-1000-8000-00805f9b34fb'] }] })
  .then(device => {
    myDevice = device;
    device.ongattserverdisconnected = handleDisconnected;
    log('Connecting to GATT Server...');
    return myDevice.gatt.connect();
  })
  .then(server => {
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
    }
    //myCharacteristic.startNotifications().then(_ => {
    //  log('> Notifications started');
    //})
    //.catch(error => { console.error(error); });
  })
  .catch(error => { 
    console.error(error);
  });
}

function handleDisconnected (r) {
  console.error(r);
}

function handleNotifications(event) {
  let value = event.target.value;
  log('> ' + value.getInt32(4, true));
}
