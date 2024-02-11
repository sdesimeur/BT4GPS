

function gpsbtle (datas)  {
	this.datas = datas;
	this.EXISTs = { 'SPEED': 0,
		'TOTAL_DISTANCE': 1,
		'LATITUDE': 2,
		'LONGITUDE': 2,
		'ELEVATION': 3,
		'HEADING': 4,
		'ROLLING_TIME': 5,
		'UTC_TIME': 6 };
	this.IDXs = { 'SPEED': 0,
		'TOTAL_DISTANCE': 1,
		'LATITUDE': 2,
		'LONGITUDE': 3,
		'ELEVATION': 4,
		'HEADING': 5,
		'ROLLING_TIME': 6,
		'UTC_TIME': 7 };
	this.LENs = { 'SPEED': 2,
		'TOTAL_DISTANCE': 2,
		'LATITUDE': 4,
		'LONGITUDE': 4,
		'ELEVATION':3,
		'HEADING':2,
		'ROLLING_TIME':1,
		'UTC_TIME':4 };
	this.SIGNEDs = { 'SPEED': false,
		'TOTAL_DISTANCE': false,
		'LATITUDE': true,
		'LONGITUDE': true,
		'ELEVATION': true,
		'HEADING': false,
		'ROLLING_TIME': false,
		'UTC_TIME': false };
	this.FACTORs = { 'SPEED': 0.01,
		'TOTAL_DISTANCE': 0.1,
		'LATITUDE': 0.0000001,
		'LONGITUDE': 0.0000001,
		'ELEVATION': 0.01,
		'HEADING': 0.01,
		'ROLLING_TIME': 1,
		'UTC_TIME': 1 };
	this.setDatas = (a) => {this.datas = a;};
	this.hasXXX = (name) => {
		const lnfeatures = this.datas.getUint16(0, true);
		const bit = 1 << this.EXISTs[name];
		const test = lnfeatures & bit;
		return (test !== 0)
	};
	this.getPosition = (name) => {
		var ret = 0;
		for (const i of Object.keys(this.EXISTs)) {
			if (i === name) break;
			const isPresent = this.hasXXX(i);
			ret += isPresent?this.LENs[i]:0;
		}
		return ret;
	};
	this.getXXX = (name) => {
		const len = this.LENs[name];
		const pos = this.getPosition(name) + 2;
		var func = "";
		switch(len) {
			default:
			case 1:
				func = "8";
				break;
			case 2:
				func = "16";
				break;
			case 3:
				func = "32";
				break;
			case 4:
				func = "32";
				break;
		}
		if (this.SIGNEDs[name]) {
			func = "getInt" + func;
		} else {
			func = "getUint" + func;
		}
		var ret = this.datas[func](pos, true);
		var mask = 0xFFFFFFFF;
		mask = mask >>> (32 -  8 * len);
		ret &= mask;
		ret *= this.FACTORs[name]
		return ret;
	};
}
