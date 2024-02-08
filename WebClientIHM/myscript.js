var myCharacteristic;

const log = console.log;

function connectToDevice () {
  navigator.bluetooth.requestDevice({ filters: [{ services: ['00001819-0000-1000-8000-00805f9b34fb'] }] })
  .then(device => {
    log('Connecting to GATT Server...');
    return device.gatt.connect();
  })
  .then(server => {
    log('Getting Battery Service...');
    return server.getPrimaryService('00001819-0000-1000-8000-00805f9b34fb');
  })
  .then(service => {
    log('Getting Location and Speed Characteristic Characteristic...');
    return service.getCharacteristic('00002a67-0000-1000-8000-00805f9b34fb');
  })
  .then(characteristic => {
    log('Reading Battery Level...');
    myCharacteristic = characteristic;
    myCharacteristic.startNotifications().then(_ => {
      log('> Notifications started');
      myCharacteristic.addEventListener('characteristicvaluechanged',
          handleNotifications);
    });
  })
  .catch(error => { console.error(error); });
}


function handleNotifications(event) {
  let value = event.target.value;
  log('> ' + value.getInt32(4, true));
}
