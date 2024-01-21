import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, Input, NgZone, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { IonHeader, IonToolbar, IonTitle, IonContent } from '@ionic/angular/standalone';
import { FormsModule } from '@angular/forms';
import { Geolocation, PositionOptions, WatchPositionCallback, Position } from '@capacitor/geolocation';


const watchPositionOptions: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 1000,
  maximumAge: 0,
}


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
}
