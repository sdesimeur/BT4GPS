#!/bin/bash

ionic capacitor run android -l --external --host=127.0.0.1 --port=8100 --watch
adb reverse tcp:8100 tcp:8100
