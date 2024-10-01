export default class Constant {
	static maxZoom = 1.9;
	static minZoom = 0.9;
	static get zoomRange() {
		return Constant.maxZoom - Constant.minZoom;
	}
	static version = '2.1';
}
