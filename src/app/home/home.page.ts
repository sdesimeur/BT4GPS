import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, Input, NgZone, OnInit, AfterContentInit, OnDestroy, ViewChild } from '@angular/core';
import { IonHeader, IonToolbar, IonTitle, IonContent } from '@ionic/angular/standalone';
import { FormsModule } from '@angular/forms';
//import { Geolocation, PositionOptions, WatchPositionCallback, Position, PermissionStatus, GeolocationPluginPermissions} from '@capacitor/geolocation';
import { BatteryInfo, Device } from '@capacitor/device';
//import { ForegroundService } from '@awesome-cordova-plugins/foreground-service/ngx';
//import * as blePeripheral from 'cordova-plugin-ble-peripheral/www/blePeripheral.js';
import { BleClient } from '@capacitor-community/bluetooth-le';
import { App } from '@capacitor/app';
import {registerPlugin} from "@capacitor/core";
import {BackgroundGeolocationPlugin} from "@capacitor-community/background-geolocation";
const BackgroundGeolocation = registerPlugin<BackgroundGeolocationPlugin>("BackgroundGeolocation");
const blePeripheral = require('cordova-plugin-ble-peripheral/www/blePeripheral.js');

/*const watchPositionOptions: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 2000,
  maximumAge: 200,
}*/

const SERVICE_UUID_BATTERY: string = "0000180f-0000-1000-8000-00805f9b34fb";
const CHARACTERISTIC_UUID_BATTERY: string = "00002a19-0000-1000-8000-00805f9b34fb";

const SERVICE_UUID_LN: string = "00001819-0000-1000-8000-00805f9b34fb";
const CHARACTERISTIC_UUID_LN_FEATURE: string = "00002a6a-0000-1000-8000-00805f9b34fb";
const CHARACTERISTIC_UUID_LocationAndSpeedCharacteristic: string = "00002a67-0000-1000-8000-00805f9b34fb";
const CHARACTERISTIC_UUID_NAVIGATION: string = "00002a68-0000-1000-8000-00805f9b34fb";
const CHARACTERISTIC_UUID_WAKEUP: string = "00002aff-0000-1000-8000-00805f9b34fb";

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
    {
        uuid: CHARACTERISTIC_UUID_WAKEUP,
        properties: blePeripheral.properties.WRITE_NO_RESPONSE,
        //properties: blePeripheral.properties.READ | blePeripheral.properties.NOTIFY,
        permissions: blePeripheral.permissions.WRITEABLE,
        descriptors: [
            {
                uuid: '2901',
                value: 'WakeUp'
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
  //providers: [ForegroundService],
})

export class HomePage implements OnInit, AfterContentInit, OnDestroy {
  private foregroundServiceStarted: boolean = false;

  lastTimeBatteryPublished: number = 0;

  constructor(
    private zone:NgZone,
    public ref: ChangeDetectorRef,
    //public foregroundService?: ForegroundService,
  ) {
  }


  async startBluetoothServices () {
    try {
      await blePeripheral.createServiceFromJSON(locationAndNavigationService);
    } catch (e) {console.error(e);}
    try {
      await blePeripheral.createServiceFromJSON(BatteryService);
    } catch (e) {console.error(e);}
    //blePeripheral.startAdvertising(BatteryService.uuid, 'Battery Level');
    try {
      await blePeripheral.startAdvertising(locationAndNavigationService.uuid, 'LN Feature');
    } catch (e) {console.error(e);}
    try {
      await this.writeBatteryLevel();
    } catch (e) {console.error(e);}
  }


  async writeBatteryLevel () {
    let ret: DataView = new DataView((new Uint8Array(4)).fill(0).buffer);
    ret.setUint8(0, 0x5D);
    const tmp = new Uint8Array(ret.buffer);
    const tmp1 = tmp.buffer;
    try {
      await blePeripheral.setCharacteristicValue(SERVICE_UUID_LN, CHARACTERISTIC_UUID_LN_FEATURE, tmp1);
    } catch (e) {console.error(e);}
  }


  stopForegroundService() {
    /*
    try {
      this.foregroundService?.stop();
    } catch (e) {}
    this.foregroundServiceStarted = false;
    */
  }

  async startForegroundService(){
    /*  
    if (!this.foregroundServiceStarted && (await Device.getInfo()).platform !== 'ios') {
      this.stopForegroundService();
      setTimeout(() => {
        this.foregroundServiceStarted = true;
        this.foregroundService?.start('BT4GPS Running', 'Background Service', 'drawable/ic_notification', 1, 535244535244);
      }, 10000)
    }
    */
  }


  quitAppl () {
    App.exitApp();
  }

  ngOnDestroy () {
      this.deactivateLocation();
  }

  ngOnInit() {
    this.ngOnInitHandle();
  }

  ngAfterContentInit () {
    this.afterContentInitHandle();
  }
  

  async ngOnInitHandle () {
  }

  async afterContentInitHandle () {
    try {
      await BleClient.initialize({ androidNeverForLocation: true });
      this.bluetoothEnable = await BleClient.isEnabled();
      await blePeripheral.onWriteRequest(this.didReceiveWriteRequest.bind(this));
      await BleClient.startEnabledNotifications(this.onBluetoothStateChange.bind(this));
    } catch (e) {console.error(e);}
    /*
    let resultGeolocation: PermissionStatus;
    try {
      let state: PermissionStatus = await Geolocation.checkPermissions();
      if (state.location !== 'granted') {
        try {
          await Geolocation.requestPermissions();
        } catch (e) {}
      }
      const perms: GeolocationPluginPermissions = {
	permissions: [ 'location' ]
      }
      try {
        resultGeolocation = await Geolocation.requestPermissions(perms);
      } catch (e) {}

    } catch (e) {}
    */
    //blePeripheral.bluetoothStateChange = this.onBluetoothStateChange.bind(this);
    if (this.bluetoothEnable) this.isBluetoothServicesStarted = true;
    /*
    try {
      await blePeripheral.onBluetoothStateChange(this.onBluetoothStateChange);
    } catch (e) {console.error(e);}
    */
    try {
      this.startForegroundService();
    } catch (e) {console.error(e);}
  }

  private _bluetoothEnable: boolean = false;
  public set bluetoothEnable (a: boolean) {
    if (a !== this._bluetoothEnable) {
      if (a) {
        BleClient.enable();
      } else {
        BleClient.disable();
      }
    }
    this._bluetoothEnable = a;
  }
  public get bluetoothEnable (): boolean {
    return this._bluetoothEnable;

  }

  private _isBluetoothServicesStarted: boolean = false;
  public set isBluetoothServicesStarted (a: boolean) {
    if (a) {
      this.startBluetoothServices();
    }
    this._isBluetoothServicesStarted = a;
    this.ref.detectChanges();
  }
  public get isBluetoothServicesStarted (): boolean {
	  return this._isBluetoothServicesStarted;
  }
  
  private _isWatchGpsStarted : boolean = false;
  public set isWatchGpsStarted (a: boolean) {
    if (a) {
      this.activateLocation();
    } else {
      this.deactivateLocation();
    }
    this._isWatchGpsStarted = a;
    this.ref.detectChanges();
  }
  public get isWatchGpsStarted (): boolean {
	  return this._isWatchGpsStarted;
  }

  didReceiveWriteRequest (req: any) {
    console.log(req);
  }

  async parseNewLocation (location: any | undefined, err: any) {
    if (!this.isBluetoothServicesStarted) return; 
    if (err) {
        if (err.code === "NOT_AUTHORIZED") {
            if (window.confirm(
                "This app needs your location, " +
                "but does not have permission.\n\n" +
                "Open settings now?"
            )) {
                // It can be useful to direct the user to their device's
                // settings when location permissions have been denied. The
                // plugin provides the 'openSettings' method to do exactly
                // this.
                BackgroundGeolocation.openSettings();
            }
        }
        return console.error(err);
    }

    let ret: DataView = new DataView((new Uint8Array(21)).fill(0).buffer);
    ret.setUint16(0, 0x10DD, true);
    if (location === undefined)  return;
    
    if (location.speed) ret.setUint16(2, Math.round(100 * location.speed), true); // v*100 v in m/s
    if (location.latitude !== null) ret.setInt32(4, Math.round(location.latitude * 10000000), true);
    if (location.longitude !== null) ret.setInt32(8, Math.round(location.longitude * 10000000), true);
    if (location.altitude !== null) ret.setInt32(12, Math.round(100 * location.altitude), true);
    if (location.bearing !== null) ret.setUint16(15, Math.round(100 * ((location.bearing + 360) % 360)), true);
    ret.setUint32(17, Math.round(location.time / 1000), true);
    
    const tmp11 = new Uint8Array(ret.buffer);
    const tmp12 = tmp11.buffer;
    console.log(tmp12);
    try {
      await blePeripheral.setCharacteristicValue(SERVICE_UUID_LN, CHARACTERISTIC_UUID_LocationAndSpeedCharacteristic, tmp12);
    } catch (e) {console.error(e);}

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
	try {
          await blePeripheral.setCharacteristicValue(SERVICE_UUID_BATTERY, CHARACTERISTIC_UUID_BATTERY, tmp1);
        } catch (e) {console.error(e);}
      }
    }
    console.log(location);
  }

  async deactivateLocation () {
    if (this.watchPositionId === undefined) return;
    // When a watcher is no longer needed, it should be removed by calling
    // 'removeWatcher' with an object containing its ID.
    await BackgroundGeolocation.removeWatcher({
        id: this.watchPositionId
    });
    //Geolocation.clearWatch({id: this.watchPositionId});
    this.watchPositionId = undefined;
  }

  watchPositionId: string|undefined = undefined;
  
  activateLocation () {
    BackgroundGeolocation.addWatcher(
    {
        // If the "backgroundMessage" option is defined, the watcher will
        // provide location updates whether the app is in the background or the
        // foreground. If it is not defined, location updates are only
        // guaranteed in the foreground. This is true on both platforms.

        // On Android, a notification must be shown to continue receiving
        // location updates in the background. This option specifies the text of
        // that notification.
        backgroundMessage: "Cancel to prevent battery drain.",

        // The title of the notification mentioned above. Defaults to "Using
        // your location".
        backgroundTitle: "Tracking You.",

        // Whether permissions should be requested from the user automatically,
        // if they are not already granted. Defaults to "true".
        requestPermissions: true,

        // If "true", stale locations may be delivered while the device
        // obtains a GPS fix. You are responsible for checking the "time"
        // property. If "false", locations are guaranteed to be up to date.
        // Defaults to "false".
        stale: false,

        // The minimum number of metres between subsequent locations. Defaults
        // to 0.
        distanceFilter: 10
    }, this.parseNewLocation.bind(this))
    .then((watcher_id) => {
	    this.watchPositionId = watcher_id;
    });

    //if (this.watchPositionId !== undefined) return;
    //this.watchPositionId = await Geolocation.watchPosition(watchPositionOptions, this.parseNewLocation.bind(this));
  }
  
  async onBluetoothStateChange (state: boolean) {
    state = await BleClient.isEnabled();
    if (!state) this.isBluetoothServicesStarted = false;
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
