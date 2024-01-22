import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, Input, NgZone, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { IonHeader, IonToolbar, IonTitle, IonContent } from '@ionic/angular/standalone';
import { FormsModule } from '@angular/forms';
import { Geolocation, PositionOptions, WatchPositionCallback, Position } from '@capacitor/geolocation';
import * as blePeripheral from 'cordova-plugin-ble-peripheral/www/blePeripheral.js';

const watchPositionOptions: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 1000,
  maximumAge: 0,
}

const SERVICE_UUID: string = "00001819-0000-1000-8000-00805f9b34fb";
const CHARACTERISTIC_UUID_LN_FEATURE: string = "00002a6a-0000-1000-8000-00805f9b34fb";
const CHARACTERISTIC_UUID_LocationAndSpeedCharacteristic: string = "00002a67-0000-1000-8000-00805f9b34fb";
const CHARACTERISTIC_UUID_NAVIGATION: string = "00002a68-0000-1000-8000-00805f9b34fb";


const locationAndNAvigationService = {
  uuid: SERVICE_UUID,
  characteristics: [
      {
          uuid: CHARACTERISTIC_UUID_LN_FEATURE,
          properties: blePeripheral.property.READ,
          permissions: blePeripheral.permission.READABLE | blePeripheral.property.NOTIFY
      },
      {
          uuid: CHARACTERISTIC_UUID_LocationAndSpeedCharacteristic,
          properties: blePeripheral.property.READ | blePeripheral.property.NOTIFY,
          permissions: blePeripheral.permission.READABLE,
          descriptors: [
              {
                  uuid: '2901',
                  value: 'Locationm and Speed Characteristic'
              }
          ]
      },
      {
        uuid: CHARACTERISTIC_UUID_NAVIGATION,
        properties: blePeripheral.property.READ | blePeripheral.property.NOTIFY,
        permissions: blePeripheral.permission.READABLE,
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
  constructor() {
    blePeripheral.createServiceFromJSON(locationAndNAvigationService);
    blePeripheral.startAdvertising(locationAndNAvigationService.uuid, 'LN Feature');
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

  parseNewLocation: WatchPositionCallback = (location: Position | null, err: any) => {
    let ret = new Uint8Array(8);
    blePeripheral.setCharacteristicValue(SERVICE_UUID, CHARACTERISTIC_UUID_LocationAndSpeedCharacteristic, bytes);
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


  bytesToString(buffer: ArrayBuffer): string {
    return String.fromCharCode.apply(null, new Uint8Array(buffer));
  }

// only works for ASCII characters
  stringToBytes(string: string): ArrayBuffer {
    var array = new Uint8Array(string.length);
    for (var i = 0, l = string.length; i < l; i++) {
        array[i] = string.charCodeAt(i);
    }
    return array.buffer;
  }
}
