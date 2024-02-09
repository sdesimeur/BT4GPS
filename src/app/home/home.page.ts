import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, Input, NgZone, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { IonHeader, IonToolbar, IonTitle, IonContent } from '@ionic/angular/standalone';
import { FormsModule } from '@angular/forms';
import { Geolocation, PositionOptions, WatchPositionCallback, Position } from '@capacitor/geolocation';
import { BatteryInfo, Device } from '@capacitor/device';
//import * as blePeripheral from 'cordova-plugin-ble-peripheral/www/blePeripheral.js';
const blePeripheral = require('cordova-plugin-ble-peripheral/www/blePeripheral.js');

const watchPositionOptions: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 1000,
  maximumAge: 0,
}

const SERVICE_UUID_BATTERY: string = "0000180f-0000-1000-8000-00805f9b34fb";
const CHARACTERISTIC_UUID_BATTERY: string = "00002a19-0000-1000-8000-00805f9b34fb";

const SERVICE_UUID_LN: string = "00001819-0000-1000-8000-00805f9b34fb";
const CHARACTERISTIC_UUID_LN_FEATURE: string = "00002a6a-0000-1000-8000-00805f9b34fb";
const CHARACTERISTIC_UUID_LocationAndSpeedCharacteristic: string = "00002a67-0000-1000-8000-00805f9b34fb";
const CHARACTERISTIC_UUID_NAVIGATION: string = "00002a68-0000-1000-8000-00805f9b34fb";

const BatteryService = {
  uuid: SERVICE_UUID_BATTERY,
  characteristics: [
      {
          uuid: CHARACTERISTIC_UUID_BATTERY,
          properties: blePeripheral.properties.READ | blePeripheral.properties.NOTIFY,
          permissions: blePeripheral.permissions.READABLE,
          descriptors: [
              {
                  uuid: '2901',
                  value: 'Battery Level'
              },
          ]
      }
  ]
};
 
const locationAndNavigationService = {
  uuid: SERVICE_UUID_LN,
  characteristics: [
      {
          uuid: CHARACTERISTIC_UUID_LN_FEATURE,
          properties: blePeripheral.properties.READ,
          //properties: blePeripheral.properties.READ | blePeripheral.properties.NOTIFY,
          permissions: blePeripheral.permissions.READABLE,
          descriptors: [
              {
                  uuid: '2901',
                  value: 'LN Feature Characteristic'
              }
          ]
      },
      {
          uuid: CHARACTERISTIC_UUID_LocationAndSpeedCharacteristic,
          properties: blePeripheral.properties.NOTIFY,
          //properties: blePeripheral.properties.READ | blePeripheral.properties.NOTIFY,
          permissions: blePeripheral.permissions.READABLE,
          descriptors: [
              {
                  uuid: '2901',
                  value: 'Location and Speed Characteristic'
              }
          ]
      },
      {
        uuid: CHARACTERISTIC_UUID_NAVIGATION,
        properties: blePeripheral.properties.NOTIFY,
        //properties: blePeripheral.properties.READ | blePeripheral.properties.NOTIFY,
        permissions: blePeripheral.permissions.READABLE,
        descriptors: [
            {
                uuid: '2901',
                value: 'Navigation'
            }
        ]
    },
  ]
};

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, FormsModule],
})

export class HomePage {

  lastTimeBatteryPublished: number = 0;

  constructor() {
    blePeripheral.createServiceFromJSON(locationAndNavigationService);
    blePeripheral.createServiceFromJSON(BatteryService);
    //blePeripheral.startAdvertising(BatteryService.uuid, 'Battery Level');
    blePeripheral.startAdvertising(locationAndNavigationService.uuid, 'LN Feature').then(() => {
      let ret: DataView = new DataView((new Uint8Array(4)).fill(0).buffer);
      ret.setUint8(0, 0x5D);
      const tmp = new Uint8Array(ret.buffer);
      const tmp1 = tmp.buffer;
      blePeripheral.setCharacteristicValue(SERVICE_UUID_LN, CHARACTERISTIC_UUID_LN_FEATURE, tmp1);
    })
  }

  _checked : boolean = false;
  public set isChecked (a: boolean) {
    if (a) {
      this.activateLocation();
    } else {
      this.deactivateLocation();
    }
	  this._checked = a;
  }
  public get isChecked (): boolean {
	  return this._checked;
  }

  watchPositionId: string|undefined = undefined;

  parseNewLocation: WatchPositionCallback = async (location: Position | null, err: any) => {
    let ret: DataView = new DataView((new Uint8Array(20)).fill(0).buffer);
    ret.setUint16(0, 0x10DD, true);
    if (location !== null) {
      if (location.coords.speed !== null) ret.setUint16(2, Math.round(location.coords.speed), true);
      if (location.coords.latitude !== null) ret.setInt32(4, Math.round(location.coords.latitude * 10000000), true);
      if (location.coords.longitude !== null) ret.setInt32(8, Math.round(location.coords.longitude * 10000000), true);
      if (location.coords.altitude !== null) ret.setInt16(12, Math.round(location.coords.altitude), true);
      if (location.coords.altitude !== null) ret.setInt16(12, Math.round(100 * location.coords.altitude), true);
      ret.setUint32(16, Math.round(location.timestamp / 1000), true);
      const tmp = new Uint8Array(ret.buffer);
      const tmp1 = tmp.buffer;
      console.log(tmp1);
      blePeripheral.setCharacteristicValue(SERVICE_UUID_LN, CHARACTERISTIC_UUID_LocationAndSpeedCharacteristic, tmp1);
    }

    const nowdate : number = Date.now() + 5 * 60 * 1000;
    if (nowdate > this.lastTimeBatteryPublished) {
      this.lastTimeBatteryPublished = nowdate;
      const bat: BatteryInfo = await Device.getBatteryInfo();
      const batlevel: number|undefined = bat.batteryLevel;
      if (batlevel !== undefined) {
        const ret: DataView = new DataView((new Uint8Array(1)).buffer);;
        ret.setUint8(0, Math.round(100 * batlevel));
        const tmp = new Uint8Array(ret.buffer);
        const tmp1 = tmp.buffer;
        blePeripheral.setCharacteristicValue(SERVICE_UUID_BATTERY, CHARACTERISTIC_UUID_BATTERY, tmp1);
      }
    }
    console.log(location);
  }

  deactivateLocation = async () => {
    if (this.watchPositionId === undefined) return;
    Geolocation.clearWatch({id: this.watchPositionId});
    this.watchPositionId = undefined;
  }

  async activateLocation () {
    if (this.watchPositionId !== undefined) return;
    this.watchPositionId = await Geolocation.watchPosition(watchPositionOptions, this.parseNewLocation.bind(this) as WatchPositionCallback);
  }


  bytesToString(dataView: DataView): string {
    const tmp =  dataView.buffer;
    const tmp1 = [...new Uint8Array(tmp)];
    return String.fromCharCode.apply(null, tmp1);
  }

// only works for ASCII characters
  stringToBytes(string: string): DataView {
    var array = new Uint8Array(string.length);
    for (var i = 0, l = string.length; i < l; i++) {
        array[i] = string.charCodeAt(i);
    }
    return new DataView(array.buffer);
  }
}
